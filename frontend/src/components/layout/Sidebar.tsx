"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { filterNavByRole } from "@/lib/permissions";
import { useLocale } from "@/context/LocaleContext";
import type { MessageKey } from "@/i18n/dictionaries";
import {
  LayoutDashboard, FileText, ArrowUpDown, CheckCircle,
  BarChart3, Settings, Users, FolderKanban, X, LogOut, ClipboardList,
} from "lucide-react";

const navItems: { href: string; labelKey: MessageKey; icon: typeof LayoutDashboard }[] = [
  { href: "/dashboard",     labelKey: "nav.dashboard",     icon: LayoutDashboard },
  { href: "/requisitos",    labelKey: "nav.requirements", icon: FileText        },
  { href: "/proyectos",     labelKey: "nav.projects",     icon: FolderKanban    },
  { href: "/priorizacion",  labelKey: "nav.prioritization", icon: ArrowUpDown   },
  { href: "/validacion",    labelKey: "nav.validation",   icon: CheckCircle     },
  { href: "/reportes",      labelKey: "nav.reports",       icon: BarChart3       },
  { href: "/auditoria",     labelKey: "nav.audit",         icon: ClipboardList   },
  { href: "/usuarios",      labelKey: "nav.users",         icon: Users           },
  { href: "/configuracion", labelKey: "nav.settings",    icon: Settings        },
];

function getInitials(nombre: string) {
  return nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

interface SidebarProps { open: boolean; onClose: () => void }

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const visibleNav = filterNavByRole(navItems, user?.rol);

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={onClose} />}

      <aside className={cn(
        "fixed top-0 left-0 z-30 flex h-full w-[240px] flex-col bg-[#EAF2F8] transition-transform duration-200 ease-out",
        "lg:translate-x-0 lg:static lg:z-auto lg:m-3 lg:h-[calc(100vh-1.5rem)] lg:rounded-2xl lg:border lg:border-[#E5EAF1] lg:shadow-sm",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-[#D9E2EC]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#2C5FA3] rounded-xl flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14a1 1 0 01-1-1v-3H8a1 1 0 010-2h3V8a1 1 0 012 0v3h3a1 1 0 010 2h-3v3a1 1 0 01-1 1z" />
              </svg>
            </div>
            <div className="leading-none">
              <p className="text-sm font-semibold text-[#4B5563]">HealthPlus</p>
              <p className="text-[10px] text-[#7A8798] mt-0.5">{t("brand.subtitle")}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-white/60 text-[#7A8798]">
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          <ul className="space-y-1">
            {visibleNav.map(({ href, labelKey, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[10px] px-3 min-h-[44px] text-sm font-medium transition-colors duration-200",
                      active
                        ? "bg-[#2C5FA3] text-white shadow-sm"
                        : "text-[#4E6A8F] hover:bg-white/70 hover:text-[#2C5FA3]",
                    )}
                  >
                    <Icon size={18} strokeWidth={1.75} className={active ? "text-white" : "text-[#4E6A8F]"} />
                    {t(labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-[#D9E2EC]/80 p-3 mt-auto">
          <div className="flex items-center gap-3 rounded-[10px] px-2 py-2 bg-white/50">
            <div className="w-8 h-8 rounded-full bg-[#2C5FA3] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {user ? getInitials(user.nombre) : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#4B5563] truncate leading-none">{user?.nombre ?? t("user.fallback")}</p>
              <p className="text-xs text-[#7A8798] mt-0.5 capitalize">{user?.rol ?? ""}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="text-[#7A8798] hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50/80"
              title={t("auth.logout")}
              aria-label={t("auth.logout")}
            >
              <LogOut size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
