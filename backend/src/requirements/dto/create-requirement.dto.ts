import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRequirementDto {
  @ApiProperty()    @IsString()  titulo: string;
  @ApiProperty()    @IsString()  descripcion: string;
  @ApiProperty()    @IsNumber()  projectId: number;
  @ApiPropertyOptional() @IsIn(['funcional','no_funcional']) @IsOptional() tipo?: string;
  @ApiPropertyOptional({ description: 'Slug de categoría (si no se usa categoryDefId)' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({
    description: 'ID de categoría del catálogo (prioridad sobre `categoria` slug); 0 = sin categoría',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryDefId?: number;

  @ApiPropertyOptional({
    description: 'IDs de categorías del catálogo (multi-categoría)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  categoryDefIds?: number[];

  @ApiPropertyOptional({
    description: 'Slugs de categorías (fallback cuando no se envían IDs)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categorias?: string[];
  @ApiPropertyOptional() @IsIn(['critica','alta','media','baja']) @IsOptional() prioridad?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) impacto?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) urgencia?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) esfuerzo?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) valor?: number;
  @ApiPropertyOptional({ description: 'Slug de estado (catálogo global o del proyecto)' })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({ description: 'ID del estado configurado (prioridad sobre `estado` slug)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusDefId?: number;
  @ApiPropertyOptional() @IsString()  @IsOptional() criteriosAceptacion?: string;
  @ApiPropertyOptional() @IsNumber()  @IsOptional() solicitanteId?: number;
  @ApiPropertyOptional() @IsNumber()  @IsOptional() responsableId?: number;
}
