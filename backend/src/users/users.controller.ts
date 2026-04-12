import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { OrAnyPermiso } from '../common/decorators/or-any-permiso.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('lookup')
  @ApiOperation({ summary: 'Listado mínimo (id, nombre) para asignaciones' })
  findLookup() {
    return this.service.findAllLookup();
  }

  @Get()
  @Roles('administrador')
  @OrAnyPermiso('manageUsers')
  @ApiOperation({ summary: 'Listar todos los usuarios (administración)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('administrador')
  @OrAnyPermiso('manageUsers')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('administrador')
  @OrAnyPermiso('manageUsers')
  @ApiOperation({ summary: 'Crear usuario' })
  create(@Body() dto: CreateUserDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles('administrador')
  @OrAnyPermiso('manageUsers')
  @ApiOperation({ summary: 'Actualizar usuario' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('administrador')
  @OrAnyPermiso('manageUsers')
  @ApiOperation({ summary: 'Desactivar usuario (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
