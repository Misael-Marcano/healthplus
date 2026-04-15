import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementVersion } from './requirement-version.entity';
import { User } from '../users/user.entity';
import { Requirement } from '../requirements/requirement.entity';
import { SettingsService } from '../settings/settings.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateVersionDto {
  @ApiProperty({ description: 'Motivo del cambio para registrar la versión' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivoCambio: string;
}

@Injectable()
export class VersionsService {
  private readonly log = new Logger(VersionsService.name);

  constructor(
    @InjectRepository(RequirementVersion) private repo: Repository<RequirementVersion>,
    @InjectRepository(Requirement) private requirementsRepo: Repository<Requirement>,
    private settingsService: SettingsService,
    private mailService: MailService,
    private cfg: ConfigService,
  ) {}

  findByRequirement(requirementId: number) {
    return this.repo.find({
      where: { requirement: { id: requirementId } },
      order: { version: 'DESC' },
    });
  }

  async createVersion(requirement: any, dto: CreateVersionDto, user: User) {
    const motivoCambio = (dto?.motivoCambio ?? '').trim();
    if (!motivoCambio) {
      throw new BadRequestException('Debes indicar el motivo del cambio para registrar una versión');
    }

    const lastVersion = await this.repo.findOne({
      where: { requirement: { id: requirement.id } },
      order: { version: 'DESC' },
    });
    const baseVersion =
      typeof requirement.version === 'number' && Number.isFinite(requirement.version)
        ? requirement.version
        : 1;
    const nextVersion = Math.max(baseVersion, lastVersion?.version ?? 0) + 1;

    const version = this.repo.create({
      requirement: { id: requirement.id } as any,
      version: nextVersion,
      titulo: requirement.titulo,
      descripcion: requirement.descripcion,
      criteriosAceptacion: requirement.criteriosAceptacion,
      motivoCambio,
      creadoPor: user,
    });
    const saved = await this.repo.save(version);
    await this.requirementsRepo.update(
      { id: requirement.id },
      { version: nextVersion } as Partial<Requirement>,
    );
    await this.notifyVersionChange(requirement, nextVersion, motivoCambio, user);
    return saved;
  }

  private async notifyVersionChange(
    requirement: Requirement,
    version: number,
    motivoCambio: string,
    actor: User,
  ): Promise<void> {
    const settings = await this.settingsService.getPublic();
    const opts = new Set(settings.versionOpts ?? []);
    if (!opts.has('notif_cambio')) return;
    if (!(await this.mailService.isSmtpConfigured())) return;

    const recipients = new Map<string, string>();
    const add = (u: any) => {
      const email = u?.email?.trim();
      const nombre = u?.nombre?.trim();
      if (!email || !nombre) return;
      if (email === actor.email) return;
      recipients.set(email, nombre);
    };
    add((requirement as any).solicitante);
    add((requirement as any).responsable);
    add((requirement as any).creadoPor);
    if (!recipients.size) return;

    const base = this.cfg.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const detailUrl = `${base.replace(/\/$/, '')}/requisitos/${requirement.id}`;

    for (const [email, nombre] of recipients) {
      const sent = await this.mailService.sendRequirementVersionCreatedEmail(email, {
        destinatarioNombre: nombre,
        requisitoCodigo: requirement.codigo ?? '',
        requisitoTitulo: requirement.titulo ?? '',
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
}
