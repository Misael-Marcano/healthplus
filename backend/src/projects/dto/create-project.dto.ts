import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsIn } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty()  @IsString()                nombre: string;
  @ApiPropertyOptional() @IsString()  @IsOptional() descripcion?: string;
  @ApiPropertyOptional() @IsIn(['activo','pausado','completado','cancelado']) @IsOptional() estado?: string;
  @ApiPropertyOptional() @IsNumber()  @IsOptional() responsableId?: number;
  @ApiPropertyOptional() @IsDateString() @IsOptional() fechaInicio?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() fechaFin?: string;
}
