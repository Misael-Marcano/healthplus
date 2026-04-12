"use client";

import Link from "next/link";
import { Menu, ChevronRight, Settings, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canOpenSettingsShortcut } from "@/lib/permissions";
import { useRequirement } from "@/hooks/useRequirements";
import { useLocale } from "@/context/LocaleContext";
import type { MessageKey } from "@/i18n/dictionaries";
import { NotificationBell } from "./NotificationBell";

const pathToKey: Record<string, MessageKey> = {
  "/dashboard": "nav.dashboard",
  "/requisitos": "nav.requirements",
  "/proyectos": "nav.projects",
  "/priorizacion": "nav.prioritization",
  "/validacion": "nav.validation",
  "/reportes": "nav.reports",
  "/auditoria": "nav.audit",
  "/usuarios": "nav.users",
  "/configuracion": "nav.settings",
};

function breadcrumbForPath(
  pathname: string,
  t: (k: MessageKey) => string,
): string {
  const key = pathToKey[pathname];
  return key ? t(key) : t("nav.dashboard");
}

function parseRequisitoDetailId(pathname: string): number | null {
  const m = pathname.match(/^\/requisitos\/(\d+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getInitials(nombre: string) {
  return nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

interface TopbarProps { onMenuClick: () => void }

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLocale();
  const currentPage = breadcrumbForPath(pathname, t);
  const requisitoDetailId = parseRequisitoDetailId(pathname);
  const {
    data: requisitoDetalle,
    isLoading: requisitoDetalleLoading,
    isError: requisitoDetalleError,
  } = useRequirement(requisitoDetailId ?? 0, {
    enabled: requisitoDetailId != null,
  });

  return (
    <header className="sticky top-0 z-10 flex min-h-[72px] h-[72px] items-center justify-between border-b border-[#E5EAF1] bg-white px-4 md:px-6 gap-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" onClick={onMenuClick} className="lg:hidden p-2 rounded-[10px] hover:bg-[#F6F8FB] text-[#7A8798] transition-colors shrink-0" aria-label={t("topbar.openMenu")}>
          <Menu size={20} strokeWidth={1.75} aria-hidden />
        </button>
        <nav
          className="flex items-center gap-1.5 text-sm min-w-0"
          aria-label="Migas de pan"
        >
          <span className="text-[#7A8798] hidden sm:block text-xs font-medium">{t("topbar.system")}</span>
          <ChevronRight size={14} className="text-[#D9E2EC] hidden sm:block shrink-0" />
          {requisitoDetailId != null ? (
            <>
              <Link
                href="/requisitos"
                className="text-xs font-medium text-[#7A8798] hover:text-[#2C5FA3] transition-colors truncate shrink min-w-0 max-w-[min(50%,11rem)]"
              >
                {t("nav.requirements")}
              </Link>
              <ChevronRight size={14} className="text-[#D9E2EC] shrink-0" />
              <span className="font-semibold text-[#4B5563] truncate min-w-0 flex items-center gap-1.5">
                {requisitoDetalleLoading && !requisitoDetalle ? (
                  <>
                    <Loader2 className="animate-spin shrink-0 text-[#2C5FA3]" size={14} aria-hidden />
                    <span className="sr-only">Cargando requisito</span>
                  </>
                ) : requisitoDetalleError || !requisitoDetalle?.codigo ? (
                  <span title="Requisito">Requisito</span>
                ) : (
                  requisitoDetalle.codigo
                )}
              </span>
            </>
          ) : (
            <span className="font-semibold text-[#4B5563] truncate">{currentPage}</span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {canOpenSettingsShortcut(user?.rol, user?.permisos) && (
          <Link
            href="/configuracion"
            className="p-2 rounded-[10px] hover:bg-[#F6F8FB] text-[#7A8798] hover:text-[#2C5FA3] transition-colors"
            title={t("topbar.settings")}
            aria-label={t("topbar.settings")}
          >
            <Settings size={18} strokeWidth={1.75} aria-hidden />
          </Link>
        )}
        <NotificationBell />

        <div className="flex items-center gap-2 bg-[#F6F8FB] border border-[#E5EAF1] rounded-xl px-3 py-1.5 ml-1">
          <div className="w-8 h-8 rounded-full bg-[#2C5FA3] flex items-center justify-center text-white text-[10px] font-semibold">
            {user ? getInitials(user.nombre) : "?"}
          </div>
          <div className="hidden md:block text-left min-w-0">
            <p className="text-xs font-semibold text-[#4B5563] leading-none truncate max-w-[140px]">{user?.nombre ?? t("user.fallback")}</p>
            <p className="text-[10px] text-[#7A8798] mt-0.5 capitalize">{user?.rol ?? ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
