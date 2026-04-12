import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';

/** KPIs del panel: todos los roles autenticados (la vista `/reportes` sigue filtrada en cliente por matriz). */
@ApiTags('Reports')
@ApiBearerAuth()
@Roles('administrador', 'analista', 'gerencia', 'consulta', 'stakeholder')
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs para el dashboard' })
  dashboard() { return this.service.getDashboard(); }

  @Get('by-status')
  @ApiOperation({ summary: 'Requisitos agrupados por estado' })
  byStatus() { return this.service.getByStatus(); }

  @Get('by-project')
  @ApiOperation({ summary: 'Requisitos agrupados por proyecto' })
  byProject() { return this.service.getByProject(); }

  @Get('by-priority')
  @ApiOperation({ summary: 'Requisitos agrupados por prioridad' })
  byPriority() { return this.service.getByPriority(); }

  @Get('monthly-progress')
  @ApiOperation({ summary: 'Progreso mensual últimos 6 meses' })
  monthlyProgress() { return this.service.getMonthlyProgress(); }

  @Get('requirements-detail')
  @ApiOperation({ summary: 'Listado detallado de requisitos para exportación' })
  requirementsDetail() {
    return this.service.getRequirementsDetail();
  }
}
