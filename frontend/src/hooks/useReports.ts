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

/** Query string de fechas (YYYY-MM-DD) para `/reports/requirements-detail` y matriz. */
export interface ReportDateQuery {
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
}

/** Participación usuario ↔ requisito ↔ proyecto (exportación matriz). */
export interface UserProjectRequirementRow {
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  proyectoId: number;
  proyectoNombre: string;
  requisitoId: number;
  codigo: string;
  titulo: string;
  papel: "solicitante" | "responsable" | "solicitante_y_responsable";
  estadoNombre: string;
  prioridad: string;
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
  adjuntosCount: number;
  adjuntosNombres: string;
  /** Días desde creación (aging simple). */
  diasDesdeCreacion: number;
  /** Días desde última actualización. */
  diasDesdeActualizacion: number;
}

export interface ValidationExportRow {
  id: number;
  requisitoId: number;
  codigo: string;
  tituloRequisito: string;
  proyectoId: number;
  proyectoNombre: string;
  validadorNombre: string;
  validadorEmail: string;
  solicitadoPorNombre: string;
  estado: string;
  comentario: string;
  creadoEn: string;
}

export interface VersionExportRow {
  id: number;
  requisitoId: number;
  codigo: string;
  proyectoNombre: string;
  version: number;
  titulo: string;
  descripcion: string;
  criteriosAceptacion: string;
  motivoCambio: string;
  creadoPorNombre: string;
  creadoEn: string;
}

export interface AttachmentExportRow {
  id: number;
  requisitoId: number;
  codigo: string;
  tituloRequisito: string;
  proyectoId: number;
  proyectoNombre: string;
  nombreOriginal: string;
  rutaAlmacenamiento: string;
  mimeType: string;
  tamanoBytes: number;
  subidoPorNombre: string;
  creadoEn: string;
}
