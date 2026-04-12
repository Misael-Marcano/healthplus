import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RolePermisosDto {
  @ApiProperty()
  @IsBoolean()
  manageUsers: boolean;

  @ApiProperty()
  @IsBoolean()
  createReq: boolean;

  @ApiProperty()
  @IsBoolean()
  editReq: boolean;

  @ApiProperty()
  @IsBoolean()
  validate: boolean;

  @ApiProperty()
  @IsBoolean()
  reports: boolean;

  @ApiProperty()
  @IsBoolean()
  settings: boolean;
}

export class UpdateRolePermissionsBodyDto {
  @ApiProperty({ type: RolePermisosDto })
  @IsObject()
  @ValidateNested()
  @Type(() => RolePermisosDto)
  permisos: RolePermisosDto;
}
