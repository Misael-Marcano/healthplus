import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateUserDto {
  @ApiProperty() @IsString()  nombre: string;
  @ApiProperty() @IsEmail()   email: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty() @IsNumber()  roleId: number;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() activo?: boolean;
}
