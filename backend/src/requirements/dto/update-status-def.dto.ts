import { PartialType } from '@nestjs/swagger';
import { CreateStatusDefDto } from './create-status-def.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateStatusDefDto extends PartialType(CreateStatusDefDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
