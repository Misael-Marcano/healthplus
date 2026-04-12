"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Search, X, Loader2, User } from "lucide-react";
import { useAuditLog } from "@/hooks/useAudit";
import { RequirePathAccess } from "@/components/auth/RequireRole";

const ACCION_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "default" | "gray" | "danger" | "purple" }> = {
  CREAR_REQUISITO:   { label: "Creación",       variant: "success" },
  CAMBIO_ESTADO:     { label: "Cambio estado",  variant: "warning" },
  ELIMINAR_REQUISITO:{ label: "Eliminación",    variant: "danger"  },
  CREAR_VERSION:     { label: "Nueva versión",  variant: "default" },
  VALIDAR:           { label: "Validación",     variant: "purple"  },
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-DO", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  } catch { return iso; }
}

const ITEMS = 15;

function AuditoriaPageContent() {
  const { data: logs = [], isLoading } = useAuditLog();
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  const filtrados = logs.filter(l => {
    const q = search.toLowerCase();
    return (
      l.detalle.toLowerCase().includes(q) ||
      l.accion.toLowerCase().includes(q) ||
      (l.user?.nombre ?? "").toLowerCase().includes(q) ||
      l.entidad.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtrados.length / ITEMS));
  const paginados  = filtrados.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Auditoría</h1>
          <p className="text-sm text-gray-400">Historial de acciones realizadas en el sistema</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por acción, usuario, entidad o detalle..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X size={14} />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <ClipboardList size={16} className="text-blue-600" /> Registro de actividad
          </h2>
          <span className="text-xs text-gray-400">{filtrados.length} eventos</span>
        </CardHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : paginados.length === 0 ? (
          <CardContent className="py-10 text-center text-sm text-gray-400">
            No hay eventos de auditoría registrados.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <caption className="sr-only">Registro de actividad y auditoría</caption>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acción</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Detalle</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Entidad</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginados.map(log => {
                  const cfg = ACCION_CONFIG[log.accion];
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(log.creadoEn)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg?.variant ?? "gray"}>{cfg?.label ?? log.accion}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] truncate">{log.detalle}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 capitalize hidden sm:table-cell">{log.entidad} #{log.entidadId}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {log.user ? (
                          <span className="flex items-center gap-1.5 text-xs text-gray-600">
                            <User size={12} className="text-gray-400" />{log.user.nombre}
                          </span>
                        ) : <span className="text-xs text-gray-300">Sistema</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">Siguiente</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AuditoriaPage() {
  return (
    <RequirePathAccess pathname="/auditoria">
      <AuditoriaPageContent />
    </RequirePathAccess>
  );
}
