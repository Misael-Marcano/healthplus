import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

const KEY = "validation";

function mapRequirementToRequisito(req: any) {
  if (!req) return undefined;
  return {
    id: req.id,
    codigo: req.codigo ?? "",
    titulo: req.titulo ?? "",
    proyecto: req.project?.nombre
      ? { nombre: req.project.nombre }
      : req.proyecto?.nombre
        ? { nombre: req.proyecto.nombre }
        : undefined,
  };
}

function normalizeValidation(v: any) {
  const req = v.requirement ?? v.requisito;
  const requisito =
    v.requisito ??
    mapRequirementToRequisito(req) ?? {
      id: v.requisitoId,
      codigo: v.codigo,
      titulo: v.titulo,
      proyecto: v.proyecto ? { nombre: v.proyecto } : undefined,
    };

  const solicitanteFromApi = v.solicitadoPor
    ? { nombre: v.solicitadoPor.nombre ?? "" }
    : typeof v.solicitante === "object"
      ? v.solicitante
      : v.solicitante
        ? { nombre: v.solicitante }
        : undefined;

  return {
    ...v,
    requisito,
    validador: v.validador
      ? { id: v.validador.id, nombre: v.validador.nombre ?? "" }
      : undefined,
    solicitante: solicitanteFromApi,
    creadoEn: v.creadoEn ?? v.fechaSolicitud ?? "",
  };
}

const PENDING_REFETCH_MS = 60_000;

export function usePendingValidations(options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}) {
  const enabled = options?.enabled !== false;
  return useQuery({
    queryKey: [KEY, "pending"],
    queryFn: () =>
      api.get<any[]>("/validation/pending").then((r) =>
        r.data.map(normalizeValidation)
      ),
    enabled,
    refetchInterval:
      options?.refetchInterval ??
      (enabled ? PENDING_REFETCH_MS : false),
  });
}

/** Validaciones asignadas al usuario (todos los estados) — pantalla Validación. */
export function useMyValidations(options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}) {
  const enabled = options?.enabled !== false;
  return useQuery({
    queryKey: [KEY, "mine"],
    queryFn: () =>
      api
        .get<any[]>("/validation/mine")
        .then((r) => r.data.map(normalizeValidation)),
    enabled,
    refetchInterval:
      options?.refetchInterval ??
      (enabled ? PENDING_REFETCH_MS : false),
  });
}

/** Requisitos que ya tienen una validación pendiente (para deshabilitar nueva solicitud). */
export function usePendingRequirementIds(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  return useQuery({
    queryKey: [KEY, "pending-req-ids"],
    queryFn: () =>
      api
        .get<{ ids: number[] }>("/validation/pending-requirement-ids")
        .then((r) => r.data.ids ?? []),
    enabled,
  });
}

export function useValidationsByRequirement(requirementId: number) {
  return useQuery({
    queryKey: [KEY, requirementId],
    queryFn: () =>
      api
        .get<any[]>(`/validation/requirement/${requirementId}`)
        .then((r) => r.data.map(normalizeValidation)),
    enabled: !!requirementId,
  });
}

export function useRequestValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      requirementId,
      validadorId,
    }: {
      requirementId: number;
      validadorId: number;
    }) =>
      api
        .post(`/validation/request/${requirementId}`, { validadorId })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Solicitud de validación enviada");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useValidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      estado,
      comentario,
    }: {
      id: number;
      estado: "aprobado" | "rechazado" | "comentado";
      comentario?: string;
    }) =>
      api.patch(`/validation/${id}`, { estado, comentario }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Validación aplicada correctamente");
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["requirements"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
