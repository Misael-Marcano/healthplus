import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ValidationService } from './validation.service';
import { ValidateDto } from './dto/validate.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrAnyPermiso } from '../common/decorators/or-any-permiso.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../users/user.entity';

@ApiTags('Validation')
@ApiBearerAuth()
@Controller('validation')
export class ValidationController {
  constructor(private service: ValidationService) {}

  @Get('pending')
  @Roles('administrador', 'analista', 'stakeholder')
  @OrAnyPermiso('validate')
  @ApiOperation({ summary: 'Listar validaciones pendientes (todas; uso interno / notificaciones)' })
  findPending() { return this.service.findPending(); }

  @Get('mine')
  @Roles('administrador', 'analista', 'stakeholder')
  @OrAnyPermiso('validate')
  @ApiOperation({
    summary: 'Validaciones asignadas al usuario actual (todos los estados)',
  })
  findMine(@CurrentUser() user: User) {
    return this.service.findMine(user);
  }

  @Get('pending-requirement-ids')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq')
  @ApiOperation({
    summary: 'IDs de requisitos que ya tienen una validación pendiente',
  })
  pendingRequirementIds() {
    return this.service.pendingRequirementIds().then((ids) => ({ ids }));
  }

  @Get('requirement/:id')
  @Roles('administrador', 'analista', 'stakeholder')
  @OrAnyPermiso('validate')
  @ApiOperation({ summary: 'Historial de validaciones de un requisito' })
  findByRequirement(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByRequirement(id);
  }

  @Post('request/:requirementId')
  @Roles('administrador', 'analista')
  @OrAnyPermiso('createReq')
  @ApiOperation({ summary: 'Solicitar validación de un requisito' })
  request(
    @Param('requirementId', ParseIntPipe) requirementId: number,
    @Body('validadorId') validadorId: number,
    @CurrentUser() user: User,
  ) {
    return this.service.requestValidation(requirementId, validadorId, user);
  }

  @Patch(':id')
  @Roles('administrador', 'stakeholder')
  @OrAnyPermiso('validate')
  @ApiOperation({ summary: 'Aprobar, rechazar o comentar una validación' })
  validate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ValidateDto,
    @CurrentUser() user: User,
  ) {
    return this.service.validate(id, dto, user);
  }
}
