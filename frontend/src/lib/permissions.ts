import type { RolePermisos } from "@/types";

/** Rutas solo para administrador (menú + API alineadas). */
export const ADMIN_ONLY_PATHS = new Set([
  "/usuarios",
  "/configuracion",
  "/auditoria",
]);

function normalizePath(pathname: string): string {
  const p = pathname.split("?")[0] || "/";
  return p.replace(/\/$/, "") || "/";
}

function hasPermisos(p: RolePermisos | null | undefined): p is RolePermisos {
  return p != null && typeof p.manageUsers === "boolean";
}

/** Coincide ruta exacta o subruta (p. ej. `/requisitos/12`). */
export function pathMatches(pathname: string, prefix: string): boolean {
  const p = normalizePath(pathname);
  const base = normalizePath(prefix);
  return p === base || p.startsWith(`${base}/`);
}

export function isAdminOnlyPath(pathname: string): boolean {
  return [...ADMIN_ONLY_PATHS].some((prefix) => pathMatches(pathname, prefix));
}

export function isAdminRole(rol: string | undefined): boolean {
  return rol === "administrador";
}

/**
 * Accesos rápidos del dashboard (misma idea que el atajo «Añadir requisito» antes solo admin):
 * administrador, o cualquier rol con la matriz completa activada.
 */
export function canUseDashboardQuickLinks(
  rol: string | undefined,
  permisos?: RolePermisos | null,
): boolean {
  if (isAdminRole(rol)) return true;
  if (!hasPermisos(permisos)) return false;
  return (
    permisos.manageUsers &&
    permisos.createReq &&
    permisos.editReq &&
    permisos.validate &&
    permisos.reports &&
    permisos.settings
  );
}

/**
 * Matriz oficial: `Docs/roles por usuario.png` — Validar requisitos: administrador + stakeholder.
 * Con `permisos` del backend, se usa la bandera `validate`.
 */
export function canValidateRequirements(
  rol: string | undefined,
  permisos?: RolePermisos | null,
): boolean {
  if (hasPermisos(permisos)) return permisos.validate;
  return rol === "administrador" || rol === "stakeholder";
}

/** Crear/editar/eliminar requisitos y proyectos. */
export function canWriteCoreEntities(
  rol: string | undefined,
  permisos?: RolePermisos | null,
): boolean {
  if (hasPermisos(permisos)) return permisos.createReq && permisos.editReq;
  return rol === "administrador" || rol === "analista";
}

/** Ver reportes: por matriz `reports`; sin matriz, roles que históricamente ven reportes. */
export function canViewReports(
  rol: string | undefined,
  permisos?: RolePermisos | null,
): boolean {
  if (hasPermisos(permisos)) return permisos.reports;
  return (
    rol === "administrador" ||
    rol === "analista" ||
    rol === "gerencia" ||
    rol === "consulta"
  );
}

/** Solicitar validación (flujo TI); no confundir con “validar” (aprobar/rechazar). */
export function canSolicitarValidacion(
  rol: string | undefined,
  permisos?: RolePermisos | null,
): boolean {
  if (hasPermisos(permisos)) return permisos.createReq;
  return rol === "administrador" || rol === "analista";
}

/** Bandeja de notificaciones (alineada con `GET /notifications/inbox`). */
export function canViewValidationNotifications(
  rol: string | undefined,
  permisos?: RolePermisos | null,
): boolean {
  if (hasPermisos(permisos)) {
    return permisos.validate || permisos.createReq || permisos.reports;
  }
  return (
    rol === "administrador" ||
    rol === "analista" ||
    rol === "stakeholder" ||
    rol === "gerencia" ||
    rol === "consulta"
  );
}

/** Atajo a configuración en barra superior (antes: solo nombre de rol administrador). */
export function canOpenSettingsShortcut(
  rol: string | undefined,
  permisos?: RolePermisos | null,
): boolean {
  if (hasPermisos(permisos)) return permisos.settings;
  return isAdminRole(rol);
}

