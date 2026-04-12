import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../roles/role.entity';
import { User } from '../users/user.entity';
import { RequirementStatusDef } from '../requirements/requirement-status-def.entity';
import { RequirementCategoryDef } from '../requirements/requirement-category-def.entity';
import { Requirement } from '../requirements/requirement.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      User,
      RequirementStatusDef,
      RequirementCategoryDef,
      Requirement,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
