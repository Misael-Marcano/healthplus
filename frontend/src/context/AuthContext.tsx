"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getDefaultLandingPath } from "@/lib/permissions";
import { getUser, saveSession, clearSession, setSessionCookie, type AuthUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  /** Recarga usuario y permisos desde GET /auth/me (p. ej. tras editar matriz de roles). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return;
    try {
      const { data } = await api.get<AuthUser>("/auth/me");
      const refresh = localStorage.getItem("refresh_token") ?? "";
      const user = saveSession({ accessToken: token, refreshToken: refresh, user: data });
      setUser(user);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const u = getUser();
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (token && u) {
        try {
          const { data } = await api.get<AuthUser>("/auth/me");
          if (!cancelled) {
            const user = saveSession({
              accessToken: token,
              refreshToken: localStorage.getItem("refresh_token") ?? "",
              user: data,
            });
            setUser(user);
          }
        } catch {
          if (!cancelled) {
            setUser(u);
            setSessionCookie();
          }
        }
      } else {
        if (!cancelled) {
          setUser(u);
          if (u) setSessionCookie();
        }
      }
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, remember?: boolean) => {
    const { data } = await api.post("/auth/login", { email, password, remember });
    const user = saveSession(data);
    setUser(user);
    router.push(getDefaultLandingPath(user.rol, user.permisos));
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
