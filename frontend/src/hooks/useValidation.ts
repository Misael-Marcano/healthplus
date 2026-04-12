import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

const KEY = "validation";

function normalizeValidation(v: any) {
  return {
    ...v,
    // Si el requisito viene como objeto plano o anidado
    requisito: v.requisito ?? {
      id:     v.requisitoId,
      codigo: v.codigo,
      titulo: v.titulo,
      proyecto: v.proyecto ? { nombre: v.proyecto } : undefined,
    },
    solicitante:
      typeof v.solicitante === "object"
        ? v.solicitante
        : v.solicitante
        ? { nombre: v.solicitante }
        : undefined,
    creadoEn: v.creadoEn ?? v.fechaSolicitud ?? "",
  };
}

export function usePendingValidations() {
  return useQuery({
    queryKey: [KEY, "pending"],
    queryFn: () =>
      api.get<any[]>("/validation/pending").then((r) =>
        r.data.map(normalizeValidation)
      ),
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
      qc.invalidateQueries({ queryKey: ["requirements"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
