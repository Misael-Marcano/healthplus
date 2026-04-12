import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementValidation } from './requirement-validation.entity';
import { User } from '../users/user.entity';
import { RequirementsService } from '../requirements/requirements.service';
import { ValidateDto } from './dto/validate.dto';

@Injectable()
export class ValidationService {
  constructor(
    @InjectRepository(RequirementValidation) private repo: Repository<RequirementValidation>,
    private requirementsService: RequirementsService,
  ) {}

  findByRequirement(requirementId: number) {
    return this.repo.find({
      where: { requirement: { id: requirementId } },
      order: { creadoEn: 'DESC' },
    });
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
    const v = this.repo.create({
      requirement: { id: requirement.id } as any,
      validador: { id: validadorId } as any,
      estado: 'pendiente',
    });
    await this.requirementsService.update(requirementId, { estado: 'en_revision' } as any, user);
    return this.repo.save(v);
  }

  async validate(id: number, dto: ValidateDto, user: User) {
    const v = await this.repo.findOne({ where: { id }, relations: ['requirement'] });
    if (!v) throw new NotFoundException('Validación no encontrada');
    if (v.estado !== 'pendiente') throw new BadRequestException('Esta validación ya fue procesada');

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
