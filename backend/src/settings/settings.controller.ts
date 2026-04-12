import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { OrAnyPermiso } from '../common/decorators/or-any-permiso.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener configuración del sistema (sin secretos SMTP)' })
  get() {
    return this.settingsService.getPublic();
  }

  @Patch()
  @Roles('administrador')
  @OrAnyPermiso('settings')
  @ApiOperation({ summary: 'Actualizar configuración (matriz: permiso settings)' })
  patch(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }
}
