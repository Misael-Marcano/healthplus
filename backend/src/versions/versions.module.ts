import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementVersion } from './requirement-version.entity';
import { VersionsService } from './versions.service';
import { VersionsController } from './versions.controller';
import { RequirementsModule } from '../requirements/requirements.module';

@Module({
  imports: [TypeOrmModule.forFeature([RequirementVersion]), RequirementsModule],
  controllers: [VersionsController],
  providers: [VersionsService],
})
export class VersionsModule {}
