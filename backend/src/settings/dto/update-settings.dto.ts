import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrgDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  web?: string;
}

export class PrefsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lang?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tz?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  datefmt?: string;
}

export class SmtpDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  port?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  user?: string;

  /** Si se envía vacío, no se cambia la contraseña guardada. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => OrgDto)
  org?: OrgDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => PrefsDto)
  prefs?: PrefsDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cats?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vtrigger?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  versionOpts?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notifOpts?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SmtpDto)
  smtp?: SmtpDto;
}
