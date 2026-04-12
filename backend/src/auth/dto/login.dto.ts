import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  /** Identificador de acceso: debe coincidir con el correo registrado en el sistema. */
  @ApiProperty({ example: 'admin@healthplus.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1, { message: 'El usuario es requerido' })
  @MaxLength(320)
  email: string;

  @ApiProperty({ example: 'Admin@1234' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  /** Si es true, el refresh token dura más (p. ej. 30 días). */
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    return value === true || value === 'true';
  })
  @IsBoolean()
  remember?: boolean;
}
