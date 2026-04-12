import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface RequirementStatusDef {
  id: number;
  nombre: string;
  slug: string;
  orden: number;
  color: string | null;
  activo: boolean;
  esSistema: boolean;
}

const KEY = "requirement-statuses";

/** Estados globales, o globales + del proyecto si se indica `projectId`. Sin id: solo globales. */
export function useRequirementStatuses(
  projectId?: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [KEY, projectId ?? "global"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId != null && projectId > 0) params.set("projectId", String(projectId));
      const qs = params.toString();
      const { data } = await api.get<RequirementStatusDef[]>(
        qs ? `/requirement-statuses?${qs}` : "/requirement-statuses",
      );
      return data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useRequirementStatusesGlobal() {
  return useRequirementStatuses(undefined);
}

export function useCreateRequirementStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      nombre: string;
      slug?: string;
      projectId?: number;
      orden?: number;
      color?: string;
    }) => api.post("/requirement-statuses", dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateRequirementStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...dto
    }: { id: number } & Partial<{
      nombre: string;
      orden: number;
      color: string;
      activo: boolean;
    }>) => api.patch(`/requirement-statuses/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteRequirementStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/requirement-statuses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
