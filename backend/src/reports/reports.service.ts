import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Requirement } from '../requirements/requirement.entity';
import { RequirementAttachment } from '../requirements/requirement-attachment.entity';
import { Project } from '../projects/project.entity';
import { RequirementValidation } from '../validation/requirement-validation.entity';
import { RequirementVersion } from '../versions/requirement-version.entity';

export type ReportDateFilters = {
  createdFrom?: Date;
  createdTo?: Date;
  updatedFrom?: Date;
  updatedTo?: Date;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Requirement) private reqRepo: Repository<Requirement>,
    @InjectRepository(Project) private projRepo: Repository<Project>,
    @InjectRepository(RequirementAttachment)
    private attRepo: Repository<RequirementAttachment>,
    @InjectRepository(RequirementValidation)
    private valRepo: Repository<RequirementValidation>,
    @InjectRepository(RequirementVersion)
    private verRepo: Repository<RequirementVersion>,
  ) {}

  private applyRequirementDateFilters(qb: SelectQueryBuilder<Requirement>, f: ReportDateFilters) {
    if (f.createdFrom) qb.andWhere('r.creadoEn >= :cFrom', { cFrom: f.createdFrom });
    if (f.createdTo) qb.andWhere('r.creadoEn <= :cTo', { cTo: f.createdTo });
    if (f.updatedFrom) qb.andWhere('r.actualizadoEn >= :uFrom', { uFrom: f.updatedFrom });
    if (f.updatedTo) qb.andWhere('r.actualizadoEn <= :uTo', { uTo: f.updatedTo });
  }

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

  /** Exportación detallada: proyecto y/o rango de fechas (creado / actualizado). Incluye aging en días. */
  async getRequirementsDetail(filters: {
    projectId?: number;
    dates?: ReportDateFilters;
  } = {}) {
    const qb = this.reqRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.project', 'p')
      .leftJoinAndSelect('r.solicitante', 'sol')
      .leftJoinAndSelect('r.responsable', 'resp')
      .leftJoinAndSelect('r.statusDef', 'statusDef')
      .leftJoinAndSelect('r.categoryDef', 'categoryDef')
      .where('r.deleted = :d', { d: false });
    if (filters.projectId != null && Number.isFinite(filters.projectId)) {
      qb.andWhere('p.id = :pid', { pid: filters.projectId });
    }
    if (filters.dates) this.applyRequirementDateFilters(qb, filters.dates);
    const rows = await qb.orderBy('r.creadoEn', 'DESC').getMany();

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

    const now = Date.now();
    const dayMs = 86400000;
    return rows.map((r) => {
      const att = byReq.get(r.id) ?? { count: 0, names: [] };
      const creado = r.creadoEn ? new Date(r.creadoEn).getTime() : now;
      const act = r.actualizadoEn ? new Date(r.actualizadoEn).getTime() : creado;
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
        diasDesdeCreacion: Math.max(0, Math.floor((now - creado) / dayMs)),
        diasDesdeActualizacion: Math.max(0, Math.floor((now - act) / dayMs)),
      };
    });
  }

  /**
   * Una fila por participación (usuario × requisito × proyecto).
   * Filtros: usuario, proyecto, fechas sobre el requisito.
   */
  async getUserProjectRequirements(filters?: {
    userId?: number;
    projectId?: number;
    dates?: ReportDateFilters;
  }) {
    const qb = this.reqRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.project', 'p')
      .leftJoinAndSelect('r.solicitante', 'sol')
      .leftJoinAndSelect('r.responsable', 'resp')
      .leftJoinAndSelect('r.statusDef', 'sd')
      .where('r.deleted = :d', { d: false });
    if (filters?.projectId != null && Number.isFinite(filters.projectId)) {
      qb.andWhere('p.id = :pid', { pid: filters.projectId });
    }
    if (filters?.userId != null && Number.isFinite(filters.userId)) {
      qb.andWhere('(sol.id = :uid OR resp.id = :uid)', { uid: filters.userId });
    }
    if (filters?.dates) this.applyRequirementDateFilters(qb, filters.dates);
    const reqs = await qb.getMany();

    type Papel = 'solicitante' | 'responsable' | 'solicitante_y_responsable';
    const out: {
      usuarioId: number;
      usuarioNombre: string;
      usuarioEmail: string;
      proyectoId: number;
      proyectoNombre: string;
      requisitoId: number;
      codigo: string;
      titulo: string;
      papel: Papel;
      estadoNombre: string;
      prioridad: string;
    }[] = [];

    for (const r of reqs) {
      const sid = r.solicitante?.id ?? null;
      const rid = r.responsable?.id ?? null;
      const estadoNombre = r.statusDef?.nombre ?? r.estado;
      const base = {
        proyectoId: r.project.id,
        proyectoNombre: r.project.nombre,
        requisitoId: r.id,
        codigo: r.codigo,
        titulo: r.titulo,
        estadoNombre,
        prioridad: r.prioridad,
      };
      if (sid != null && rid != null && sid === rid) {
        out.push({
          ...base,
          usuarioId: sid,
          usuarioNombre: r.solicitante!.nombre,
          usuarioEmail: r.solicitante!.email,
          papel: 'solicitante_y_responsable',
        });
      } else {
        if (sid != null) {
          out.push({
            ...base,
            usuarioId: sid,
            usuarioNombre: r.solicitante!.nombre,
            usuarioEmail: r.solicitante!.email,
            papel: 'solicitante',
          });
        }
        if (rid != null) {
          out.push({
            ...base,
            usuarioId: rid,
            usuarioNombre: r.responsable!.nombre,
            usuarioEmail: r.responsable!.email,
            papel: 'responsable',
          });
        }
      }
    }

    out.sort((a, b) => {
      const u = a.usuarioNombre.localeCompare(b.usuarioNombre, 'es');
      if (u !== 0) return u;
      const p = a.proyectoNombre.localeCompare(b.proyectoNombre, 'es');
      if (p !== 0) return p;
      return a.codigo.localeCompare(b.codigo, 'es');
    });
    return out;
  }

  /** Validaciones con contexto de requisito y proyecto. */
  async getValidationsDetail(filters: {
    projectId?: number;
    validadorId?: number;
    estado?: string;
  } = {}) {
    const qb = this.valRepo
      .createQueryBuilder('v')
      .innerJoinAndSelect('v.requirement', 'req')
      .innerJoinAndSelect('req.project', 'proj')
      .leftJoinAndSelect('v.validador', 'val')
      .leftJoinAndSelect('v.solicitadoPor', 'sol')
      .where('req.deleted = :d', { d: false });
    if (filters.projectId != null && Number.isFinite(filters.projectId)) {
      qb.andWhere('proj.id = :pid', { pid: filters.projectId });
    }
    if (filters.validadorId != null && Number.isFinite(filters.validadorId)) {
      qb.andWhere('val.id = :vid', { vid: filters.validadorId });
    }
    if (filters.estado) {
      qb.andWhere('v.estado = :est', { est: filters.estado });
    }
    const rows = await qb.orderBy('v.creadoEn', 'DESC').getMany();
    return rows.map((v) => ({
      id: v.id,
      requisitoId: v.requirement.id,
      codigo: v.requirement.codigo,
      tituloRequisito: v.requirement.titulo,
      proyectoId: v.requirement.project.id,
      proyectoNombre: v.requirement.project.nombre,
      validadorNombre: v.validador?.nombre ?? '',
      validadorEmail: v.validador?.email ?? '',
      solicitadoPorNombre: v.solicitadoPor?.nombre ?? '',
      estado: v.estado,
      comentario: v.comentario ?? '',
      creadoEn: v.creadoEn,
    }));
  }

  /** Historial de versiones de contenido; filtro por proyecto y/o lista de códigos. */
  async getVersionsExport(filters: { projectId?: number; codigos?: string[] } = {}) {
    const qb = this.verRepo
      .createQueryBuilder('ver')
      .innerJoinAndSelect('ver.requirement', 'req')
      .innerJoinAndSelect('req.project', 'proj')
      .leftJoinAndSelect('ver.creadoPor', 'creadoPor')
      .where('req.deleted = :d', { d: false });
    if (filters.projectId != null && Number.isFinite(filters.projectId)) {
      qb.andWhere('proj.id = :pid', { pid: filters.projectId });
    }
    if (filters.codigos?.length) {
      qb.andWhere('req.codigo IN (:...codes)', { codes: filters.codigos });
    }
    const rows = await qb.orderBy('req.codigo', 'ASC').addOrderBy('ver.version', 'DESC').getMany();
    return rows.map((ver) => ({
      id: ver.id,
      requisitoId: ver.requirement.id,
      codigo: ver.requirement.codigo,
      proyectoNombre: ver.requirement.project.nombre,
      version: ver.version,
      titulo: ver.titulo,
      descripcion: ver.descripcion,
      criteriosAceptacion: ver.criteriosAceptacion ?? '',
      motivoCambio: ver.motivoCambio ?? '',
      creadoPorNombre: ver.creadoPor?.nombre ?? '',
      creadoEn: ver.creadoEn,
    }));
  }

  /** Inventario de adjuntos con ruta de almacenamiento (referencia interna). */
  async getAttachmentsDetail(projectId?: number) {
    const qb = this.attRepo
      .createQueryBuilder('a')
      .innerJoinAndSelect('a.requirement', 'req')
      .innerJoinAndSelect('req.project', 'p')
      .leftJoinAndSelect('a.subidoPor', 'u')
      .where('req.deleted = :d', { d: false });
    if (projectId != null && Number.isFinite(projectId)) {
      qb.andWhere('p.id = :pid', { pid: projectId });
    }
    const rows = await qb.orderBy('p.nombre', 'ASC').addOrderBy('req.codigo', 'ASC').addOrderBy('a.id', 'ASC').getMany();
    return rows.map((a) => ({
      id: a.id,
      requisitoId: a.requirement.id,
      codigo: a.requirement.codigo,
      tituloRequisito: a.requirement.titulo,
      proyectoId: a.requirement.project.id,
      proyectoNombre: a.requirement.project.nombre,
      nombreOriginal: a.nombreOriginal,
      rutaAlmacenamiento: a.rutaAlmacenamiento,
      mimeType: a.mimeType,
      tamanoBytes: a.tamanoBytes,
      subidoPorNombre: a.subidoPor?.nombre ?? '',
      creadoEn: a.creadoEn,
    }));
  }
}
