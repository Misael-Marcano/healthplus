import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement } from '../requirements/requirement.entity';
import { Project } from '../projects/project.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Requirement, Project])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
