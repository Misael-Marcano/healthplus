import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from './role.entity';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(@InjectRepository(Role) private repo: Repository<Role>) {}

  @Get()
  @Roles('administrador')
  @ApiOperation({ summary: 'Listar roles (gestión de usuarios)' })
  findAll(): Promise<Role[]> {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }
}
