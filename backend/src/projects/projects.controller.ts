import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private service: ProjectsService) {}

  @Get()
  @Roles('administrador', 'analista')
  @ApiOperation({ summary: 'Listar proyectos' })
  findAll() { return this.service.findAll(); }

  @Get(':id')
  @Roles('administrador', 'analista')
  @ApiOperation({ summary: 'Obtener proyecto' })
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles('administrador', 'analista')
  @ApiOperation({ summary: 'Crear proyecto' })
  create(@Body() dto: CreateProjectDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles('administrador', 'analista')
  @ApiOperation({ summary: 'Actualizar proyecto' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('administrador', 'analista')
  @ApiOperation({ summary: 'Eliminar proyecto (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
