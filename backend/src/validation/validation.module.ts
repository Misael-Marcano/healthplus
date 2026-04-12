import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequirementValidation } from './requirement-validation.entity';
import { ValidationService } from './validation.service';
import { ValidationController } from './validation.controller';
import { RequirementsModule } from '../requirements/requirements.module';

@Module({
  imports: [TypeOrmModule.forFeature([RequirementValidation]), RequirementsModule],
  controllers: [ValidationController],
  providers: [ValidationService],
})
export class ValidationModule {}
