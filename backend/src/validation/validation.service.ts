import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementValidation } from './requirement-validation.entity';
import { User } from '../users/user.entity';
import { RequirementsService } from '../requirements/requirements.service';
import { ValidateDto } from './dto/validate.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ValidationService {
  private readonly log = new Logger(ValidationService.name);

  constructor(
    @InjectRepository(RequirementValidation) private repo: Repository<RequirementValidation>,
    private requirementsService: RequirementsService,
    private mailService: MailService,
    private cfg: ConfigService,
  ) {}

  findByRequirement(requirementId: number) {
    return this.repo.find({
      where: { requirement: { id: requirementId } },
      relations: ['validador', 'solicitadoPor'],
      order: { creadoEn: 'DESC' },
    });
  }

  /** Validaciones asignadas al usuario actual (todas los estados), para la pantalla Validación. */
  findMine(user: User) {
    return this.repo.find({
      where: { validador: { id: user.id } },
      relations: ['requirement', 'validador', 'solicitadoPor'],
      order: { creadoEn: 'DESC' },
    });
  }

  /** IDs de requisitos que ya tienen una validación en estado pendiente (evitar duplicar solicitudes). */
  async pendingRequirementIds(): Promise<number[]> {
    const rows = await this.repo.find({
      where: { estado: 'pendiente' },
      relations: ['requirement'],
    });
    const ids = rows
      .map((r) => r.requirement?.id)
      .filter((id): id is number => typeof id === 'number');
    return [...new Set(ids)];
  }

  findPending() {
    return this.repo.find({
      where: { estado: 'pendiente' },
      relations: ['requirement', 'validador'],
      order: { creadoEn: 'DESC' },
    });
  }

  async requestValidation(requirementId: number, validadorId: number, user: User) {
    const requirement = await this.requirementsService.findOne(requirementId);

    const yaPendiente = await this.repo.findOne({
      where: { requirement: { id: requirementId }, estado: 'pendiente' },
    });
    if (yaPendiente) {
      throw new BadRequestException(
        'Ya existe una validación pendiente para este requisito. Espere a que el validador responda antes de solicitar otra.',
      );
    }

    const v = this.repo.create({
      requirement: { id: requirement.id } as any,
      validador: { id: validadorId } as any,
      solicitadoPor: { id: user.id } as any,
      estado: 'pendiente',
    });
    await this.requirementsService.update(requirementId, { estado: 'en_revision' } as any, user);
    const saved = await this.repo.save(v);

    const full = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['validador'],
    });
    const validador = full?.validador;
    const email = validador?.email?.trim();
    if (email && validador) {
      const smtpOk = await this.mailService.isSmtpConfigured();
      if (smtpOk) {
        const base =
          this.cfg.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
        const root = base.replace(/\/$/, '');
        const validationUrl = `${root}/validacion`;
        const detailUrl = `${root}/requisitos/${requirement.id}`;
        const result = await this.mailService.sendValidationRequestedEmail(email, {
          validadorNombre: validador.nombre,
          requisitoCodigo: requirement.codigo ?? '',
          requisitoTitulo: requirement.titulo ?? '',
          solicitanteNombre: user.nombre,
          detailUrl,
          validationUrl,
        });
        if (!result.sent && result.error) {
          this.log.warn(
            `No se pudo enviar correo de validación a ${email}: ${result.error}`,
          );
        }
      }
    }

    return saved;
  }

  async validate(id: number, dto: ValidateDto, user: User) {
    const v = await this.repo.findOne({
      where: { id },
      relations: ['requirement', 'validador'],
    });
    if (!v) throw new NotFoundException('Validación no encontrada');
    if (v.estado !== 'pendiente') throw new BadRequestException('Esta validación ya fue procesada');

    const vid = v.validador?.id;
    if (vid == null || vid !== user.id) {
      throw new ForbiddenException(
        'Solo el validador asignado puede aprobar, rechazar o registrar observaciones en esta solicitud.',
      );
    }

    v.estado = dto.estado;
    v.comentario = dto.comentario ?? '';
    await this.repo.save(v);

    // Actualizar estado del requisito según la acción
    const nuevoEstado =
      dto.estado === 'aprobado'  ? 'aprobado'  :
      dto.estado === 'rechazado' ? 'rechazado' : 'requiere_ajuste';

    await this.requirementsService.update(v.requirement.id, { estado: nuevoEstado } as any, user);
    return v;
  }
}
