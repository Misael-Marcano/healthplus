import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin permiso",
  robots: { index: false, follow: false },
};

export default function SinPermisoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
