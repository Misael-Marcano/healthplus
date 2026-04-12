import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#EEF1F6] px-6 py-12">
      <p className="text-sm font-medium text-[#7A8798]">404</p>
      <h1 className="mt-1 text-2xl font-semibold text-[#4B5563]">Página no encontrada</h1>
      <p className="mt-2 text-center text-sm text-[#7A8798] max-w-md">
        La ruta solicitada no existe o fue movida. Comprueba la URL o vuelve al inicio de sesión.
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#2C5FA3] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#244F88]"
      >
        Ir al inicio de sesión
      </Link>
    </div>
  );
}
