import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Requirement } from '../requirements/requirement.entity';
import { RequirementAttachment } from '../requirements/requirement-attachment.entity';
import { Project } from '../projects/project.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Requirement) private reqRepo: Repository<Requirement>,
    @InjectRepository(Project)     private projRepo: Repository<Project>,
    @InjectRepository(RequirementAttachment)
    private attRepo: Repository<RequirementAttachment>,
  ) {}

  async getDashboard() {
    const [totalRequisitos, requisitosAprobados, requisitosPendientes, requisitosEnRevision, proyectosActivos] = await Promise.all([
      this.reqRepo.count({ where: { deleted: false } }),
      this.reqRepo.count({ where: { deleted: false, estado: 'aprobado' } }),
      this.reqRepo.count({ where: { deleted: false, estado: 'borrador' } }),
      this.reqRepo.count({ where: { deleted: false, estado: 'en_revision' } }),
      this.projRepo.count({ where: { deleted: false, estado: 'activo' } }),
    ]);
    return { totalRequisitos, requisitosAprobados, requisitosPendientes, requisitosEnRevision, proyectosActivos };
  }

  async getMonthlyProgress() {
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const rows: { mes: number; año: number; requisitos: string; aprobados: string }[] =
      await this.reqRepo
        .createQueryBuilder('r')
        .select('MONTH(r.creadoEn)', 'mes')
        .addSelect('YEAR(r.creadoEn)', 'año')
        .addSelect('COUNT(*)', 'requisitos')
        .addSelect("SUM(CASE WHEN r.estado = 'aprobado' THEN 1 ELSE 0 END)", 'aprobados')
        .where('r.deleted = :d', { d: false })
        .andWhere('r.creadoEn >= :since', { since })
        .groupBy('YEAR(r.creadoEn)')
        .addGroupBy('MONTH(r.creadoEn)')
        .orderBy('YEAR(r.creadoEn)', 'ASC')
        .addOrderBy('MONTH(r.creadoEn)', 'ASC')
        .getRawMany();

    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    // Build last 6 months with zeros for missing months
    const result: { mes: string; requisitos: number; aprobados: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const row = rows.find(r => Number(r.mes) === m && Number(r.año) === y);
      result.push({
        mes:        MESES[m - 1],
        requisitos: row ? Number(row.requisitos) : 0,
        aprobados:  row ? Number(row.aprobados)  : 0,
      });
    }
    return result;
  }

  async getByStatus() {
    return this.reqRepo
      .createQueryBuilder('r')
      .select('r.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .where('r.deleted = :d', { d: false })
      .groupBy('r.estado')
      .getRawMany();
  }

  async getByProject() {
    return this.projRepo
      .createQueryBuilder('p')
      .leftJoin('p.requirements', 'r', 'r.deleted = :d', { d: false })
      .select('p.id', 'id')
      .addSelect('p.nombre', 'nombre')
      .addSelect('COUNT(r.id)', 'totalRequisitos')
      .addSelect('SUM(CASE WHEN r.estado = \'aprobado\' THEN 1 ELSE 0 END)', 'aprobados')
      .where('p.deleted = :d', { d: false })
      .groupBy('p.id')
      .addGroupBy('p.nombre')
      .getRawMany();
  }

  async getByPriority() {
    return this.reqRepo
      .createQueryBuilder('r')
      .select('r.prioridad', 'prioridad')
      .addSelect('COUNT(*)', 'cantidad')
      .where('r.deleted = :d', { d: false })
      .groupBy('r.prioridad')
      .getRawMany();
  }

  /** Exportación detallada para CSV/PDF (todos los campos relevantes). */
  async getRequirementsDetail() {
    const rows = await this.reqRepo.find({
      where: { deleted: false },
      relations: [
        'project',
        'solicitante',
        'responsable',
        'statusDef',
        'categoryDef',
      ],
      order: { creadoEn: 'DESC' },
    });
    const ids = rows.map((r) => r.id);
    const byReq = new Map<number, { count: number; names: string[] }>();
    for (const id of ids) {
      byReq.set(id, { count: 0, names: [] });
    }
    if (ids.length > 0) {
      const atts = await this.attRepo.find({
        where: { requirement: { id: In(ids) } },
        relations: ['requirement'],
        order: { id: 'ASC' },
      });
      for (const a of atts) {
        const rid = a.requirement?.id;
        if (rid == null) continue;
        const cur = byReq.get(rid);
        if (!cur) continue;
        cur.count++;
        cur.names.push(a.nombreOriginal);
      }
    }
    return rows.map((r) => {
      const att = byReq.get(r.id) ?? { count: 0, names: [] };
      return {
        id: r.id,
        codigo: r.codigo,
        titulo: r.titulo,
        descripcion: r.descripcion,
        tipo: r.tipo,
        categoria: r.categoryDef?.nombre ?? r.categoria ?? '',
        prioridad: r.prioridad,
        impacto: r.impacto,
        urgencia: r.urgencia,
        esfuerzo: r.esfuerzo,
        valor: r.valor,
        estadoSlug: r.estado,
        estadoNombre: r.statusDef?.nombre ?? r.estado,
        proyecto: r.project?.nombre ?? '',
        solicitante: r.solicitante?.nombre ?? '',
        responsable: r.responsable?.nombre ?? '',
        criteriosAceptacion: r.criteriosAceptacion ?? '',
        version: r.version,
        creadoEn: r.creadoEn,
        actualizadoEn: r.actualizadoEn,
        adjuntosCount: att.count,
        adjuntosNombres: att.names.join('; '),
      };
    });
  }
}
