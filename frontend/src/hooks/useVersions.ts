import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface RequirementVersion {
  id: number;
  version: number;
  titulo: string;
  descripcion: string;
  criteriosAceptacion?: string;
  motivoCambio?: string;
  creadoPor?: { id: number; nombre: string };
  creadoEn: string;
}

export function useRequirementVersions(requirementId: number) {
  return useQuery({
    queryKey: ["versions", requirementId],
    queryFn: () =>
      api
        .get<RequirementVersion[]>(`/requirements/${requirementId}/versions`)
        .then((r) => r.data),
    enabled: !!requirementId,
  });
}

export function useCreateVersion(requirementId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (motivoCambio: string) =>
      api
        .post(`/requirements/${requirementId}/versions`, { motivoCambio })
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["versions", requirementId] }),
  });
}
