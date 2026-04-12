"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { getDefaultLandingPath, getSafeExitPath } from "@/lib/permissions";

export default function SinPermisoPage() {
  const { user, logout } = useAuth();
  const homeHref = getDefaultLandingPath(user?.rol, user?.permisos ?? null);
  const safeHref = getSafeExitPath(user?.rol, user?.permisos ?? null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EEF1F6] p-6">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-white border border-[#E5EAF1] shadow-sm flex items-center justify-center p-0.5">
          <BrandLogo variant="mark" className="h-9 w-9" />
        </div>
        <span className="text-sm font-semibold text-[#4B5563]">HealthPlus</span>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-[#E5EAF1] bg-white px-8 py-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Sin permiso</h1>
        <p className="mt-2 text-sm text-gray-500">
          No tienes autorización para acceder a este recurso. Si crees que es un error, contacta al
          administrador.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={safeHref}
            className="inline-flex items-center justify-center rounded-[10px] bg-[#2C5FA3] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#244F88]"
          >
            Ir al panel
          </Link>
          <Link
            href={homeHref}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm font-semibold text-[#4E6A8F] transition-colors hover:bg-[#F3F6FA]"
          >
            Ir a mi inicio
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center justify-center rounded-[10px] border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm font-semibold text-[#4E6A8F] transition-colors hover:bg-[#F3F6FA]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
