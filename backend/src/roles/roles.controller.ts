import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from './role.entity';
import { OrAnyPermiso } from '../common/decorators/or-any-permiso.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesService } from './roles.service';
import { UpdateRolePermissionsBodyDto } from './dto/update-role-permissions.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @Roles('administrador')
  @OrAnyPermiso('manageUsers')
  @ApiOperation({ summary: 'Listar roles (gestión de usuarios)' })
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Patch(':id/permissions')
  @Roles('administrador')
  @OrAnyPermiso('manageUsers')
  @ApiOperation({ summary: 'Actualizar permisos de un rol' })
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateRolePermissionsBodyDto,
  ): Promise<Role> {
    return this.rolesService.updatePermissions(id, body.permisos);
  }
}
