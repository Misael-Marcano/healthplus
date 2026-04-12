export type UserRole = "administrador" | "analista" | "stakeholder" | "gerencia" | "consulta";

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  creadoEn: string;
}

/** Slug del estado (catálogo configurable); se mantiene compatibilidad con valores legacy. */
export type EstadoRequisito = string;

export type TipoRequisito = "funcional" | "no_funcional";

export type PrioridadRequisito = "alta" | "media" | "baja" | "critica";

export interface Proyecto {
  id: number;
  nombre: string;
  descripcion: string;
  estado: "activo" | "pausado" | "completado" | "cancelado";
  responsable: string;
  fechaInicio: string;
  fechaFin?: string;
  totalRequisitos: number;
  requisitosAprobados: number;
}

export interface Requisito {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  tipo: TipoRequisito;
  /** Slug de categoría (catálogo). */
  categoria: string;
  /** Nombre legible de la categoría (catálogo). */
  categoriaNombre?: string;
  categoryDefId?: number;
  proyectoId: number;
  proyectoNombre: string;
  /** Escala 1–5 (persistida en servidor). */
  impacto: number;
  urgencia: number;
  esfuerzo: number;
  valor: number;
  prioridad: PrioridadRequisito;
  estado: EstadoRequisito;
  /** Nombre legible del estado (catálogo). */
  estadoNombre?: string;
  statusDefId?: number;
  solicitante: string;
  responsable: string;
  criteriosAceptacion: string;
  version: number;
  creadoEn: string;
  actualizadoEn: string;
  comments?: {
    id: number;
    texto: string;
    creadoEn: string;
    /** Usuarios mencionados con @ (ids). */
    menciones?: number[];
    autor: { id: number; nombre: string };
  }[];
  /** Adjuntos PDF / Word (detalle). */
  attachments?: {
    id: number;
    nombreOriginal: string;
    mimeType: string;
    tamanoBytes: number;
    creadoEn: string;
    subidoPor?: { id: number; nombre: string };
  }[];
}

export interface DashboardStats {
  totalRequisitos: number;
  requisitosAprobados: number;
  requisitosPendientes: number;
  requisitosEnRevision: number;
  proyectosActivos: number;
}
