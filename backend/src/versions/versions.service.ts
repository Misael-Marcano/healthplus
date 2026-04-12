import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequirementVersion } from './requirement-version.entity';
import { User } from '../users/user.entity';

export class CreateVersionDto {
  motivoCambio: string;
}

@Injectable()
export class VersionsService {
  constructor(
    @InjectRepository(RequirementVersion) private repo: Repository<RequirementVersion>,
  ) {}

  findByRequirement(requirementId: number) {
    return this.repo.find({
      where: { requirement: { id: requirementId } },
      order: { version: 'DESC' },
    });
  }

  async createVersion(requirement: any, dto: CreateVersionDto, user: User) {
    const nextVersion = (requirement.version ?? 1) + 1;
    const version = this.repo.create({
      requirement: { id: requirement.id } as any,
      version: nextVersion,
      titulo: requirement.titulo,
      descripcion: requirement.descripcion,
      criteriosAceptacion: requirement.criteriosAceptacion,
      motivoCambio: dto.motivoCambio,
      creadoPor: user,
    });
    return this.repo.save(version);
  }
}
