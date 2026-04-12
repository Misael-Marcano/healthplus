import { SetMetadata } from '@nestjs/common';
import type { RolePermisos } from '../../roles/role-permissions';

export const OR_ANY_PERMISO_KEY = 'orAnyPermiso';

/** Si el rol no está en @Roles, permite acceso si el rol tiene alguno de estos permisos (matriz en BD). */
export const OrAnyPermiso = (...keys: (keyof RolePermisos)[]) =>
  SetMetadata(OR_ANY_PERMISO_KEY, keys);
