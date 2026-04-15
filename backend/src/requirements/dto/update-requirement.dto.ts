import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateRequirementDto } from './create-requirement.dto';

export class UpdateRequirementDto extends PartialType(CreateRequirementDto) {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoCambio?: string;
}
