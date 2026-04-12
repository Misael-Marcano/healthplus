"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { LocaleProvider, useLocale } from "@/context/LocaleContext";
import { useAuth } from "@/context/AuthContext";
import { canAccessPath, getDefaultLandingPath } from "@/lib/permissions";

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (isLoading || !user || !pathname) return;
    if (!canAccessPath(user.rol, pathname)) {
      router.replace(getDefaultLandingPath(user.rol));
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return <DashboardLoadingShell />;
  }

  if (!user) return null;

  return (
    <LocaleProvider>
      <DashboardChrome sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
        {children}
      </DashboardChrome>
    </LocaleProvider>
  );
}

function DashboardLoadingShell() {
  const { t } = useLocale();
  return (
    <div className="flex h-screen items-center justify-center bg-[#EEF1F6]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#2C5FA3] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#7A8798]">{t("loading")}</p>
      </div>
    </div>
  );
}

function DashboardChrome({
  children,
  sidebarOpen,
  setSidebarOpen,
}: {
  children: ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="flex h-screen bg-[#EEF1F6] overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[10px] focus:bg-[#2C5FA3] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-[#619CD0]"
      >
        {t("skipToContent")}
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" className="flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
