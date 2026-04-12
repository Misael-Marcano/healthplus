import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} min-h-full flex flex-col bg-[#EEF1F6]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
