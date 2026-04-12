import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface AuditEntry {
  id: number;
  accion: string;
  entidad: string;
  entidadId: number;
  detalle: string;
  user?: { id: number; nombre: string; email: string };
  creadoEn: string;
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: () => api.get<AuditEntry[]>("/audit").then((r) => r.data),
  });
}

export function useAuditByEntity(entidad: string, id: number) {
  return useQuery({
    queryKey: ["audit", entidad, id],
    queryFn: () =>
      api
        .get<AuditEntry[]>(`/audit/entity?entidad=${entidad}&id=${id}`)
        .then((r) => r.data),
    enabled: !!entidad && !!id,
  });
}
