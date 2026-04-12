import type { Metadata } from "next";
import { DashboardLayoutClient } from "./DashboardLayoutClient";

export const metadata: Metadata = {
  title: "Área de trabajo",
  description: "Panel de gestión de requisitos y proyectos — HealthPlus",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
