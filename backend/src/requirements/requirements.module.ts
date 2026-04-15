import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement } from './requirement.entity';
import { RequirementStatusDef } from './requirement-status-def.entity';
import { RequirementCategoryDef } from './requirement-category-def.entity';
import { RequirementComment } from './requirement-comment.entity';
import { RequirementAttachment } from './requirement-attachment.entity';
import { RequirementVersion } from '../versions/requirement-version.entity';
import { RequirementsService } from './requirements.service';
import { RequirementStatusDefsService } from './requirement-status-defs.service';
import { RequirementCategoryDefsService } from './requirement-category-defs.service';
import { RequirementAttachmentsService } from './requirement-attachments.service';
import { RequirementsController } from './requirements.controller';
import { RequirementStatusDefsController } from './requirement-status-defs.controller';
import { RequirementCategoryDefsController } from './requirement-category-defs.controller';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';
import { SettingsModule } from '../settings/settings.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Requirement,
      RequirementStatusDef,
      RequirementCategoryDef,
      RequirementComment,
      RequirementAttachment,
      RequirementVersion,
    ]),
    AuditModule,
    UsersModule,
    SettingsModule,
    MailModule,
  ],
  controllers: [
    RequirementsController,
    RequirementStatusDefsController,
    RequirementCategoryDefsController,
  ],
  providers: [
    RequirementsService,
    RequirementStatusDefsService,
    RequirementCategoryDefsService,
    RequirementAttachmentsService,
  ],
  exports: [
    RequirementsService,
    RequirementStatusDefsService,
    RequirementCategoryDefsService,
  ],
})
export class RequirementsModule {}
