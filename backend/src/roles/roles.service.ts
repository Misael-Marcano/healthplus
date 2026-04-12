import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { mergePermisos } from './role-permissions';
import type { RolePermisosDto } from './dto/update-role-permissions.dto';

@Injectable()
export class RolesService {
  constructor(@InjectRepository(Role) private repo: Repository<Role>) {}

  findAll(): Promise<Role[]> {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }

  async updatePermissions(id: number, dto: RolePermisosDto): Promise<Role> {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    role.permisos = mergePermisos(role.nombre, dto);
    return this.repo.save(role);
  }
}
