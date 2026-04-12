import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Salud de la API (sin JWT; útil para balanceadores y pruebas e2e). */
  @Public()
  @Get()
  getHealth() {
    return this.appService.getHealth();
  }
}
