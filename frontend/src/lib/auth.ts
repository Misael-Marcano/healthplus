import type { RolePermisos } from "@/types";
import { mergeRolePermisos } from "@/lib/role-permissions";

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  /** Matriz efectiva del rol (login o GET /auth/me). */
  permisos?: RolePermisos;
}

/** Alinea la matriz con los defaults del rol (evita objetos incompletos tras login o caché). */
export function normalizeSessionUser(u: AuthUser): AuthUser {
  return {
    ...u,
    permisos: mergeRolePermisos(u.rol, u.permisos ?? null),
  };
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return normalizeSessionUser(JSON.parse(raw) as AuthUser);
  } catch {
    return null;
  }
}

const AUTH_COOKIE = "hp_authenticated";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

export function saveSession(data: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}): AuthUser {
  const user = normalizeSessionUser(data.user);
  localStorage.setItem("access_token", data.accessToken);
  localStorage.setItem("refresh_token", data.refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
  setSessionCookie();
  return user;
}

export function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  clearSessionCookie();
}
