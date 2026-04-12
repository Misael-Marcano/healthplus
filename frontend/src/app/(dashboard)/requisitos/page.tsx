"use client";

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Pencil, Trash2, X, FileText, ChevronLeft, ChevronRight, Loader2, Paperclip } from "lucide-react";
import { useRequirements, useCreateRequirement, useUpdateRequirement, useDeleteRequirement, useRequirement } from "@/hooks/useRequirements";
import { useRequirementStatuses } from "@/hooks/useRequirementStatuses";
import { useRequirementCategories } from "@/hooks/useRequirementCategories";
import { useProjects } from "@/hooks/useProjects";
import { useUserLookup } from "@/hooks/useUsers";
import { useAuth } from "@/context/AuthContext";
import { canWriteCoreEntities } from "@/lib/permissions";
import { useRequirementVersions } from "@/hooks/useVersions";
import {
  useUploadRequirementAttachment,
  useDeleteRequirementAttachment,
  downloadRequirementAttachment,
} from "@/hooks/useRequirementAttachments";
import type { EstadoRequisito, PrioridadRequisito, Requisito } from "@/types";
import {
  ESTADO_VARIANTS,
  displayEstado,
  prioridadConfig,
  formatBytes,
} from "@/lib/requisitos-display";

const reqSchema = z.object({
  titulo:               z.string().min(3, "Mínimo 3 caracteres"),
  descripcion:          z.string().min(10, "Mínimo 10 caracteres"),
  projectId:            z.string().min(1, "Selecciona un proyecto"),
  tipo:                 z.enum(["funcional", "no_funcional"]),
  categoryDefId:        z.string().optional(),
  prioridad:            z.enum(["critica", "alta", "media", "baja"]),
  statusDefId:          z.string().min(1, "Selecciona un estado"),
  criteriosAceptacion:  z.string().optional(),
  solicitanteId:        z.string().optional(),
  responsableId:        z.string().optional(),
});
type ReqForm = z.infer<typeof reqSchema>;

const ITEMS_PER_PAGE = 8;

