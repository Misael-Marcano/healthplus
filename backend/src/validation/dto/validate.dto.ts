import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ValidateDto {
  @ApiProperty({ enum: ['aprobado', 'rechazado', 'comentado'] })
  @IsIn(['aprobado', 'rechazado', 'comentado'], {
    message: 'estado debe ser aprobado, rechazado o comentado',
  })
  estado: 'aprobado' | 'rechazado' | 'comentado';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comentario?: string;
}
