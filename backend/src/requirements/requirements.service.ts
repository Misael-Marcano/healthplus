import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement } from './requirement.entity';
import { RequirementComment } from './requirement-comment.entity';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/user.entity';
import { RequirementStatusDefsService } from './requirement-status-defs.service';
import { RequirementCategoryDefsService } from './requirement-category-defs.service';
import { UsersService } from '../users/users.service';
import { extractMentionUserIds } from './mention-utils';

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(Requirement) private repo: Repository<Requirement>,
    @InjectRepository(RequirementComment)
    private commentRepo: Repository<RequirementComment>,
    private auditService: AuditService,
    private statusDefs: RequirementStatusDefsService,
    private categoryDefs: RequirementCategoryDefsService,
    private usersService: UsersService,
  ) {}

  private async nextCodigo(): Promise<string> {
    const count = await this.repo.count();
    return `REQ-${String(count + 1).padStart(3, '0')}`;
  }

  findAll(filters?: {
    projectId?: number;
    estado?: string;
    prioridad?: string;
    tipo?: string;
  }) {
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.project', 'p')
      .leftJoinAndSelect('r.solicitante', 's')
      .leftJoinAndSelect('r.responsable', 'resp')
      .leftJoinAndSelect('r.statusDef', 'sd')
      .leftJoinAndSelect('r.categoryDef', 'cd')
      .where('r.deleted = :d', { d: false });

    if (filters?.projectId) qb.andWhere('r.project_id = :pid', { pid: filters.projectId });
    if (filters?.estado) qb.andWhere('r.estado = :e', { e: filters.estado });
    if (filters?.prioridad) qb.andWhere('r.prioridad = :p', { p: filters.prioridad });
    if (filters?.tipo) qb.andWhere('r.tipo = :t', { t: filters.tipo });

    return qb.orderBy('r.created_at', 'DESC').getMany();
  }

  async findOne(id: number): Promise<Requirement> {
    const r = await this.repo.findOne({
      where: { id, deleted: false },
      relations: [
        'versions',
        'validations',
        'project',
        'solicitante',
        'responsable',
        'statusDef',
        'categoryDef',
        'comments',
        'comments.autor',
        'attachments',
        'attachments.subidoPor',
      ],
    });
    if (!r) throw new NotFoundException('Requisito no encontrado');
    if (r.comments?.length) {
      r.comments.sort(
        (a, b) =>
          new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime(),
      );
    }
    if (r.attachments?.length) {
      r.attachments.sort(
        (a, b) =>
          new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
      );
    }
    return r;
  }

  async listComments(requirementId: number) {
    await this.ensureExists(requirementId);
    return this.commentRepo.find({
      where: { requirement: { id: requirementId } },
      relations: ['autor'],
      order: { creadoEn: 'ASC' },
    });
  }

  async addComment(
    requirementId: number,
    dto: CreateCommentDto,
    user: User,
  ): Promise<RequirementComment> {
    await this.ensureExists(requirementId);
    const texto = dto.texto.trim();
    const fromTokens = extractMentionUserIds(texto);
    const merged = [
      ...new Set([...(dto.menciones ?? []), ...fromTokens]),
    ].filter((n) => Number.isInteger(n) && n > 0);
    await this.usersService.ensureActiveUserIdsExist(merged);

    const c = this.commentRepo.create({
      requirement: { id: requirementId } as any,
      autor: user,
      texto,
      menciones: merged.length ? merged : null,
    });
    const saved = await this.commentRepo.save(c);
    const mentionHint =
      merged.length > 0 ? ` (${merged.length} mención/es)` : '';
    await this.auditService.log(
      'COMENTARIO_REQUISITO',
      'requirements',
      requirementId,
      `Comentario por ${user.nombre}${mentionHint}`,
      user,
    );
    return this.commentRepo.findOne({
      where: { id: saved.id },
      relations: ['autor'],
    }) as Promise<RequirementComment>;
  }

  private async ensureExists(id: number): Promise<void> {
    const ok = await this.repo.exist({ where: { id, deleted: false } });
    if (!ok) throw new NotFoundException('Requisito no encontrado');
  }

  async create(dto: CreateRequirementDto, user: User): Promise<Requirement> {
    const codigo = await this.nextCodigo();
    const status = await this.statusDefs.resolveForRequirement(
      dto.statusDefId,
      dto.estado ?? 'borrador',
      dto.projectId,
    );
    const estadoSlug = (status?.slug ?? dto.estado ?? 'borrador') as any;

    const cat = await this.categoryDefs.resolveForRequirement(
      dto.categoryDefId,
      dto.categoria,
      dto.projectId,
    );

    const req = this.repo.create({
      codigo,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      tipo: (dto.tipo as any) ?? 'funcional',
      categoria: cat?.slug ?? null,
      categoryDef: cat ?? undefined,
      prioridad: (dto.prioridad as any) ?? 'media',
      impacto: dto.impacto ?? 3,
      urgencia: dto.urgencia ?? 3,
      esfuerzo: dto.esfuerzo ?? 3,
      valor: dto.valor ?? 3,
      estado: estadoSlug,
      statusDef: status ?? undefined,
      criteriosAceptacion: dto.criteriosAceptacion,
      project: { id: dto.projectId } as any,
      solicitante: dto.solicitanteId ? ({ id: dto.solicitanteId } as any) : undefined,
      responsable: dto.responsableId ? ({ id: dto.responsableId } as any) : undefined,
    });
    const saved = await this.repo.save(req);
    await this.auditService.log('CREAR_REQUISITO', 'requirements', saved.id, `Creado ${codigo}`, user);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateRequirementDto, user: User): Promise<Requirement> {
    const req = await this.repo.findOne({
      where: { id, deleted: false },
      relations: ['project', 'statusDef'],
    });
    if (!req) throw new NotFoundException('Requisito no encontrado');
    const prevEstado = req.estado;
    const {
      projectId,
      solicitanteId,
      responsableId,
      statusDefId,
      estado,
      categoryDefId,
      categoria,
      ...rest
    } = dto as any;

    Object.assign(req, rest);

    if (projectId != null) req.project = { id: projectId } as any;

    if (Object.prototype.hasOwnProperty.call(dto as object, 'solicitanteId')) {
      if (solicitanteId == null) req.solicitante = null as any;
      else req.solicitante = { id: solicitanteId } as any;
    }
    if (Object.prototype.hasOwnProperty.call(dto as object, 'responsableId')) {
      if (responsableId == null) req.responsable = null as any;
      else req.responsable = { id: responsableId } as any;
    }

    if (statusDefId != null || estado != null) {
      const pid = req.project?.id ?? projectId;
      const status = await this.statusDefs.resolveForRequirement(
        statusDefId,
        estado,
        pid as number,
      );
      if (status) {
        req.statusDef = status;
        req.estado = status.slug as any;
      } else if (estado != null) {
        req.estado = estado;
        req.statusDef = null;
      }
    }

    if (
      categoryDefId !== undefined ||
      (categoria !== undefined && categoria !== null)
    ) {
      const pid = (req.project?.id ?? projectId) as number;
      if (categoryDefId === 0) {
        req.categoryDef = null;
        req.categoria = null;
      } else {
        const catRow = await this.categoryDefs.resolveForRequirement(
          categoryDefId,
          categoria,
          pid,
        );
        if (catRow) {
          req.categoryDef = catRow;
          req.categoria = catRow.slug;
        } else if (categoria !== undefined && String(categoria).trim() === '') {
          req.categoryDef = null;
          req.categoria = null;
        }
      }
    }

    const saved = await this.repo.save(req);
    if (saved.estado !== prevEstado) {
      await this.auditService.log(
        'CAMBIO_ESTADO',
        'requirements',
        id,
        `${prevEstado} → ${saved.estado}`,
        user,
      );
    }
    return this.findOne(id);
  }

  async remove(id: number, user: User): Promise<void> {
    const req = await this.findOne(id);
    req.deleted = true;
    await this.repo.save(req);
    await this.auditService.log('ELIMINAR_REQUISITO', 'requirements', id, `Eliminado ${req.codigo}`, user);
  }

  /** Sincroniza estado y statusDef desde un slug (p. ej. validación). */
  async applyEstadoSlug(
    id: number,
    slug: string,
    user: User,
  ): Promise<Requirement> {
    const req = await this.repo.findOne({
      where: { id, deleted: false },
      relations: ['project', 'statusDef'],
    });
    if (!req) throw new NotFoundException('Requisito no encontrado');
    const status = await this.statusDefs.resolveForRequirement(
      undefined,
      slug,
      req.project.id,
    );
    if (status) {
      req.statusDef = status;
      req.estado = status.slug as any;
    } else {
      req.estado = slug as any;
      req.statusDef = null;
    }
    await this.repo.save(req);
    await this.auditService.log(
      'CAMBIO_ESTADO',
      'requirements',
      id,
      `→ ${slug}`,
      user,
    );
    return this.findOne(id);
  }
}
