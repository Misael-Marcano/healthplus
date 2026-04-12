import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { ValidationModule } from '../validation/validation.module';
import { RequirementComment } from '../requirements/requirement-comment.entity';
import { RequirementAttachment } from '../requirements/requirement-attachment.entity';
import { NotificationRead } from './notification-read.entity';

@Module({
  imports: [
    ValidationModule,
    TypeOrmModule.forFeature([
      RequirementComment,
      RequirementAttachment,
      NotificationRead,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
