import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SettingsModule } from '../settings/settings.module';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule, SettingsModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
