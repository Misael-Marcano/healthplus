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
import { RequirementCategoryDefsService } from './requirement-category-defs.service';
import { CreateCategoryDefDto } from './dto/create-category-def.dto';
import { UpdateCategoryDefDto } from './dto/update-category-def.dto';
import { OrAnyPermiso } from '../common/decorators/or-any-permiso.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Requirement categories')
@ApiBearerAuth()
@Controller('requirement-categories')
export class RequirementCategoryDefsController {
  constructor(private readonly service: RequirementCategoryDefsService) {}

  @Get()
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiQuery({ name: 'projectId', required: false })
  @ApiOperation({
    summary:
      'Listar categorías (globales + del proyecto si se indica projectId)',
  })
  list(@Query('projectId') projectId?: string) {
    return this.service.findForProject(
      projectId !== undefined && projectId !== '' ? +projectId : undefined,
    );
  }

  @Post()
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({
    summary: 'Crear categoría (por proyecto o global si projectId omitido)',
  })
  create(@Body() dto: CreateCategoryDefDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Actualizar categoría' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDefDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq', 'editReq')
  @ApiOperation({ summary: 'Desactivar categoría (no sistema)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
