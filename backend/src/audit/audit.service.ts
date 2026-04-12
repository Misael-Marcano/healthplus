import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { User } from '../users/user.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private repo: Repository<AuditLog>) {}

  async log(accion: string, entidad: string, entidadId: number, detalle: string, user?: User) {
    const entry = this.repo.create({ accion, entidad, entidadId, detalle, user });
    return this.repo.save(entry);
  }

  findAll() {
    return this.repo.find({ order: { creadoEn: 'DESC' }, take: 200 });
  }

  findByEntity(entidad: string, entidadId: number) {
    return this.repo.find({
      where: { entidad, entidadId },
      order: { creadoEn: 'DESC' },
    });
  }
}
