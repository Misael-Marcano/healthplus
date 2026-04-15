import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService, type ReportDateFilters } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';

const VALIDATION_ESTADOS = new Set(['pendiente', 'aprobado', 'rechazado', 'comentado']);

function parseOptionalInt(q?: string): number | undefined {
  if (q == null || q === '') return undefined;
  const n = Number(q);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new BadRequestException(`Parámetro numérico inválido: ${q}`);
  }
  return n;
}

/** YYYY-MM-DD → inicio del día UTC */
function parseDayStart(s?: string): Date | undefined {
  if (s == null || s.trim() === '') return undefined;
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    throw new BadRequestException(`Fecha inválida (use YYYY-MM-DD): ${s}`);
  }
  return new Date(`${t}T00:00:00.000Z`);
}

/** YYYY-MM-DD → fin del día UTC */
function parseDayEnd(s?: string): Date | undefined {
  if (s == null || s.trim() === '') return undefined;
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    throw new BadRequestException(`Fecha inválida (use YYYY-MM-DD): ${s}`);
  }
  return new Date(`${t}T23:59:59.999Z`);
}

function buildDateFilters(
  createdFrom?: string,
  createdTo?: string,
  updatedFrom?: string,
  updatedTo?: string,
): ReportDateFilters | undefined {
  const dates: ReportDateFilters = {};
  const cf = parseDayStart(createdFrom);
  const ct = parseDayEnd(createdTo);
  const uf = parseDayStart(updatedFrom);
  const ut = parseDayEnd(updatedTo);
  if (cf) dates.createdFrom = cf;
  if (ct) dates.createdTo = ct;
  if (uf) dates.updatedFrom = uf;
  if (ut) dates.updatedTo = ut;
  if (Object.keys(dates).length === 0) return undefined;
  return dates;
}

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
  @ApiOperation({ summary: 'Listado detallado para exportación (proyecto y/o fechas opcionales)' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({ name: 'createdFrom', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'createdTo', required: false, type: String })
  @ApiQuery({ name: 'updatedFrom', required: false, type: String })
  @ApiQuery({ name: 'updatedTo', required: false, type: String })
  requirementsDetail(
    @Query('projectId') projectId?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
    @Query('updatedFrom') updatedFrom?: string,
    @Query('updatedTo') updatedTo?: string,
  ) {
    const dates = buildDateFilters(createdFrom, createdTo, updatedFrom, updatedTo);
    return this.service.getRequirementsDetail({
      projectId: parseOptionalInt(projectId),
      dates,
    });
  }

  @Get('user-project-requirements')
  @ApiOperation({
    summary: 'Requisitos por usuario y proyecto (matriz para exportar)',
    description:
      'Filas: participación de cada usuario (solicitante o responsable). Filtros opcionales userId, projectId y fechas sobre el requisito.',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({ name: 'createdFrom', required: false, type: String })
  @ApiQuery({ name: 'createdTo', required: false, type: String })
  @ApiQuery({ name: 'updatedFrom', required: false, type: String })
  @ApiQuery({ name: 'updatedTo', required: false, type: String })
  userProjectRequirements(
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
    @Query('createdFrom') createdFrom?: string,
    @Query('createdTo') createdTo?: string,
    @Query('updatedFrom') updatedFrom?: string,
    @Query('updatedTo') updatedTo?: string,
  ) {
    const dates = buildDateFilters(createdFrom, createdTo, updatedFrom, updatedTo);
    return this.service.getUserProjectRequirements({
      userId: parseOptionalInt(userId),
      projectId: parseOptionalInt(projectId),
      dates,
    });
  }

  @Get('validations-detail')
  @ApiOperation({ summary: 'Validaciones con contexto de requisito (exportación)' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({ name: 'validadorId', required: false, type: Number })
  @ApiQuery({ name: 'estado', required: false, enum: ['pendiente', 'aprobado', 'rechazado', 'comentado'] })
  validationsDetail(
    @Query('projectId') projectId?: string,
    @Query('validadorId') validadorId?: string,
    @Query('estado') estado?: string,
  ) {
    if (estado != null && estado !== '' && !VALIDATION_ESTADOS.has(estado)) {
      throw new BadRequestException(`estado debe ser uno de: ${[...VALIDATION_ESTADOS].join(', ')}`);
    }
    return this.service.getValidationsDetail({
      projectId: parseOptionalInt(projectId),
      validadorId: parseOptionalInt(validadorId),
      estado: estado === '' ? undefined : estado,
    });
  }

  @Get('versions-export')
  @ApiOperation({ summary: 'Historial de versiones de requisitos (exportación)' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({ name: 'codigos', required: false, description: 'Códigos separados por coma, ej. REQ-001,REQ-002' })
  versionsExport(
    @Query('projectId') projectId?: string,
    @Query('codigos') codigosRaw?: string,
  ) {
    const codigos = codigosRaw
      ? codigosRaw.split(',').map((c) => c.trim()).filter(Boolean)
      : undefined;
    return this.service.getVersionsExport({
      projectId: parseOptionalInt(projectId),
      codigos: codigos?.length ? codigos : undefined,
    });
  }

  @Get('attachments-detail')
  @ApiOperation({ summary: 'Inventario de adjuntos por requisito/proyecto (exportación)' })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  attachmentsDetail(@Query('projectId') projectId?: string) {
    return this.service.getAttachmentsDetail(parseOptionalInt(projectId));
  }
}
