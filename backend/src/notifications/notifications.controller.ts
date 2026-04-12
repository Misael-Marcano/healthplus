import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrAnyPermiso } from '../common/decorators/or-any-permiso.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../users/user.entity';
import { MarkReadDto } from './dto/mark-read.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('inbox')
  @Roles('administrador', 'analista', 'stakeholder', 'gerencia', 'consulta')
  @OrAnyPermiso('validate', 'createReq', 'reports')
  @ApiOperation({
    summary:
      'Bandeja unificada: validaciones pendientes (filtradas por rol) y, para admin/analista, comentarios y adjuntos recientes en requisitos donde el usuario es responsable o solicitante. Cada ítem incluye `read`; `unreadCount` cuenta solo no leídas en el conjunto reciente (hasta 200).',
  })
  getInbox(@CurrentUser() user: User) {
    return this.notificationsService.getInbox(user);
  }

  @Post('mark-read')
  @HttpCode(204)
  @Roles('administrador', 'analista', 'stakeholder', 'gerencia', 'consulta')
  @OrAnyPermiso('validate', 'createReq', 'reports')
  @ApiOperation({ summary: 'Marcar notificaciones como leídas (por tipo e id de origen)' })
  async markRead(@CurrentUser() user: User, @Body() dto: MarkReadDto) {
    await this.notificationsService.markRead(user.id, dto.items);
  }
}
