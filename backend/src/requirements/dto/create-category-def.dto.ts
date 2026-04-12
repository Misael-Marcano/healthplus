import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDefDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @ApiPropertyOptional({
    description: 'Solo letras minúsculas, números y guiones bajos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  projectId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orden?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;
}
