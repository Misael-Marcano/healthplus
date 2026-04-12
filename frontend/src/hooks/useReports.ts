import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: () => api.get<DashboardStats>("/reports/dashboard").then((r) => r.data),
  });
}

export function useReportByStatus() {
  return useQuery({
    queryKey: ["reports", "by-status"],
    queryFn: () => api.get<{ estado: string; cantidad: string }[]>("/reports/by-status").then((r) => r.data),
  });
}

export function useReportByProject() {
  return useQuery({
    queryKey: ["reports", "by-project"],
    queryFn: () =>
      api.get<{ id: number; nombre: string; totalRequisitos: string; aprobados: string }[]>("/reports/by-project").then((r) => r.data),
  });
}

export function useReportByPriority() {
  return useQuery({
    queryKey: ["reports", "by-priority"],
    queryFn: () => api.get<{ prioridad: string; cantidad: string }[]>("/reports/by-priority").then((r) => r.data),
  });
}

export function useMonthlyProgress() {
  return useQuery({
    queryKey: ["reports", "monthly-progress"],
    queryFn: () =>
      api
        .get<{ mes: string; requisitos: number; aprobados: number }[]>("/reports/monthly-progress")
        .then((r) => r.data),
  });
}

/** Fila plana para exportaciones CSV/PDF (todos los campos relevantes del requisito). */
export interface RequirementDetailExportRow {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  categoria: string;
  prioridad: string;
  impacto: number;
  urgencia: number;
  esfuerzo: number;
  valor: number;
  estadoSlug: string;
  estadoNombre: string;
  proyecto: string;
  solicitante: string;
  responsable: string;
  criteriosAceptacion: string;
  version: number;
  creadoEn: string;
  actualizadoEn: string;
}
