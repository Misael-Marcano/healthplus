import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RequirementStatusDef } from './requirement-status-def.entity';
import { CreateStatusDefDto } from './dto/create-status-def.dto';
import { UpdateStatusDefDto } from './dto/update-status-def.dto';

function slugify(nombre: string): string {
  const s = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return (s || 'estado').slice(0, 64);
}

@Injectable()
export class RequirementStatusDefsService {
  constructor(
    @InjectRepository(RequirementStatusDef)
    private repo: Repository<RequirementStatusDef>,
  ) {}

  /**
   * Estados globales (project null) + específicos del proyecto si `projectId` viene informado.
   */
  async findForProject(projectId?: number): Promise<RequirementStatusDef[]> {
    const global = await this.repo.find({
      where: { project: IsNull(), activo: true },
      order: { orden: 'ASC', id: 'ASC' },
    });
    if (projectId == null) return global;
    const scoped = await this.repo.find({
      where: { project: { id: projectId }, activo: true },
      order: { orden: 'ASC', id: 'ASC' },
    });
    const bySlug = new Map(global.map((s) => [s.slug, s]));
    for (const s of scoped) {
      bySlug.set(s.slug, s);
    }
    return [...bySlug.values()].sort(
      (a, b) => a.orden - b.orden || a.id - b.id,
    );
  }

  async create(dto: CreateStatusDefDto): Promise<RequirementStatusDef> {
    const slug = (dto.slug?.trim() || slugify(dto.nombre)).toLowerCase();
    const project = dto.projectId
      ? ({ id: dto.projectId } as any)
      : null;
    const exists = await this.repo.findOne({
      where: { slug, project: project ? { id: dto.projectId } : IsNull() },
    });
    if (exists) {
      throw new ConflictException('Ya existe un estado con ese identificador en este ámbito');
    }
    const row = this.repo.create({
      nombre: dto.nombre.trim(),
      slug,
      project,
      orden: dto.orden ?? 0,
      color: dto.color ?? null,
      activo: true,
      esSistema: false,
    });
    return this.repo.save(row);
  }

  async update(id: number, dto: UpdateStatusDefDto): Promise<RequirementStatusDef> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Estado no encontrado');
    if (row.esSistema && (dto.slug || dto.nombre)) {
      throw new BadRequestException('Los estados del sistema solo permiten orden, color y activo');
    }
    if (dto.nombre != null) row.nombre = dto.nombre.trim();
    if (dto.orden != null) row.orden = dto.orden;
    if (dto.color !== undefined) row.color = dto.color;
    if (dto.activo != null) row.activo = dto.activo;
    return this.repo.save(row);
  }

  async remove(id: number): Promise<void> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Estado no encontrado');
    if (row.esSistema) {
      throw new BadRequestException('No se puede eliminar un estado del sistema; desactívalo');
    }
    row.activo = false;
    await this.repo.save(row);
  }

  async findById(id: number): Promise<RequirementStatusDef | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Resuelve estado por id o por slug global. */
  async resolveForRequirement(
    statusDefId: number | undefined,
    estadoSlug: string | undefined,
    projectId: number,
  ): Promise<RequirementStatusDef | null> {
    if (statusDefId) {
      const s = await this.repo.findOne({
        where: { id: statusDefId, activo: true },
        relations: ['project'],
      });
      if (!s) throw new BadRequestException('Estado no válido');
      if (
        s.project &&
        s.project.id !== projectId
      ) {
        throw new BadRequestException('El estado no pertenece al proyecto del requisito');
      }
      return s;
    }
    if (estadoSlug) {
      const scoped = await this.repo.findOne({
        where: { slug: estadoSlug, project: { id: projectId }, activo: true },
      });
      if (scoped) return scoped;
      return this.repo.findOne({
        where: { slug: estadoSlug, project: IsNull(), activo: true },
      });
    }
    return null;
  }
}
