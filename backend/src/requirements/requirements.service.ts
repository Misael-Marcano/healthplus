import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement } from './requirement.entity';
import { RequirementComment } from './requirement-comment.entity';
import { RequirementVersion } from '../versions/requirement-version.entity';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/user.entity';
import { RequirementStatusDefsService } from './requirement-status-defs.service';
import { RequirementCategoryDefsService } from './requirement-category-defs.service';
import { UsersService } from '../users/users.service';
import { extractMentionUserIds } from './mention-utils';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RequirementsService {
  private readonly log = new Logger(RequirementsService.name);

  constructor(
    @InjectRepository(Requirement) private repo: Repository<Requirement>,
    @InjectRepository(RequirementComment)
    private commentRepo: Repository<RequirementComment>,
    @InjectRepository(RequirementVersion)
    private versionsRepo: Repository<RequirementVersion>,
    private auditService: AuditService,
    private statusDefs: RequirementStatusDefsService,
    private categoryDefs: RequirementCategoryDefsService,
    private usersService: UsersService,
    private settingsService: SettingsService,
    private mailService: MailService,
    private cfg: ConfigService,
  ) {}

  private autoVersionShouldTrigger(
    vtrigger: string | undefined,
    dtoKeys: Set<string>,
  ): boolean {
    const trigger = vtrigger ?? 'descripcion';
    if (trigger === 'manual') return false;
    if (trigger === 'titulo') return dtoKeys.has('titulo');
    if (trigger === 'descripcion') {
      return dtoKeys.has('descripcion') || dtoKeys.has('criteriosAceptacion');
    }
    if (trigger === 'cualquier') return dtoKeys.size > 0;
    return false;
  }

  private normalizeValue(v: unknown): string {
    if (v == null) return '';
    return String(v).trim();
  }

  private async notifyVersionChange(
    req: Requirement,
    version: number,
    motivoCambio: string,
    actor: User,
    versionOpts: Set<string>,
  ): Promise<void> {
    if (!versionOpts.has('notif_cambio')) return;
    if (!(await this.mailService.isSmtpConfigured())) return;

    const recipients = new Map<string, string>();
    const add = (u: any) => {
      const email = u?.email?.trim();
      const nombre = u?.nombre?.trim();
      if (!email || !nombre) return;
      if (email === actor.email) return;
      recipients.set(email, nombre);
    };
    add(req.solicitante);
    add(req.responsable);
    add(req.creadoPor);
    if (!recipients.size) return;

    const base = this.cfg.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const detailUrl = `${base.replace(/\/$/, '')}/requisitos/${req.id}`;
    for (const [email, nombre] of recipients) {
      const sent = await this.mailService.sendRequirementVersionCreatedEmail(email, {
        destinatarioNombre: nombre,
        requisitoCodigo: req.codigo ?? '',
        requisitoTitulo: req.titulo ?? '',
        version,
        motivoCambio,
        actorNombre: actor.nombre ?? 'Usuario',
        detailUrl,
      });
      if (!sent.sent && sent.error) {
        this.log.warn(`No se pudo notificar nueva versión a ${email}: ${sent.error}`);
      }
    }
  }

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
      .leftJoinAndSelect('r.creadoPor', 'creator')
      .leftJoinAndSelect('r.statusDef', 'sd')
      .leftJoinAndSelect('r.categoryDef', 'cd')
      .where('r.deleted = :d', { d: false });

    if (filters?.projectId) qb.andWhere('r.project_id = :pid', { pid: filters.projectId });
    if (filters?.estado) qb.andWhere('r.estado = :e', { e: filters.estado });
    if (filters?.prioridad) qb.andWhere('r.prioridad = :p', { p: filters.prioridad });
    if (filters?.tipo) qb.andWhere('r.tipo = :t', { t: filters.tipo });

    qb.loadRelationCountAndMap('r.adjuntosCount', 'r.attachments');

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
        'creadoPor',
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
    const manyCats = await this.categoryDefs.resolveManyForRequirement(
      dto.categoryDefIds,
      dto.categorias,
      dto.projectId,
    );
    const allCats = manyCats.length ? manyCats : cat ? [cat] : [];

    const req = this.repo.create({
      codigo,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      tipo: (dto.tipo as any) ?? 'funcional',
      categoria: allCats[0]?.slug ?? null,
      categorias: allCats.map((x) => x.slug),
      categoryDef: allCats[0] ?? undefined,
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
      creadoPor: user,
    });
    const saved = await this.repo.save(req);
    await this.auditService.log('CREAR_REQUISITO', 'requirements', saved.id, `Creado ${codigo}`, user);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateRequirementDto, user: User): Promise<Requirement> {
    const req = await this.repo.findOne({
      where: { id, deleted: false },
      relations: ['project', 'statusDef', 'solicitante', 'responsable', 'creadoPor'],
    });
    if (!req) throw new NotFoundException('Requisito no encontrado');
    const prevSnapshot = {
      titulo: req.titulo,
      descripcion: req.descripcion,
      criteriosAceptacion: req.criteriosAceptacion,
      version: req.version,
      prioridad: req.prioridad,
      tipo: req.tipo,
      estado: req.estado,
      proyectoId: req.project?.id ?? null,
      solicitanteId: req.solicitante?.id ?? null,
      responsableId: req.responsable?.id ?? null,
      categoria: req.categoria ?? null,
    };
    const prevEstado = req.estado;
    const {
      projectId,
      solicitanteId,
      responsableId,
      statusDefId,
      estado,
      categoryDefId,
      categoria,
      categoryDefIds,
      categorias,
      motivoCambio,
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

    if (categoryDefIds !== undefined || categorias !== undefined) {
      const pid = (req.project?.id ?? projectId) as number;
      const rows = await this.categoryDefs.resolveManyForRequirement(
        categoryDefIds,
        categorias,
        pid,
      );
      req.categoryDef = rows[0] ?? null;
      req.categoria = rows[0]?.slug ?? null;
      req.categorias = rows.map((r) => r.slug);
    } else if (
      categoryDefId !== undefined ||
      (categoria !== undefined && categoria !== null)
    ) {
      const pid = (req.project?.id ?? projectId) as number;
      if (categoryDefId === 0) {
        req.categoryDef = null;
        req.categoria = null;
        req.categorias = [];
      } else {
        const catRow = await this.categoryDefs.resolveForRequirement(
          categoryDefId,
          categoria,
          pid,
        );
        if (catRow) {
          req.categoryDef = catRow;
          req.categoria = catRow.slug;
          req.categorias = [catRow.slug];
        } else if (categoria !== undefined && String(categoria).trim() === '') {
          req.categoryDef = null;
          req.categoria = null;
          req.categorias = [];
        }
      }
    }

    const settings = await this.settingsService.getPublic();
    const versionOpts = new Set(settings.versionOpts ?? []);
    const dtoKeys = new Set(Object.keys(dto).filter((k) => k !== 'motivoCambio'));
    const shouldVersion = this.autoVersionShouldTrigger(settings.vtrigger, dtoKeys);

    if (shouldVersion && versionOpts.has('req_motivo')) {
      const motivo = String(motivoCambio ?? '').trim();
      if (!motivo) {
        throw new BadRequestException(
          'Debes indicar el motivo del cambio para generar una nueva versión',
        );
      }
    }

    if (shouldVersion) {
      const reason = String(motivoCambio ?? '').trim();
      const lastVersion = await this.versionsRepo.findOne({
        where: { requirement: { id } },
        order: { version: 'DESC' },
      });
      const baseVersion =
        typeof prevSnapshot.version === 'number' && Number.isFinite(prevSnapshot.version)
          ? prevSnapshot.version
          : 1;
      const nextVersion = Math.max(baseVersion, lastVersion?.version ?? 0) + 1;

      const snapshot = this.versionsRepo.create({
        requirement: { id } as Requirement,
        version: nextVersion,
        // Snapshot del estado anterior antes de aplicar el cambio
        titulo: prevSnapshot.titulo,
        descripcion: prevSnapshot.descripcion,
        criteriosAceptacion: prevSnapshot.criteriosAceptacion,
        motivoCambio: reason || 'Cambio automático',
        creadoPor: user,
      });
      await this.versionsRepo.save(snapshot);
      req.version = nextVersion;
      await this.notifyVersionChange(
        req,
        nextVersion,
        reason || 'Cambio automático',
        user,
        versionOpts,
      );
    }

    const saved = await this.repo.save(req);
    if (versionOpts.has('hist_completo')) {
      const deltas: string[] = [];
      const push = (label: string, before: unknown, after: unknown) => {
        const b = this.normalizeValue(before);
        const a = this.normalizeValue(after);
        if (b === a) return;
        deltas.push(`${label}: "${b || '∅'}" -> "${a || '∅'}"`);
      };
      push('titulo', prevSnapshot.titulo, saved.titulo);
      push('descripcion', prevSnapshot.descripcion, saved.descripcion);
      push('criteriosAceptacion', prevSnapshot.criteriosAceptacion, saved.criteriosAceptacion);
      push('prioridad', prevSnapshot.prioridad, saved.prioridad);
      push('tipo', prevSnapshot.tipo, saved.tipo);
      push('estado', prevSnapshot.estado, saved.estado);
      push('proyectoId', prevSnapshot.proyectoId, saved.project?.id ?? null);
      push('solicitanteId', prevSnapshot.solicitanteId, saved.solicitante?.id ?? null);
      push('responsableId', prevSnapshot.responsableId, saved.responsable?.id ?? null);
      push('categoria', prevSnapshot.categoria, saved.categoria ?? null);

      if (deltas.length) {
        await this.auditService.log(
          'DETALLE_CAMBIO_REQUISITO',
          'requirements',
          id,
          deltas.join(' | '),
          user,
        );
      }
    }
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
