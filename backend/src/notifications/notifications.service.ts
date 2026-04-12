import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ValidationService } from '../validation/validation.service';
import { RequirementComment } from '../requirements/requirement-comment.entity';
import { RequirementAttachment } from '../requirements/requirement-attachment.entity';
import { NotificationRead } from './notification-read.entity';

export type InboxItemKind = 'validation_pending' | 'comment' | 'attachment';

export interface InboxItem {
  kind: InboxItemKind;
  id: number;
  creadoEn: string;
  requirementId: number;
  codigo: string;
  titulo: string;
  read: boolean;
  /** validation_pending */
  validadorNombre?: string;
  /** comment */
  preview?: string;
  /** attachment */
  fileName?: string;
  actorNombre?: string;
}

const DISPLAY_LIMIT = 20;
const MERGE_CAP = 200;
const ACTIVITY_DAYS = 14;

function rolOf(user: User): string {
  return (user as User & { rol?: string }).rol ?? user.role?.nombre ?? '';
}

function itemKey(kind: string, id: number): string {
  return `${kind}:${id}`;
}

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(
    private readonly validationService: ValidationService,
    @InjectRepository(RequirementComment)
    private readonly commentRepo: Repository<RequirementComment>,
    @InjectRepository(RequirementAttachment)
    private readonly attachmentRepo: Repository<RequirementAttachment>,
    @InjectRepository(NotificationRead)
    private readonly readRepo: Repository<NotificationRead>,
  ) {}

  async markRead(
    userId: number,
    items: { kind: InboxItemKind; id: number }[],
  ): Promise<void> {
    if (!items.length) return;
    try {
      const seen = new Set<string>();
      for (const it of items) {
        const k = itemKey(it.kind, it.id);
        if (seen.has(k)) continue;
        seen.add(k);
        const exists = await this.readRepo.findOne({
          where: { userId, kind: it.kind, refId: it.id },
        });
        if (exists) continue;
        await this.readRepo.save({
          userId,
          kind: it.kind,
          refId: it.id,
        });
      }
    } catch (err) {
      this.log.warn(
        `markRead omitido (¿tabla notification_reads?): ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async loadReadSet(
    userId: number,
    candidates: { kind: InboxItemKind; id: number }[],
  ): Promise<Set<string>> {
    const set = new Set<string>();
    const chunkSize = 45;
    for (let i = 0; i < candidates.length; i += chunkSize) {
      const group = candidates.slice(i, i + chunkSize);
      if (!group.length) continue;
      // Usar nombres de propiedad del entity (TypeORM → columnas SQL); `user_id`/`ref_id` en string rompen en MSSQL.
      const rows = await this.readRepo
        .createQueryBuilder('r')
        .where('r.userId = :uid', { uid: userId })
        .andWhere(
          new Brackets((qb) => {
            group.forEach((it, idx) => {
              qb.orWhere(`(r.kind = :k${idx} AND r.refId = :rid${idx})`, {
                [`k${idx}`]: it.kind,
                [`rid${idx}`]: it.id,
              });
            });
          }),
        )
        .getMany();
      for (const row of rows) {
        set.add(itemKey(row.kind, row.refId));
      }
    }
    return set;
  }

  async getInbox(user: User): Promise<{ items: InboxItem[]; unreadCount: number }> {
    const rol = rolOf(user);
    const pending = await this.validationService.findPending();

    const validationItems: Omit<InboxItem, 'read'>[] = [];
    for (const v of pending) {
      if (v.estado !== 'pendiente') continue;
      const req = v.requirement;
      if (!req?.id) continue;
      if (rol === 'stakeholder') {
        const vid = v.validador?.id;
        if (vid == null || vid !== user.id) continue;
      }
      const creadoEn = v.creadoEn ?? new Date();
      validationItems.push({
        kind: 'validation_pending',
        id: v.id,
        creadoEn: creadoEn instanceof Date ? creadoEn.toISOString() : String(creadoEn),
        requirementId: req.id,
        codigo: req.codigo ?? '',
        titulo: req.titulo ?? '',
        validadorNombre: v.validador?.nombre ?? undefined,
      });
    }

    const activity: Omit<InboxItem, 'read'>[] = [];
    if (rol === 'administrador' || rol === 'analista') {
      const since = new Date();
      since.setDate(since.getDate() - ACTIVITY_DAYS);

      const comments = await this.commentRepo
        .createQueryBuilder('c')
        .innerJoinAndSelect('c.requirement', 'r')
        .leftJoinAndSelect('c.autor', 'autor')
        .where('r.deleted = :del', { del: false })
        .andWhere('(r.responsable_id = :uid OR r.solicitante_id = :uid)', {
          uid: user.id,
        })
        .andWhere('autor.id != :uid', { uid: user.id })
        .andWhere('c.creadoEn > :since', { since })
        .orderBy('c.creadoEn', 'DESC')
        .take(25)
        .getMany();

      for (const c of comments) {
        const req = c.requirement;
        const autor = c.autor;
        const texto = (c.texto ?? '').replace(/\s+/g, ' ').trim();
        activity.push({
          kind: 'comment',
          id: c.id,
          creadoEn:
            c.creadoEn instanceof Date
              ? c.creadoEn.toISOString()
              : String(c.creadoEn),
          requirementId: req?.id ?? 0,
          codigo: req?.codigo ?? '',
          titulo: req?.titulo ?? '',
          preview: texto.length > 120 ? `${texto.slice(0, 117)}…` : texto,
          actorNombre: autor?.nombre ?? '—',
        });
      }

      const attachments = await this.attachmentRepo
        .createQueryBuilder('a')
        .innerJoinAndSelect('a.requirement', 'r')
        .leftJoinAndSelect('a.subidoPor', 'sp')
        .where('r.deleted = :del', { del: false })
        .andWhere('(r.responsable_id = :uid OR r.solicitante_id = :uid)', {
          uid: user.id,
        })
        .andWhere('(sp.id IS NULL OR sp.id != :uid)', { uid: user.id })
        .andWhere('a.creadoEn > :since', { since })
        .orderBy('a.creadoEn', 'DESC')
        .take(25)
        .getMany();

      for (const a of attachments) {
        const req = a.requirement;
        const sp = a.subidoPor;
        activity.push({
          kind: 'attachment',
          id: a.id,
          creadoEn:
            a.creadoEn instanceof Date
              ? a.creadoEn.toISOString()
              : String(a.creadoEn),
          requirementId: req?.id ?? 0,
          codigo: req?.codigo ?? '',
          titulo: req?.titulo ?? '',
          fileName: a.nombreOriginal ?? '',
          actorNombre: sp?.nombre ?? '—',
        });
      }
    }

    const merged = [...validationItems, ...activity].sort((x, y) => {
      const ax = new Date(x.creadoEn).getTime();
      const bx = new Date(y.creadoEn).getTime();
      return bx - ax;
    });

    const seen = new Set<string>();
    const deduped: Omit<InboxItem, 'read'>[] = [];
    for (const it of merged) {
      const key = itemKey(it.kind, it.id);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(it);
      if (deduped.length >= MERGE_CAP) break;
    }

    const candidates = deduped.map((it) => ({ kind: it.kind, id: it.id }));
    let readSet: Set<string>;
    try {
      readSet = await this.loadReadSet(user.id, candidates);
    } catch (err) {
      this.log.warn(
        `No se pudieron cargar lecturas de notificaciones (¿migración notification_reads?): ${err instanceof Error ? err.message : err}`,
      );
      readSet = new Set();
    }

    const withRead: InboxItem[] = deduped.map((it) => ({
      ...it,
      read: readSet.has(itemKey(it.kind, it.id)),
    }));

    const unreadCount = withRead.filter((it) => !it.read).length;

    const displayed = withRead.slice(0, DISPLAY_LIMIT);

    return { items: displayed, unreadCount };
  }
}
