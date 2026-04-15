import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementVersion } from './requirement-version.entity';
import { VersionsService } from './versions.service';
import { VersionsController } from './versions.controller';
import { RequirementsModule } from '../requirements/requirements.module';
import { Requirement } from '../requirements/requirement.entity';
import { SettingsModule } from '../settings/settings.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequirementVersion, Requirement]),
    RequirementsModule,
    SettingsModule,
    MailModule,
  ],
  controllers: [VersionsController],
  providers: [VersionsService],
})
export class VersionsModule {}
