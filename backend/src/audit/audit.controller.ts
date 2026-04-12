import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private service: AuditService) {}

  @Get()
  @Roles('administrador')
  @ApiOperation({ summary: 'Ver log de auditoría completo' })
  findAll() { return this.service.findAll(); }

  @Get('entity')
  @Roles('administrador')
  @ApiOperation({ summary: 'Ver auditoría de una entidad específica' })
  findByEntity(@Query('entidad') entidad: string, @Query('id') id: string) {
    return this.service.findByEntity(entidad, +id);
  }
}
