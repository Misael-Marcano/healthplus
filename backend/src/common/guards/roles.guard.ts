import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { OR_ANY_PERMISO_KEY } from '../decorators/or-any-permiso.decorator';
import { mergePermisos, type RolePermisos } from '../../roles/role-permissions';
import { User } from '../../users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const orAnyPermiso = this.reflector.getAllAndOverride<(keyof RolePermisos)[]>(
      OR_ANY_PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length && !orAnyPermiso?.length) return true;

    const { user } = context.switchToHttp().getRequest() as { user?: User & { rol?: string } };
    const rol = user?.rol ?? user?.role?.nombre;
    if (!rol) {
      throw new ForbiddenException('No tienes permiso para realizar esta acción');
    }

    // 1) Matriz por rol (p. ej. gerencia con `validate: true` en BD) — antes que la lista fija de nombres
    if (orAnyPermiso?.length) {
      const p = mergePermisos(rol, user?.role?.permisos ?? null);
      if (orAnyPermiso.some((k) => p[k])) return true;
    }

    if (!requiredRoles?.length) {
      throw new ForbiddenException('No tienes permiso para realizar esta acción');
    }

    if (requiredRoles.includes(rol)) return true;

    throw new ForbiddenException('No tienes permiso para realizar esta acción');
  }
}
