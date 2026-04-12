import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface RequirementCategoryDef {
  id: number;
  nombre: string;
  slug: string;
  orden: number;
  color: string | null;
  activo: boolean;
  esSistema: boolean;
}

const KEY = "requirement-categories";

export function useRequirementCategories(
  projectId?: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [KEY, projectId ?? "global"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId != null && projectId > 0) {
        params.set("projectId", String(projectId));
      }
      const qs = params.toString();
      const { data } = await api.get<RequirementCategoryDef[]>(
        qs ? `/requirement-categories?${qs}` : "/requirement-categories",
      );
      return data;
    },
    enabled: options?.enabled !== false,
  });
}

export function useCreateRequirementCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: {
      nombre: string;
      slug?: string;
      projectId?: number;
      orden?: number;
      color?: string;
    }) => api.post("/requirement-categories", dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateRequirementCategory() {
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
    }>) => api.patch(`/requirement-categories/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteRequirementCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/requirement-categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