/**
 * Acceso a rutas del área autenticada según `Docs/roles por usuario.png`.
 * Si hay `permisos` en sesión, prevalecen sobre el nombre de rol.
 */
export function canAccessPath(
  rol: string | undefined,
  pathname: string,
  permisos?: RolePermisos | null,
): boolean {
  if (!rol) return false;
  const p = normalizePath(pathname);

  // Panel resumen: visible para cualquier rol autenticado (detalle en matriz / otras rutas).
  if (p === "/dashboard" || p.startsWith("/dashboard/")) return true;

  if (hasPermisos(permisos)) {
    if (p === "/usuarios" || p.startsWith("/usuarios/")) return permisos.manageUsers;
    if (
      p === "/configuracion" ||
      p.startsWith("/configuracion/") ||
      p === "/auditoria" ||
      p.startsWith("/auditoria/")
    )
      return permisos.settings;
    if (p === "/validacion" || p.startsWith("/validacion/"))
      return permisos.validate || permisos.createReq;
    if (p === "/reportes" || p.startsWith("/reportes/")) return permisos.reports;
    if (
      p === "/requisitos" ||
      p.startsWith("/requisitos/") ||
      p === "/proyectos" ||
      p.startsWith("/proyectos/") ||
      p === "/priorizacion" ||
      p.startsWith("/priorizacion/")
    )
      return permisos.createReq || permisos.editReq;
    return false;
  }

  if (isAdminRole(rol)) return true;
  if (isAdminOnlyPath(pathname)) return false;

  if (rol === "analista") return true;

  if (rol === "stakeholder") {
    return pathMatches(pathname, "/validacion");
  }

  if (rol === "gerencia" || rol === "consulta") {
    return pathMatches(pathname, "/reportes");
  }

  return false;
}

/** Orden de preferencia para “inicio” (debe coincidir con `canAccessPath` por ruta). */
const LANDING_PATH_CANDIDATES = [
  "/dashboard",
  "/requisitos",
  "/proyectos",
  "/priorizacion",
  "/validacion",
  "/reportes",
  "/auditoria",
  "/usuarios",
  "/configuracion",
] as const;

/**
 * Pantalla inicial tras login según matriz. No usa `/dashboard` como comodín:
 * si el usuario no puede entrar al panel, se elige la primera ruta permitida.
 */
export function getDefaultLandingPath(
  rol: string | undefined,
  permisos?: RolePermisos | null,
): string {
  if (hasPermisos(permisos)) {
    const onlyValidate =
      permisos.validate &&
      !permisos.createReq &&
      !permisos.editReq &&
      !permisos.reports &&
      !permisos.manageUsers &&
      !permisos.settings;
    if (onlyValidate) return "/validacion";
    const onlyReports =
      permisos.reports &&
      !permisos.createReq &&
      !permisos.editReq &&
      !permisos.validate &&
      !permisos.manageUsers &&
      !permisos.settings;
    if (onlyReports) return "/reportes";

    for (const path of LANDING_PATH_CANDIDATES) {
      if (canAccessPath(rol, path, permisos)) return path;
    }
    return "/sin-permiso";
  }
  return "/dashboard";
}

/**
 * Ruta para salir de `/sin-permiso` sin volver a una pantalla que dispare 403 en bucle
 * (p. ej. validación cuando la sesión no coincide con la matriz).
 */
export function getSafeExitPath(
  rol: string | undefined,
  permisos?: RolePermisos | null,
): string {
  if (canAccessPath(rol, "/dashboard", permisos)) return "/dashboard";
  if (canAccessPath(rol, "/reportes", permisos)) return "/reportes";
  if (canAccessPath(rol, "/validacion", permisos)) return "/validacion";
  return "/login";
}

export function filterNavByRole<T extends { href: string }>(
  items: T[],
  rol: string | undefined,
  permisos?: RolePermisos | null,
): T[] {
  return items.filter((item) => canAccessPath(rol, item.href, permisos));
}
