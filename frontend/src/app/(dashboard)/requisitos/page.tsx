"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, Trash2, X, FileText, ChevronLeft, ChevronRight, Loader2, Paperclip } from "lucide-react";
import { useRequirements, useDeleteRequirement } from "@/hooks/useRequirements";
import { useRequirementStatuses } from "@/hooks/useRequirementStatuses";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/context/AuthContext";
import { canWriteCoreEntities } from "@/lib/permissions";
import type { EstadoRequisito, PrioridadRequisito } from "@/types";
import {
  ESTADO_VARIANTS,
  displayEstado,
  prioridadConfig,
} from "@/lib/requisitos-display";
import { RequisitoFormModal } from "@/components/requisitos/RequisitoFormModal";

const ITEMS_PER_PAGE = 8;

function RequisitosPageContent() {
  const [search, setSearch] = useState("");
  const [filtroProyecto, setFiltroProyecto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoRequisito | "">("");
  const [filtroPrioridad, setFiltroPrioridad] = useState<PrioridadRequisito | "">("");
  const [filtroTipo, setFiltroTipo] = useState<"" | "funcional" | "no_funcional">("");
  const [page, setPage] = useState(1);
  const [modalForm, setModalForm] = useState(false);

  const { user } = useAuth();
  const canWrite = canWriteCoreEntities(user?.rol, user?.permisos);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Sincroniza filtro de proyecto con `?proyecto=` o `?projectId=` (p. ej. desde la lista de proyectos). */
  useEffect(() => {
    const raw = searchParams.get("proyecto") ?? searchParams.get("projectId");
    if (raw && /^\d+$/.test(raw)) {
      setFiltroProyecto(raw);
      setPage(1);
    }
  }, [searchParams]);

  const applyFiltroProyecto = (value: string) => {
    setFiltroProyecto(value);
    setFiltroEstado("");
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("proyecto", value);
    else params.delete("proyecto");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const { data: requisitos = [], isLoading } = useRequirements({
    projectId: filtroProyecto ? Number(filtroProyecto) : undefined,
    estado: filtroEstado || undefined,
    prioridad: filtroPrioridad || undefined,
    tipo: filtroTipo || undefined,
  });
  const { data: proyectos = [] } = useProjects();
  const { data: statusesFiltro = [] } = useRequirementStatuses(
    filtroProyecto ? Number(filtroProyecto) : undefined,
  );
  const opcionesEstadoFiltro = useMemo(() => {
    const map = new Map<string, string>();
    for (const slug of Object.keys(ESTADO_VARIANTS)) {
      const cfg = ESTADO_VARIANTS[slug];
      if (cfg) map.set(slug, cfg.label);
    }
    for (const s of statusesFiltro) {
      map.set(s.slug, s.nombre);
    }
    for (const r of requisitos) {
      if (r.estado && !map.has(r.estado)) {
        map.set(r.estado, displayEstado(r).label);
      }
    }
    return [...map.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], "es", { sensitivity: "base" }),
    );
  }, [statusesFiltro, requisitos]);
  const deleteMutation = useDeleteRequirement();

  const filtrados = requisitos.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.titulo.toLowerCase().includes(q) ||
      r.codigo.toLowerCase().includes(q) ||
      r.proyectoNombre?.toLowerCase().includes(q) ||
      (r.solicitante && r.solicitante.toLowerCase().includes(q)) ||
      (r.responsable && r.responsable.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  const paginados = filtrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const hayFiltros = search || filtroProyecto || filtroEstado || filtroPrioridad || filtroTipo;
  const proyectoActivo = useMemo(
    () => proyectos.find((x) => String(x.id) === filtroProyecto),
    [proyectos, filtroProyecto],
  );

  const openCreate = () => setModalForm(true);

  const handleDelete = async (id: number) => {
    if (confirm("¿Eliminar este requisito?")) deleteMutation.mutate(id);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Requisitos</h1>
            {proyectoActivo ? (
              <p className="text-sm text-[#2C5FA3] font-medium mt-0.5">
                Filtrado por proyecto: {proyectoActivo.nombre}
              </p>
            ) : null}
            <p className="text-sm text-gray-400">{filtrados.length} requisito(s) encontrado(s)</p>
          </div>
          {canWrite && (
            <Button onClick={openCreate} className="w-full sm:w-auto">
              <Plus size={15} /> Nuevo Requisito
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por código, título, proyecto, solicitante…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <select
                  value={filtroProyecto}
                  onChange={(e) => applyFiltroProyecto(e.target.value)}
                  className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[150px] transition-colors"
                >
                  <option value="">Todos los proyectos</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value as EstadoRequisito | "");
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[160px] transition-colors"
                >
                  <option value="">Estado</option>
                  {opcionesEstadoFiltro.map(([slug, label]) => (
                    <option key={slug} value={slug}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroPrioridad}
                  onChange={(e) => {
                    setFiltroPrioridad(e.target.value as PrioridadRequisito | "");
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[130px] transition-colors"
                >
                  <option value="">Prioridad</option>
                  {(
                    [
                      ["critica", "Crítica"],
                      ["alta", "Alta"],
                      ["media", "Media"],
                      ["baja", "Baja"],
                    ] as const
                  ).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroTipo}
                  onChange={(e) => {
                    setFiltroTipo(e.target.value as "" | "funcional" | "no_funcional");
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[130px] transition-colors"
                >
                  <option value="">Tipo</option>
                  <option value="funcional">Funcional</option>
                  <option value="no_funcional">No Funcional</option>
                </select>
                {hayFiltros && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setFiltroProyecto("");
                      setFiltroEstado("");
                      setFiltroPrioridad("");
                      setFiltroTipo("");
                      setPage(1);
                      router.replace(pathname, { scroll: false });
                    }}
                    className="h-9 flex items-center gap-1.5 px-3 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-500 hover:bg-red-100 transition-colors whitespace-nowrap"
                  >
                    <X size={12} /> Limpiar
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <caption className="sr-only">
                Listado de requisitos; pulse una fila o use Entrar para abrir el detalle
              </caption>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Código
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Título / Tipo
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Proyecto
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Solicitante
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                    Prioridad
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell w-[72px]">
                    <span className="sr-only">Adjuntos</span>
                    <Paperclip className="inline size-3.5 text-gray-400" aria-hidden />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">
                    Responsable
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <Loader2 size={24} className="mx-auto text-blue-400 animate-spin" />
                    </td>
                  </tr>
                ) : paginados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <FileText size={32} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">No se encontraron requisitos</p>
                    </td>
                  </tr>
                ) : (
                  paginados.map((req) => (
                    <tr
                      key={req.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/requisitos/${req.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/requisitos/${req.id}`);
                        }
                      }}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                          {req.codigo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{req.titulo}</p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">
                          {req.tipo === "no_funcional" ? "No funcional" : "Funcional"}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-600 max-w-[160px] truncate">{req.proyectoNombre}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-800 shrink-0">
                            {req.solicitante?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "–"}
                          </div>
                          <span className="text-sm text-gray-600 truncate max-w-[120px]" title={req.solicitante || undefined}>
                            {req.solicitante ?? "–"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={prioridadConfig[req.prioridad]?.variant ?? "gray"}>
                          {prioridadConfig[req.prioridad]?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-center">
                        <span
                          className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            (req.adjuntosCount ?? 0) > 0
                              ? "bg-slate-100 text-slate-700"
                              : "text-gray-300"
                          }`}
                          title={
                            (req.adjuntosCount ?? 0) > 0
                              ? `${req.adjuntosCount} adjunto(s)`
                              : "Sin adjuntos"
                          }
                        >
                          {req.adjuntosCount ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={displayEstado(req).variant}>{displayEstado(req).label}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                            {req.responsable?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "–"}
                          </div>
                          <span className="text-sm text-gray-600 truncate max-w-[100px]">{req.responsable ?? "–"}</span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Abrir detalle"
                            aria-label={`Abrir detalle del requisito ${req.codigo}`}
                            onClick={() => router.push(`/requisitos/${req.id}`)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Eye size={14} aria-hidden />
                          </button>
                          {canWrite && (
                            <button
                              type="button"
                              title="Eliminar"
                              aria-label={`Eliminar requisito ${req.codigo}`}
                              onClick={() => handleDelete(req.id)}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Página {page} de {totalPages} · {filtrados.length} resultados
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Ir a la página anterior"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Ir a la página siguiente"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} aria-hidden />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <RequisitoFormModal
        open={modalForm}
        onClose={() => setModalForm(false)}
        mode="create"
        requirement={null}
      />
    </>
  );
}

export default function RequisitosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      }
    >
      <RequisitosPageContent />
    </Suspense>
  );
}