function RequisitosPageContent() {
  const [search, setSearch]               = useState("");
  const [filtroProyecto, setFiltroProyecto] = useState("");
  const [filtroEstado, setFiltroEstado]   = useState<EstadoRequisito | "">("");
  const [filtroPrioridad, setFiltroPrioridad] = useState<PrioridadRequisito | "">("");
  const [filtroTipo, setFiltroTipo]       = useState<"" | "funcional" | "no_funcional">("");
  const [page, setPage]                   = useState(1);
  const [modalForm, setModalForm]         = useState(false);
  const [editando, setEditando]           = useState<Requisito | null>(null);
  const [archivosPendientes, setArchivosPendientes] = useState<File[]>([]);

  const { user } = useAuth();
  const canWrite = canWriteCoreEntities(user?.rol);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const editId = editParam ? Number(editParam) : 0;
  const { data: reqForEdit } = useRequirement(editId, {
    enabled: !!editId && !Number.isNaN(editId),
  });
  const editHandledRef = useRef(false);

  const { data: requisitos = [], isLoading } = useRequirements({
    projectId: filtroProyecto ? Number(filtroProyecto) : undefined,
    estado: filtroEstado || undefined,
    prioridad: filtroPrioridad || undefined,
    tipo: filtroTipo || undefined,
  });
  const { data: proyectos = [] }             = useProjects();
  const { data: usuarios  = [] }             = useUserLookup();
  const { data: statusesFiltro = [] }        = useRequirementStatuses(
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
  const createMutation  = useCreateRequirement();
  const updateMutation  = useUpdateRequirement();
  const deleteMutation  = useDeleteRequirement();
  const uploadAttachmentMutation = useUploadRequirementAttachment();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<ReqForm>({
    resolver: zodResolver(reqSchema),
    defaultValues: { tipo: "funcional", prioridad: "media", statusDefId: "", categoryDefId: "" },
  });

  const watchProjectId = watch("projectId");
  const { data: statusesForm = [], isLoading: loadingStatusesForm } = useRequirementStatuses(
    watchProjectId ? Number(watchProjectId) : undefined,
  );
  const { data: categoriesForm = [], isLoading: loadingCategoriesForm } = useRequirementCategories(
    watchProjectId ? Number(watchProjectId) : undefined,
  );

  useEffect(() => {
    if (!modalForm || editando || !watchProjectId || loadingStatusesForm) return;
    if (statusesForm.length === 0) return;
    const current = watch("statusDefId");
    if (current && statusesForm.some((s) => String(s.id) === current)) return;
    const borrador = statusesForm.find((s) => s.slug === "borrador") ?? statusesForm[0];
    setValue("statusDefId", String(borrador.id));
  }, [modalForm, editando, watchProjectId, statusesForm, loadingStatusesForm, setValue, watch]);

  useEffect(() => {
    if (!modalForm || !editando || !watchProjectId || loadingStatusesForm) return;
    if (statusesForm.length === 0) return;
    const cur = watch("statusDefId");
    if (cur) return;
    const match = statusesForm.find((s) => s.slug === editando.estado);
    if (match) setValue("statusDefId", String(match.id));
  }, [modalForm, editando, watchProjectId, statusesForm, loadingStatusesForm, setValue, watch, editando]);

  useEffect(() => {
    if (!modalForm || !editando || !watchProjectId || loadingCategoriesForm) return;
    if (categoriesForm.length === 0) return;
    const cur = watch("categoryDefId");
    if (cur) return;
    const slug = editando.categoria?.trim();
    if (!slug) return;
    const match = categoriesForm.find((c) => c.slug === slug);
    if (match) setValue("categoryDefId", String(match.id));
  }, [modalForm, editando, watchProjectId, categoriesForm, loadingCategoriesForm, setValue, watch, editando]);

  const filtrados = requisitos.filter((r) => {
    const q = search.toLowerCase();
    return r.titulo.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q) || r.proyectoNombre?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  const paginados  = filtrados.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const hayFiltros = search || filtroProyecto || filtroEstado || filtroPrioridad || filtroTipo;

  const openCreate = () => {
    setEditando(null);
    setArchivosPendientes([]);
    reset({ tipo: "funcional", prioridad: "media", statusDefId: "", categoryDefId: "", projectId: "" });
    setModalForm(true);
  };
  const openEdit = useCallback(
    (r: Requisito) => {
      setEditando(r);
      setArchivosPendientes([]);
      const solicitanteUser = usuarios.find((u) => u.nombre === r.solicitante);
      const responsableUser = usuarios.find((u) => u.nombre === r.responsable);
      reset({
        titulo: r.titulo,
        descripcion: r.descripcion,
        projectId: String(r.proyectoId ?? ""),
        tipo: r.tipo,
        categoryDefId:
          r.categoryDefId != null
            ? String(r.categoryDefId)
            : "",
        prioridad: r.prioridad,
        statusDefId: r.statusDefId != null ? String(r.statusDefId) : "",
        criteriosAceptacion: r.criteriosAceptacion ?? "",
        solicitanteId: solicitanteUser ? String(solicitanteUser.id) : "",
        responsableId: responsableUser ? String(responsableUser.id) : "",
      });
      setModalForm(true);
    },
    [usuarios, reset],
  );

  useEffect(() => {
    if (!editId || !reqForEdit || editHandledRef.current) return;
    editHandledRef.current = true;
    openEdit(reqForEdit);
    router.replace("/requisitos", { scroll: false });
  }, [editId, reqForEdit, openEdit, router]);

  useEffect(() => {
    if (!editParam) editHandledRef.current = false;
  }, [editParam]);

  const onSubmit = async (data: ReqForm) => {
    const payload = {
      titulo:               data.titulo,
      descripcion:          data.descripcion,
      projectId:            Number(data.projectId),
      tipo:                 data.tipo,
      categoryDefId:        Number(data.categoryDefId) || 0,
      prioridad:            data.prioridad,
      statusDefId:          Number(data.statusDefId),
      criteriosAceptacion:  data.criteriosAceptacion || undefined,
      solicitanteId:        data.solicitanteId ? Number(data.solicitanteId) : undefined,
      responsableId:        data.responsableId ? Number(data.responsableId) : undefined,
    };
    try {
      let requirementId: number;
      if (editando) {
        await updateMutation.mutateAsync({ id: editando.id, ...payload });
        requirementId = editando.id;
      } else {
        const created = await createMutation.mutateAsync(payload);
        requirementId = (created as { id: number }).id;
      }
      if (archivosPendientes.length > 0 && requirementId) {
        for (const file of archivosPendientes) {
          await uploadAttachmentMutation.mutateAsync({ requirementId, file });
        }
      }
      setModalForm(false);
      setArchivosPendientes([]);
      reset();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "No se pudo guardar el requisito o los adjuntos.");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Eliminar este requisito?")) deleteMutation.mutate(id);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Requisitos</h1>
            <p className="text-sm text-gray-400">{filtrados.length} requisito(s) encontrado(s)</p>
          </div>
          {canWrite && (
            <Button onClick={openCreate} className="w-full sm:w-auto"><Plus size={15} /> Nuevo Requisito</Button>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" placeholder="Buscar por código, título o proyecto..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
                {search && <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"><X size={14} /></button>}
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <select
                  value={filtroProyecto}
                  onChange={(e) => {
                    setFiltroProyecto(e.target.value);
                    setFiltroEstado("");
                    setPage(1);
                  }}
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
                  onChange={(e) => { setFiltroPrioridad(e.target.value as PrioridadRequisito | ""); setPage(1); }}
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
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <select
                  value={filtroTipo}
                  onChange={(e) => { setFiltroTipo(e.target.value as "" | "funcional" | "no_funcional"); setPage(1); }}
                  className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[130px] transition-colors"
                >
                  <option value="">Tipo</option>
                  <option value="funcional">Funcional</option>
                  <option value="no_funcional">No Funcional</option>
                </select>
                {hayFiltros && (
                  <button onClick={() => { setSearch(""); setFiltroProyecto(""); setFiltroEstado(""); setFiltroPrioridad(""); setFiltroTipo(""); setPage(1); }}
                    className="h-9 flex items-center gap-1.5 px-3 rounded-lg border border-red-200 bg-red-50 text-xs font-medium text-red-500 hover:bg-red-100 transition-colors whitespace-nowrap">
                    <X size={12} /> Limpiar
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {["Código","Título / Tipo","Proyecto","Prioridad","Estado","Responsable","Acciones"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 2 ? "hidden md:table-cell" : i === 3 ? "hidden sm:table-cell" : i === 5 ? "hidden lg:table-cell" : ""} ${i === 6 ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-12 text-center"><Loader2 size={24} className="mx-auto text-blue-400 animate-spin" /></td></tr>
                ) : paginados.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center"><FileText size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-sm text-gray-400">No se encontraron requisitos</p></td></tr>
                ) : paginados.map((req) => (
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
                    <td className="px-4 py-3"><span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{req.codigo}</span></td>
                    <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{req.titulo}</p><p className="text-xs text-gray-400 mt-0.5 capitalize">{req.tipo === "no_funcional" ? "No funcional" : "Funcional"}</p></td>
                    <td className="px-4 py-3 hidden md:table-cell"><p className="text-sm text-gray-600 max-w-[160px] truncate">{req.proyectoNombre}</p></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><Badge variant={prioridadConfig[req.prioridad]?.variant ?? "gray"}>{prioridadConfig[req.prioridad]?.label}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge variant={displayEstado(req).variant}>{displayEstado(req).label}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                          {req.responsable?.split(" ").map((n: string) => n[0]).join("").slice(0,2) ?? "–"}
                        </div>
                        <span className="text-sm text-gray-600 truncate max-w-[100px]">{req.responsable ?? "–"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Abrir detalle"
                          onClick={() => router.push(`/requisitos/${req.id}`)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        {canWrite && (
                          <>
                            <button type="button" onClick={() => openEdit(req)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors"><Pencil size={14} /></button>
                            <button type="button" onClick={() => handleDelete(req.id)} disabled={deleteMutation.isPending} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Página {page} de {totalPages} · {filtrados.length} resultados</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-40 transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Crear / Editar */}
      <Modal open={modalForm} onClose={() => { setModalForm(false); setArchivosPendientes([]); }} title={editando ? `Editar ${editando.codigo}` : "Nuevo Requisito"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Input label="Título *" id="titulo" error={errors.titulo?.message} {...register("titulo")} /></div>
            <Select label="Proyecto *" id="projectId" error={errors.projectId?.message} placeholder="Seleccionar proyecto"
              options={proyectos.map(p => ({ value: String(p.id), label: p.nombre }))} {...register("projectId")} />
            <Select label="Tipo *" id="tipo" options={[{ value:"funcional", label:"Funcional"}, { value:"no_funcional", label:"No Funcional"}]} {...register("tipo")} />
          </div>
          <Textarea label="Descripción *" id="descripcion" rows={3} error={errors.descripcion?.message} {...register("descripcion")} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Prioridad *" id="prioridad" options={[{value:"critica",label:"Crítica"},{value:"alta",label:"Alta"},{value:"media",label:"Media"},{value:"baja",label:"Baja"}]} {...register("prioridad")} />
            <Select
              label="Estado *"
              id="statusDefId"
              error={errors.statusDefId?.message}
              placeholder={!watchProjectId ? "Primero elige proyecto" : loadingStatusesForm ? "Cargando…" : "Seleccionar"}
              options={statusesForm.map((s) => ({ value: String(s.id), label: s.nombre }))}
              disabled={!watchProjectId || loadingStatusesForm}
              {...register("statusDefId")}
            />
            <Select
              label="Categoría"
              id="categoryDefId"
              placeholder={!watchProjectId ? "Primero elige proyecto" : loadingCategoriesForm ? "Cargando…" : "Sin categoría"}
              options={[
                { value: "", label: "Sin categoría" },
                ...categoriesForm.map((c) => ({ value: String(c.id), label: c.nombre })),
              ]}
              disabled={!watchProjectId || loadingCategoriesForm}
              {...register("categoryDefId")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Solicitante" id="solicitanteId" placeholder="Sin asignar"
              options={usuarios.map(u => ({ value: String(u.id), label: u.nombre }))}
              {...register("solicitanteId")} />
            <Select label="Responsable TI" id="responsableId" placeholder="Sin asignar"
              options={usuarios.map(u => ({ value: String(u.id), label: u.nombre }))}
              {...register("responsableId")} />
          </div>
          <Textarea label="Criterios de Aceptación" id="criterios" rows={3} {...register("criteriosAceptacion")} />
          {canWrite && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3 space-y-2">
              <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <Paperclip size={16} className="text-gray-500" /> Adjuntos (PDF o Word)
              </p>
              <p className="text-xs text-gray-500">Máx. 10 MB por archivo. Se suben al guardar el requisito.</p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setArchivosPendientes(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
              />
              {archivosPendientes.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  {archivosPendientes.map((f, i) => (
                    <li key={`${f.name}-${i}`}>{f.name} ({formatBytes(f.size)})</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => { setModalForm(false); setArchivosPendientes([]); }}>Cancelar</Button>
            <Button
              type="submit"
              loading={isSubmitting || uploadAttachmentMutation.isPending}
              disabled={!!watchProjectId && (loadingStatusesForm || loadingCategoriesForm)}
            >
              {editando ? "Guardar cambios" : "Crear Requisito"}
            </Button>
          </div>
        </form>
      </Modal>
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
