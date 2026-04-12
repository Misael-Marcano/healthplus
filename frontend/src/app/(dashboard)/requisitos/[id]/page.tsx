"use client";

import { useParams } from "next/navigation";
import { RequisitoDetalleView } from "@/components/requisitos/RequisitoDetalleView";
import Link from "next/link";

export default function RequisitoDetallePage() {
  const params = useParams();
  const raw = params?.id;
  const id = typeof raw === "string" ? Number(raw) : Number(Array.isArray(raw) ? raw[0] : raw);

  if (!id || Number.isNaN(id)) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <p className="text-gray-600 mb-4">Identificador de requisito no válido.</p>
        <Link
          href="/requisitos"
          className="text-blue-600 font-medium hover:underline"
        >
          Volver a requisitos
        </Link>
      </div>
    );
  }

  return <RequisitoDetalleView requirementId={id} />;
}
