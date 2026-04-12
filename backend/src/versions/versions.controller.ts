import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { VersionsService, CreateVersionDto } from './versions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrAnyPermiso } from '../common/decorators/or-any-permiso.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirementsService } from '../requirements/requirements.service';
import { User } from '../users/user.entity';

@ApiTags('Versions')
@ApiBearerAuth()
@Controller('requirements/:id/versions')
export class VersionsController {
  constructor(
    private versionsService: VersionsService,
    private requirementsService: RequirementsService,
  ) {}

  @Get()
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Historial de versiones del requisito' })
  findAll(@Param('id', ParseIntPipe) id: number) {
    return this.versionsService.findByRequirement(id);
  }

  @Post()
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Crear nueva versión del requisito' })
  async create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateVersionDto,
    @CurrentUser() user: User,
  ) {
    const requirement = await this.requirementsService.findOne(id);
    return this.versionsService.createVersion(requirement, dto, user);
  }
}
