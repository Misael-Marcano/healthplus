export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
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

export function saveSession(data: { accessToken: string; refreshToken: string; user: AuthUser }) {
  localStorage.setItem("access_token", data.accessToken);
  localStorage.setItem("refresh_token", data.refreshToken);
  localStorage.setItem("user", JSON.stringify(data.user));
  setSessionCookie();
}

export function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  clearSessionCookie();
}
