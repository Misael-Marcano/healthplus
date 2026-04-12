import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementValidation } from './requirement-validation.entity';
import { ValidationService } from './validation.service';
import { ValidationController } from './validation.controller';
import { RequirementsModule } from '../requirements/requirements.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RequirementValidation]),
    RequirementsModule,
    MailModule,
  ],
  controllers: [ValidationController],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
