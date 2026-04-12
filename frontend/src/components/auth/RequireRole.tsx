"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canAccessPath } from "@/lib/permissions";
import type { UserRole } from "@/types";

/** Solo nombres de rol (casos legacy). Preferir `RequirePathAccess` si usas matriz por rol. */
export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!roles.includes(user.rol as UserRole)) {
      router.replace("/sin-permiso");
    }
  }, [user, isLoading, roles, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!roles.includes(user.rol as UserRole)) return null;

  return <>{children}</>;
}

/** Acceso según `canAccessPath` (matriz `user.permisos` + rol). */
export function RequirePathAccess({
  pathname,
  children,
}: {
  pathname: string;
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccessPath(user.rol, pathname, user.permisos)) {
      router.replace("/sin-permiso");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!canAccessPath(user.rol, pathname, user.permisos)) return null;

  return <>{children}</>;
}
