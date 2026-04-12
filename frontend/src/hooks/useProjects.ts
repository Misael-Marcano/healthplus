import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { Proyecto } from "@/types";

const KEY = "projects";

function normalizeProject(p: any): Proyecto {
  return {
    ...p,
    responsable:
      typeof p.responsable === "object" ? (p.responsable?.nombre ?? "") : (p.responsable ?? ""),
    totalRequisitos:    p.totalRequisitos    ?? 0,
    requisitosAprobados: p.requisitosAprobados ?? 0,
    fechaInicio: p.fechaInicio ? String(p.fechaInicio).split("T")[0] : "",
    fechaFin:    p.fechaFin    ? String(p.fechaFin).split("T")[0]    : undefined,
  };
}

export function useProjects() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () =>
      api.get<any[]>("/projects").then((r) => r.data.map(normalizeProject)),
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () =>
      api.get<any>(`/projects/${id}`).then((r) => normalizeProject(r.data)),
    enabled: !!id,
  });
}

interface ProjectDto extends Partial<Proyecto> {
  responsableId?: number;
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ProjectDto) =>
      api.post("/projects", dto).then((r) => r.data),
    onSuccess: () => {
      toast.success("Proyecto creado");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: ProjectDto & { id: number }) =>
      api.patch(`/projects/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      toast.success("Proyecto actualizado");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      toast.success("Proyecto eliminado");
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
