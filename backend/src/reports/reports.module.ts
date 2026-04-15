import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement } from '../requirements/requirement.entity';
import { RequirementAttachment } from '../requirements/requirement-attachment.entity';
import { Project } from '../projects/project.entity';
import { RequirementValidation } from '../validation/requirement-validation.entity';
import { RequirementVersion } from '../versions/requirement-version.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Requirement,
      Project,
      RequirementAttachment,
      RequirementValidation,
      RequirementVersion,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
