import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "HealthPlus – Sistema de Gestión de Requisitos",
    template: "%s | HealthPlus",
  },
  description: "Sistema de Gestión de Requisitos para HealthPlus Clínica Integral",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#EEF1F6]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
