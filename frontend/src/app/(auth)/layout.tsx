import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso",
  description: "Inicio de sesión y recuperación de cuenta — HealthPlus",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
