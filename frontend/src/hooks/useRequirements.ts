import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Requisito } from "@/types";

const KEY = "requirements";

interface Filters {
  projectId?: number;
  estado?: string;
  prioridad?: string;
  tipo?: string;
  /** Si es `false`, no se ejecuta la petición (p. ej. rol sin acceso a la API de requisitos). */
  enabled?: boolean;
}

function normalizeRequirement(r: any): Requisito {
  const def = (n: unknown, fallback: number) =>
    typeof n === "number" && n >= 1 && n <= 5 ? n : fallback;
  const comments = Array.isArray(r.comments)
    ? r.comments.map((c: any) => ({
        id: c.id,
        texto: c.texto ?? "",
        creadoEn: c.creadoEn ? String(c.creadoEn) : "",
        menciones: Array.isArray(c.menciones) ? c.menciones.map(Number) : undefined,
        autor: {
          id: c.autor?.id ?? 0,
          nombre: c.autor?.nombre ?? "",
        },
      }))
    : undefined;
  const attachments = Array.isArray(r.attachments)
    ? r.attachments.map((a: any) => ({
        id: a.id,
        nombreOriginal: a.nombreOriginal ?? "",
        mimeType: a.mimeType ?? "",
        tamanoBytes: Number(a.tamanoBytes ?? 0),
        creadoEn: a.creadoEn ? String(a.creadoEn) : "",
        subidoPor: a.subidoPor
          ? { id: a.subidoPor.id, nombre: a.subidoPor.nombre ?? "" }
          : undefined,
      }))
    : undefined;
  return {
    ...r,
    impacto: def(r.impacto, 3),
    urgencia: def(r.urgencia, 3),
    esfuerzo: def(r.esfuerzo, 3),
    valor: def(r.valor, 3),
    estadoNombre: r.estadoNombre ?? r.statusDef?.nombre,
    statusDefId: r.statusDefId ?? r.statusDef?.id,
    categoriaNombre: r.categoriaNombre ?? r.categoryDef?.nombre,
    categoryDefId: r.categoryDefId ?? r.categoryDef?.id,
    categoria: r.categoria ?? r.categoryDef?.slug ?? "",
    categorias: Array.isArray(r.categorias)
      ? r.categorias.map((x: unknown) => String(x))
      : r.categoria
        ? [String(r.categoria)]
        : [],
    // project relation → flat fields
    proyectoId:     r.proyectoId     ?? r.project?.id,
    proyectoNombre: r.proyectoNombre ?? r.project?.nombre ?? "",
    // user relations → name strings
    solicitante:
      typeof r.solicitante === "object" ? (r.solicitante?.nombre ?? "") : (r.solicitante ?? ""),
    responsable:
      typeof r.responsable === "object" ? (r.responsable?.nombre ?? "") : (r.responsable ?? ""),
    creadoPor:
      r.creadoPor && typeof r.creadoPor === "object"
        ? { id: Number(r.creadoPor.id), nombre: String(r.creadoPor.nombre ?? "") }
        : null,
    comments,
    attachments,
    adjuntosCount:
      typeof r.adjuntosCount === "number"
        ? r.adjuntosCount
        : Number(r.adjuntosCount ?? 0),
    // dates → ISO date string
    creadoEn:      r.creadoEn      ? String(r.creadoEn).split("T")[0]      : "",
    actualizadoEn: r.actualizadoEn ? String(r.actualizadoEn).split("T")[0] : "",
  };
}

export function useRequirements(filters: Filters = {}) {
  const { enabled = true, ...queryFilters } = filters;
  return useQuery({
    queryKey: [KEY, queryFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (queryFilters.projectId) params.set("projectId", String(queryFilters.projectId));
      if (queryFilters.estado)    params.set("estado",    queryFilters.estado);
      if (queryFilters.prioridad) params.set("prioridad", queryFilters.prioridad);
      if (queryFilters.tipo)      params.set("tipo",      queryFilters.tipo);
      const { data } = await api.get<any[]>(`/requirements?${params}`);
      return data.map(normalizeRequirement);
    },
    enabled,
  });
}

export function useRequirement(
  id: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      const { data } = await api.get<any>(`/requirements/${id}`);
      return normalizeRequirement(data);
    },
    enabled:
      options?.enabled === false ? false : !!id,
  });
}

interface RequirementDto extends Partial<Requisito> {
  projectId: number;
  solicitanteId?: number;
  responsableId?: number;
  statusDefId?: number;
  categoryDefId?: number;
  categoryDefIds?: number[];
  categorias?: string[];
  motivoCambio?: string;
}

export function useCreateRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: RequirementDto) =>
      api.post("/requirements", dto).then((r) => r.data),
    onSuccess: () => {
      toast.success("Requisito creado");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: Partial<RequirementDto> & { id: number }) =>
      api.patch(`/requirements/${id}`, dto).then((r) => r.data),
    onSuccess: (_d, v) => {
      toast.success("Requisito actualizado");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY, v.id] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteRequirement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/requirements/${id}`),
    onSuccess: () => {
      toast.success("Requisito eliminado");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
