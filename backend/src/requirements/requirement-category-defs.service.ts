import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RequirementCategoryDef } from './requirement-category-def.entity';
import { CreateCategoryDefDto } from './dto/create-category-def.dto';
import { UpdateCategoryDefDto } from './dto/update-category-def.dto';

function slugify(nombre: string): string {
  const s = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return (s || 'categoria').slice(0, 64);
}

@Injectable()
export class RequirementCategoryDefsService {
  constructor(
    @InjectRepository(RequirementCategoryDef)
    private repo: Repository<RequirementCategoryDef>,
  ) {}

  async findForProject(projectId?: number): Promise<RequirementCategoryDef[]> {
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

  async create(dto: CreateCategoryDefDto): Promise<RequirementCategoryDef> {
    const slug = (dto.slug?.trim() || slugify(dto.nombre)).toLowerCase();
    const project = dto.projectId ? ({ id: dto.projectId } as any) : null;
    const exists = await this.repo.findOne({
      where: { slug, project: project ? { id: dto.projectId } : IsNull() },
    });
    if (exists) {
      throw new ConflictException(
        'Ya existe una categoría con ese identificador en este ámbito',
      );
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

  async update(
    id: number,
    dto: UpdateCategoryDefDto,
  ): Promise<RequirementCategoryDef> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Categoría no encontrada');
    if (row.esSistema && (dto.slug || dto.nombre)) {
      throw new BadRequestException(
        'Las categorías del sistema solo permiten orden, color y activo',
      );
    }
    if (dto.nombre != null) row.nombre = dto.nombre.trim();
    if (dto.orden != null) row.orden = dto.orden;
    if (dto.color !== undefined) row.color = dto.color;
    if (dto.activo != null) row.activo = dto.activo;
    return this.repo.save(row);
  }

  async remove(id: number): Promise<void> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Categoría no encontrada');
    if (row.esSistema) {
      throw new BadRequestException(
        'No se puede eliminar una categoría del sistema; desactívala',
      );
    }
    row.activo = false;
    await this.repo.save(row);
  }

  async findById(id: number): Promise<RequirementCategoryDef | null> {
    return this.repo.findOne({ where: { id } });
  }

  async resolveForRequirement(
    categoryDefId: number | undefined,
    categoriaSlug: string | undefined,
    projectId: number,
  ): Promise<RequirementCategoryDef | null> {
    if (categoryDefId !== undefined && categoryDefId !== null) {
      if (categoryDefId === 0) return null;
      const s = await this.repo.findOne({
        where: { id: categoryDefId, activo: true },
        relations: ['project'],
      });
      if (!s) throw new BadRequestException('Categoría no válida');
      if (s.project && s.project.id !== projectId) {
        throw new BadRequestException(
          'La categoría no pertenece al proyecto del requisito',
        );
      }
      return s;
    }
    if (categoriaSlug && categoriaSlug.trim()) {
      const slug = categoriaSlug.trim().toLowerCase();
      const scoped = await this.repo.findOne({
        where: { slug, project: { id: projectId }, activo: true },
      });
      if (scoped) return scoped;
      return this.repo.findOne({
        where: { slug, project: IsNull(), activo: true },
      });
    }
    return null;
  }

  async resolveManyForRequirement(
    categoryDefIds: number[] | undefined,
    categoriaSlugs: string[] | undefined,
    projectId: number,
  ): Promise<RequirementCategoryDef[]> {
    const out: RequirementCategoryDef[] = [];
    const seen = new Set<number>();

    const ids = (categoryDefIds ?? [])
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n > 0);
    for (const id of ids) {
      const row = await this.resolveForRequirement(id, undefined, projectId);
      if (row && !seen.has(row.id)) {
        seen.add(row.id);
        out.push(row);
      }
    }

    const slugs = (categoriaSlugs ?? [])
      .map((s) => String(s).trim().toLowerCase())
      .filter(Boolean);
    for (const slug of slugs) {
      const row = await this.resolveForRequirement(undefined, slug, projectId);
      if (row && !seen.has(row.id)) {
        seen.add(row.id);
        out.push(row);
      }
    }

    return out;
  }
}
