"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function SinPermisoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Sin permiso</h1>
        <p className="mt-2 text-sm text-gray-500">
          No tienes autorización para acceder a este recurso. Si crees que es un error, contacta al
          administrador.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
