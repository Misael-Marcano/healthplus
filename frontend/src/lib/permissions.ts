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
 * Matriz oficial: `Docs/roles por usuario.png` — Validar requisitos: administrador + stakeholder.
 */
export function canValidateRequirements(rol: string | undefined): boolean {
  return rol === "administrador" || rol === "stakeholder";
}

/** Crear/editar/eliminar requisitos y proyectos. */
export function canWriteCoreEntities(rol: string | undefined): boolean {
  return rol === "administrador" || rol === "analista";
}

/** Ver reportes: admin, analista, gerencia, consulta (no stakeholder en matriz). */
export function canViewReports(rol: string | undefined): boolean {
  return (
    rol === "administrador" ||
    rol === "analista" ||
    rol === "gerencia" ||
    rol === "consulta"
  );
}

/** Solicitar validación (flujo TI); no confundir con “validar” (aprobar/rechazar). */
export function canSolicitarValidacion(rol: string | undefined): boolean {
  return rol === "administrador" || rol === "analista";
}

/** Pantalla inicial tras login según rol (matriz de permisos). */
export function getDefaultLandingPath(rol: string | undefined): string {
  switch (rol) {
    case "stakeholder":
      return "/validacion";
    case "gerencia":
    case "consulta":
      return "/reportes";
    default:
      return "/dashboard";
  }
}

/**
 * Acceso a rutas del área autenticada según `Docs/roles por usuario.png`.
 * Administrador: todo. Analista: todo salvo rutas solo admin. Stakeholder: solo validación.
 * Gerencia / consulta: solo reportes.
 */
export function canAccessPath(rol: string | undefined, pathname: string): boolean {
  if (!rol) return false;
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

export function filterNavByRole<T extends { href: string }>(
  items: T[],
  rol: string | undefined,
): T[] {
  return items.filter((item) => canAccessPath(rol, item.href));
}
