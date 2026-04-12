import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { Requirement } from '../requirements/requirement.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export type ProjectWithStats = Project & {
  totalRequisitos: number;
  requisitosAprobados: number;
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private repo: Repository<Project>,
    @InjectRepository(Requirement) private reqRepo: Repository<Requirement>,
  ) {}

  async findAll(): Promise<ProjectWithStats[]> {
    const projects = await this.repo.find({
      where: { deleted: false },
      order: { creadoEn: 'DESC' },
    });
    return this.attachRequirementStats(projects);
  }

  async findOne(id: number): Promise<ProjectWithStats> {
    const p = await this.repo.findOne({ where: { id, deleted: false } });
    if (!p) throw new NotFoundException('Proyecto no encontrado');
    const [enriched] = await this.attachRequirementStats([p]);
    return enriched;
  }

  /** Totales por proyecto: requisitos no eliminados; “aprobados” = `aprobado`, `implementado` o `cerrado` (avance posterior a la aprobación). */
  private async attachRequirementStats(
    projects: Project[],
  ): Promise<ProjectWithStats[]> {
    if (projects.length === 0) return [];

    const ids = projects.map((p) => p.id);
    const rows = await this.reqRepo
      .createQueryBuilder('r')
      .select('r.project_id', 'projectId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN r.estado IN (:...estadosContados) THEN 1 ELSE 0 END)`,
        'aprobados',
      )
      .where('r.project_id IN (:...ids)', { ids })
      .andWhere('r.deleted = :del', { del: false })
      .setParameter('estadosContados', ['aprobado', 'implementado', 'cerrado'])
      .groupBy('r.project_id')
      .getRawMany();

    const byProject = new Map<number, { total: number; aprobados: number }>();
    for (const row of rows) {
      const pid = Number(
        row.projectId ?? (row as Record<string, unknown>).PROJECT_ID,
      );
      byProject.set(pid, {
        total: Number(row.total ?? (row as Record<string, unknown>).TOTAL ?? 0),
        aprobados: Number(
          row.aprobados ?? (row as Record<string, unknown>).APROBADOS ?? 0,
        ),
      });
    }

    return projects.map((p) => {
      const c = byProject.get(p.id) ?? { total: 0, aprobados: 0 };
      return Object.assign(p, {
        totalRequisitos: c.total,
        requisitosAprobados: c.aprobados,
      }) as ProjectWithStats;
    });
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    const project = new Project();
    project.nombre      = dto.nombre;
    project.descripcion = dto.descripcion ?? '';
    project.estado      = (dto.estado as ProjectStatus) ?? 'activo';
    if (dto.responsableId) project.responsable = { id: dto.responsableId } as any;
    if (dto.fechaInicio)   project.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin)      project.fechaFin    = new Date(dto.fechaFin);
    return this.repo.save(project);
  }

  async update(id: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    if (dto.nombre)        project.nombre      = dto.nombre;
    if (dto.descripcion)   project.descripcion = dto.descripcion;
    if (dto.estado)        project.estado      = dto.estado as ProjectStatus;
    if (dto.responsableId) project.responsable = { id: dto.responsableId } as any;
    if (dto.fechaInicio)   project.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin)      project.fechaFin    = new Date(dto.fechaFin);
    return this.repo.save(project);
  }

  async remove(id: number): Promise<void> {
    const project = await this.findOne(id);
    project.deleted = true;
    await this.repo.save(project);
  }
}
