import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RequirementStatusDefsService } from './requirement-status-defs.service';
import { CreateStatusDefDto } from './dto/create-status-def.dto';
import { UpdateStatusDefDto } from './dto/update-status-def.dto';
import { OrAnyPermiso } from '../common/decorators/or-any-permiso.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Requirement statuses')
@ApiBearerAuth()
@Controller('requirement-statuses')
export class RequirementStatusDefsController {
  constructor(private readonly service: RequirementStatusDefsService) {}

  @Get()
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiQuery({ name: 'projectId', required: false })
  @ApiOperation({ summary: 'Listar estados (globales + del proyecto si se indica projectId)' })
  list(@Query('projectId') projectId?: string) {
    return this.service.findForProject(
      projectId !== undefined && projectId !== '' ? +projectId : undefined,
    );
  }

  @Post()
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Crear estado (por proyecto o global si projectId omitido)' })
  create(@Body() dto: CreateStatusDefDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Actualizar estado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDefDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Desactivar estado (no sistema)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
