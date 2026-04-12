"use client";

import { useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-[#E5EAF1] bg-white px-6 py-12 text-center shadow-sm"
    >
      <div className="mb-5 w-11 h-11 rounded-xl bg-[#F6F8FB] border border-[#E5EAF1] flex items-center justify-center p-0.5">
        <BrandLogo variant="mark" className="h-9 w-9" />
      </div>
      <h1 className="text-xl font-semibold text-[#4B5563]">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-sm text-[#7A8798]">
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-11 rounded-[10px] bg-[#2C5FA3] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#244F88]"
        >
          Reintentar
        </button>
        <a
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-[#D9E2EC] bg-white px-5 text-sm font-medium text-[#4E6A8F] hover:bg-[#F6F8FB]"
        >
          Ir al inicio de sesión
        </a>
      </div>
    </div>
  );
}
