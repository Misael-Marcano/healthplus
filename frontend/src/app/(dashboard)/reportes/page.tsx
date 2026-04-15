"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { FileDown, FileText, Printer, BarChart3, PieChart as PieIcon, TrendingUp, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/lib/api";
import {
  useDashboardStats,
  useReportByStatus,
  useReportByProject,
  useReportByPriority,
  type RequirementDetailExportRow,
  type UserProjectRequirementRow,
  type ReportDateQuery,
  type ValidationExportRow,
  type VersionExportRow,
  type AttachmentExportRow,
} from "@/hooks/useReports";
import { useProjects } from "@/hooks/useProjects";
import { useUserLookup } from "@/hooks/useUsers";

const ESTADO_LABELS: Record<string, string> = {
  borrador:        "Borrador",
  en_revision:     "En Revisión",
  validado:        "Validado",
  aprobado:        "Aprobado",
  implementado:    "Implementado",
  rechazado:       "Rechazado",
  cancelado:       "Cancelado",
  requiere_ajuste: "Req. ajuste",
};

const PRIORIDAD_COLORS: Record<string, string> = {
  critica: "#ef4444",
  alta:    "#f97316",
  media:   "#3b82f6",
  baja:    "#6b7280",
};

const PRIORIDAD_LABELS: Record<string, string> = {
  critica: "Crítica",
  alta:    "Alta",
  media:   "Media",
  baja:    "Baja",
};

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (c: string | number) => `"${String(c).replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slugifyForFile(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "proyecto";
}

function buildActorScope(
  usuarioNombre: string | null,
  proyectoNombre: string | null,
) {
  const userLabel = usuarioNombre ?? "Todos los usuarios";
  const projectLabel = proyectoNombre ?? "Todos los proyectos";
  const userSlug = slugifyForFile(usuarioNombre ?? "todos-los-usuarios");
  const projectSlug = slugifyForFile(proyectoNombre ?? "todos-los-proyectos");
  return {
    label: `Usuario: ${userLabel} · Proyecto: ${projectLabel}`,
    fileSlug: `usuario-${userSlug}-proyecto-${projectSlug}`,
  };
}

const DETALLE_COLUMNAS: { key: keyof RequirementDetailExportRow; header: string }[] = [
  { key: "codigo", header: "Código" },
  { key: "titulo", header: "Título" },
  { key: "descripcion", header: "Descripción" },
  { key: "tipo", header: "Tipo" },
  { key: "categoria", header: "Categoría" },
  { key: "prioridad", header: "Prioridad" },
  { key: "impacto", header: "Impacto" },
  { key: "urgencia", header: "Urgencia" },
  { key: "esfuerzo", header: "Esfuerzo" },
  { key: "valor", header: "Valor" },
  { key: "estadoSlug", header: "Estado (slug)" },
  { key: "estadoNombre", header: "Estado (nombre)" },
  { key: "proyecto", header: "Proyecto" },
  { key: "solicitante", header: "Solicitante" },
  { key: "responsable", header: "Responsable" },
  { key: "criteriosAceptacion", header: "Criterios aceptación" },
  { key: "version", header: "Versión" },
  { key: "adjuntosCount", header: "N.º adjuntos" },
  { key: "adjuntosNombres", header: "Archivos adjuntos" },
  { key: "creadoEn", header: "Creado" },
  { key: "actualizadoEn", header: "Actualizado" },
  { key: "diasDesdeCreacion", header: "Días desde creación" },
  { key: "diasDesdeActualizacion", header: "Días desde actualización" },
];

const MATRIZ_COLUMNAS: { key: keyof UserProjectRequirementRow; header: string }[] = [
  { key: "usuarioId", header: "Usuario ID" },
  { key: "usuarioNombre", header: "Usuario" },
  { key: "usuarioEmail", header: "Email" },
  { key: "proyectoId", header: "Proyecto ID" },
  { key: "proyectoNombre", header: "Proyecto" },
  { key: "requisitoId", header: "Requisito ID" },
  { key: "codigo", header: "Código" },
  { key: "titulo", header: "Título" },
  { key: "papel", header: "Papel" },
  { key: "estadoNombre", header: "Estado" },
  { key: "prioridad", header: "Prioridad" },
];

const PAPEL_LABELS: Record<string, string> = {
  solicitante: "Solicitante",
  responsable: "Responsable (asignado)",
  solicitante_y_responsable: "Solicitante y responsable",
};

function mergeReportParams(
  projectId?: number,
  dates?: ReportDateQuery,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (projectId != null && projectId > 0) params.projectId = projectId;
  if (dates?.createdFrom) params.createdFrom = dates.createdFrom;
  if (dates?.createdTo) params.createdTo = dates.createdTo;
  if (dates?.updatedFrom) params.updatedFrom = dates.updatedFrom;
  if (dates?.updatedTo) params.updatedTo = dates.updatedTo;
  return params;
}

async function fetchRequirementsDetail(
  projectId?: number,
  dates?: ReportDateQuery,
): Promise<RequirementDetailExportRow[]> {
  const { data } = await api.get<RequirementDetailExportRow[]>("/reports/requirements-detail", {
    params: mergeReportParams(projectId, dates),
  });
  return data;
}

async function fetchUserProjectRequirements(
  userId?: number,
  projectId?: number,
  dates?: ReportDateQuery,
): Promise<UserProjectRequirementRow[]> {
  const params = mergeReportParams(projectId, dates);
  if (userId != null && userId > 0) params.userId = userId;
  const { data } = await api.get<UserProjectRequirementRow[]>("/reports/user-project-requirements", {
    params,
  });
  return data;
}

const VALIDATION_COLS: { key: keyof ValidationExportRow; header: string }[] = [
  { key: "id", header: "Validación ID" },
  { key: "requisitoId", header: "Requisito ID" },
  { key: "codigo", header: "Código" },
  { key: "tituloRequisito", header: "Título requisito" },
  { key: "proyectoId", header: "Proyecto ID" },
  { key: "proyectoNombre", header: "Proyecto" },
  { key: "validadorNombre", header: "Validador" },
  { key: "validadorEmail", header: "Email validador" },
  { key: "solicitadoPorNombre", header: "Solicitado por" },
  { key: "estado", header: "Estado" },
  { key: "comentario", header: "Comentario" },
  { key: "creadoEn", header: "Fecha" },
];

const VERSION_COLS: { key: keyof VersionExportRow; header: string }[] = [
  { key: "id", header: "Versión ID" },
  { key: "requisitoId", header: "Requisito ID" },
  { key: "codigo", header: "Código" },
  { key: "proyectoNombre", header: "Proyecto" },
  { key: "version", header: "N.º versión" },
  { key: "titulo", header: "Título (snapshot)" },
  { key: "descripcion", header: "Descripción" },
  { key: "criteriosAceptacion", header: "Criterios" },
  { key: "motivoCambio", header: "Motivo cambio" },
  { key: "creadoPorNombre", header: "Autor versión" },
  { key: "creadoEn", header: "Fecha" },
];

const ATTACHMENT_COLS: { key: keyof AttachmentExportRow; header: string }[] = [
  { key: "id", header: "Adjunto ID" },
  { key: "requisitoId", header: "Requisito ID" },
  { key: "codigo", header: "Código" },
  { key: "tituloRequisito", header: "Título" },
  { key: "proyectoId", header: "Proyecto ID" },
  { key: "proyectoNombre", header: "Proyecto" },
  { key: "nombreOriginal", header: "Archivo" },
  { key: "rutaAlmacenamiento", header: "Ruta almacenamiento" },
  { key: "mimeType", header: "MIME" },
  { key: "tamanoBytes", header: "Tamaño (bytes)" },
  { key: "subidoPorNombre", header: "Subido por" },
  { key: "creadoEn", header: "Fecha" },
];

async function fetchValidationsDetail(params: {
  projectId?: number;
  validadorId?: number;
  estado?: string;
}): Promise<ValidationExportRow[]> {
  const q: Record<string, string | number> = {};
  if (params.projectId != null && params.projectId > 0) q.projectId = params.projectId;
  if (params.validadorId != null && params.validadorId > 0) q.validadorId = params.validadorId;
  if (params.estado) q.estado = params.estado;
  const { data } = await api.get<ValidationExportRow[]>("/reports/validations-detail", { params: q });
  return data;
}

async function fetchVersionsExport(projectId?: number, codigosRaw?: string): Promise<VersionExportRow[]> {
  const params: Record<string, string | number> = {};
  if (projectId != null && projectId > 0) params.projectId = projectId;
  if (codigosRaw?.trim()) params.codigos = codigosRaw.trim();
  const { data } = await api.get<VersionExportRow[]>("/reports/versions-export", { params });
  return data;
}

async function fetchAttachmentsDetail(projectId?: number): Promise<AttachmentExportRow[]> {
  const params =
    projectId != null && projectId > 0 ? { projectId } : ({} as Record<string, number>);
  const { data } = await api.get<AttachmentExportRow[]>("/reports/attachments-detail", { params });
  return data;
}

export default function ReportesPage() {
  const [exportingDetalle, setExportingDetalle] = useState(false);
  const [exportingMatriz, setExportingMatriz] = useState(false);
  const [exportingAux, setExportingAux] = useState(false);
  const [proyectoDetalleId, setProyectoDetalleId] = useState("");
  const [matrizUserId, setMatrizUserId] = useState("");
  const [matrizProyectoId, setMatrizProyectoId] = useState("");
  const [creadoDesde, setCreadoDesde] = useState("");
  const [creadoHasta, setCreadoHasta] = useState("");
  const [actualizadoDesde, setActualizadoDesde] = useState("");
  const [actualizadoHasta, setActualizadoHasta] = useState("");
  const [valProyectoId, setValProyectoId] = useState("");
  const [valValidadorId, setValValidadorId] = useState("");
  const [valEstado, setValEstado] = useState("");
  const [verProyectoId, setVerProyectoId] = useState("");
  const [verCodigos, setVerCodigos] = useState("");
  const [adjProyectoId, setAdjProyectoId] = useState("");
  const { data: stats,      isLoading: loadingStats   } = useDashboardStats();
  const { data: byStatus,   isLoading: loadingStatus  } = useReportByStatus();
  const { data: byProject,  isLoading: loadingProject } = useReportByProject();
  const { data: byPriority, isLoading: loadingPriority} = useReportByPriority();
  const { data: proyectos = [], isLoading: loadingProyectosLista } = useProjects();
  const { data: usuariosLookup = [], isLoading: loadingUsuariosLista } = useUserLookup();

  const porEstado = (byStatus ?? []).map(r => ({
    estado:   ESTADO_LABELS[r.estado] ?? r.estado,
    cantidad: Number(r.cantidad),
  }));

  const porProyecto = (byProject ?? []).map(r => ({
    proyecto:   r.nombre,
    requisitos: Number(r.totalRequisitos),
    aprobados:  Number(r.aprobados),
  }));

  const porPrioridad = (byPriority ?? []).map(r => ({
    name:  PRIORIDAD_LABELS[r.prioridad] ?? r.prioridad,
    value: Number(r.cantidad),
    color: PRIORIDAD_COLORS[r.prioridad] ?? "#94a3b8",
  }));

  const totalReq   = stats?.totalRequisitos ?? 0;
  const aprobados  = stats?.requisitosAprobados ?? 0;
  const pendientes = stats?.requisitosPendientes ?? 0;
  const tasaAprobacion = totalReq > 0 ? Math.round((aprobados / totalReq) * 100) : 0;

  const isAnyLoading = loadingStats || loadingStatus || loadingProject || loadingPriority;
  const exportBusy = exportingDetalle || exportingMatriz || exportingAux;

  const dateParams = (): ReportDateQuery | undefined => {
    const o: ReportDateQuery = {};
    if (creadoDesde.trim()) o.createdFrom = creadoDesde.trim();
    if (creadoHasta.trim()) o.createdTo = creadoHasta.trim();
    if (actualizadoDesde.trim()) o.updatedFrom = actualizadoDesde.trim();
    if (actualizadoHasta.trim()) o.updatedTo = actualizadoHasta.trim();
    return Object.keys(o).length ? o : undefined;
  };

  const validationEstadoOptions = [
    { value: "", label: "Todos los estados" },
    { value: "pendiente", label: "Pendiente" },
    { value: "aprobado", label: "Aprobado" },
    { value: "rechazado", label: "Rechazado" },
    { value: "comentado", label: "Comentado" },
  ];

  const getProjectScope = (projectIdRaw?: string) => {
    const pid = projectIdRaw ? Number(projectIdRaw) : NaN;
    const validPid = !Number.isNaN(pid) && pid > 0;
    if (!validPid) {
      return {
        projectId: undefined as number | undefined,
        label: "Todos los proyectos",
        fileSlug: "todos-los-proyectos",
      };
    }
    const name = proyectos.find((p) => p.id === pid)?.nombre ?? `Proyecto ${pid}`;
    return {
      projectId: pid,
      label: name,
      fileSlug: slugifyForFile(name),
    };
  };

  const exportarCsv = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    const rows: (string | number)[][] = [
      ["Resumen", "Valor"],
      ["Total requisitos", totalReq],
      ["Aprobados", aprobados],
      ["Pendientes / validar", pendientes],
      ["En revisión", stats?.requisitosEnRevision ?? 0],
      ["Proyectos activos", stats?.proyectosActivos ?? 0],
      ["Tasa aprobación %", tasaAprobacion],
      [],
      ["Por estado", "Cantidad"],
      ...porEstado.map((r) => [r.estado, r.cantidad]),
      [],
      ["Por proyecto", "Total requisitos", "Aprobados"],
      ...porProyecto.map((r) => [r.proyecto, r.requisitos, r.aprobados]),
      [],
      ["Por prioridad", "Cantidad"],
      ...((byPriority ?? []).map((r) => [PRIORIDAD_LABELS[r.prioridad] ?? r.prioridad, Number(r.cantidad)])),
    ];
    downloadCsv(`healthplus-reportes-${fecha}.csv`, rows);
  };

  const exportarCsvDetallado = async () => {
    setExportingDetalle(true);
    try {
      const detalle = await fetchRequirementsDetail(undefined, dateParams());
      const fecha = new Date().toISOString().slice(0, 10);
      const header = DETALLE_COLUMNAS.map((c) => c.header);
      const body = detalle.map((row) =>
        DETALLE_COLUMNAS.map((c) => {
          const v = row[c.key];
          if (v === null || v === undefined) return "";
          if (typeof v === "object") return JSON.stringify(v);
          return v;
        }),
      );
      downloadCsv(`healthplus-requisitos-detalle-${fecha}.csv`, [header, ...body]);
    } finally {
      setExportingDetalle(false);
    }
  };

  const exportarPdfDetallado = async () => {
    setExportingDetalle(true);
    try {
      const detalle = await fetchRequirementsDetail(undefined, dateParams());
      const fecha = new Date().toISOString().slice(0, 10);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(11);
      doc.text("HealthPlus — Requisitos (exportación detallada)", 14, 12);
      doc.setFontSize(8);
      doc.text(`Generado: ${fecha} · ${detalle.length} registro(s)`, 14, 18);
      autoTable(doc, {
        startY: 22,
        head: [DETALLE_COLUMNAS.map((c) => c.header)],
        body: detalle.map((row) =>
          DETALLE_COLUMNAS.map((c) => {
            const v = row[c.key];
            if (v === null || v === undefined) return "";
            const s = String(v).replace(/\r?\n/g, " ");
            return s.length > 500 ? `${s.slice(0, 497)}…` : s;
          }),
        ),
        styles: { fontSize: 5, cellPadding: 0.4, overflow: "linebreak" },
        headStyles: { fillColor: [47, 128, 209], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 251] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`healthplus-requisitos-detalle-${fecha}.pdf`);
    } finally {
      setExportingDetalle(false);
    }
  };

  const exportarDetallePorProyectoCsv = async () => {
    const scope = getProjectScope(proyectoDetalleId);
    setExportingDetalle(true);
    try {
      const detalle = await fetchRequirementsDetail(scope.projectId, dateParams());
      const fecha = new Date().toISOString().slice(0, 10);
      const header = DETALLE_COLUMNAS.map((c) => c.header);
      const body = detalle.map((row) =>
        DETALLE_COLUMNAS.map((c) => {
          const v = row[c.key];
          if (v === null || v === undefined) return "";
          if (typeof v === "object") return JSON.stringify(v);
          return v;
        }),
      );
      downloadCsv(`healthplus-requisitos-${scope.fileSlug}-${fecha}.csv`, [header, ...body]);
    } finally {
      setExportingDetalle(false);
    }
  };

  const exportarDetallePorProyectoPdf = async () => {
    const scope = getProjectScope(proyectoDetalleId);
    setExportingDetalle(true);
    try {
      const detalle = await fetchRequirementsDetail(scope.projectId, dateParams());
      const fecha = new Date().toISOString().slice(0, 10);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(11);
      doc.text(`HealthPlus — Requisitos (${scope.label})`, 14, 12);
      doc.setFontSize(8);
      doc.text(`Generado: ${fecha} · ${detalle.length} registro(s)`, 14, 18);
      autoTable(doc, {
        startY: 22,
        head: [DETALLE_COLUMNAS.map((c) => c.header)],
        body: detalle.map((row) =>
          DETALLE_COLUMNAS.map((c) => {
            const v = row[c.key];
            if (v === null || v === undefined) return "";
            const s = String(v).replace(/\r?\n/g, " ");
            return s.length > 500 ? `${s.slice(0, 497)}…` : s;
          }),
        ),
        styles: { fontSize: 5, cellPadding: 0.4, overflow: "linebreak" },
        headStyles: { fillColor: [47, 128, 209], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 251] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`healthplus-requisitos-${scope.fileSlug}-${fecha}.pdf`);
    } finally {
      setExportingDetalle(false);
    }
  };

  const matrizCell = (row: UserProjectRequirementRow, key: keyof UserProjectRequirementRow) => {
    const v = row[key];
    if (v === null || v === undefined) return "";
    if (key === "papel") return PAPEL_LABELS[String(v)] ?? String(v);
    return v;
  };

  const exportarMatrizCsv = async () => {
    setExportingMatriz(true);
    try {
      const uid = matrizUserId ? Number(matrizUserId) : undefined;
      const pid = matrizProyectoId ? Number(matrizProyectoId) : undefined;
      const rowsRaw = await fetchUserProjectRequirements(
        uid != null && !Number.isNaN(uid) && uid > 0 ? uid : undefined,
        pid != null && !Number.isNaN(pid) && pid > 0 ? pid : undefined,
        dateParams(),
      );
      const rows = rowsRaw.filter((r) => {
        const okUser = uid == null || Number.isNaN(uid) || uid <= 0 ? true : r.usuarioId === uid;
        const okProject = pid == null || Number.isNaN(pid) || pid <= 0 ? true : r.proyectoId === pid;
        return okUser && okProject;
      });
      const fecha = new Date().toISOString().slice(0, 10);
      const header = MATRIZ_COLUMNAS.map((c) => c.header);
      const body = rows.map((row) => MATRIZ_COLUMNAS.map((c) => matrizCell(row, c.key)));
      const scope = buildActorScope(usuarioMatrizNombre, proyectoMatrizNombre);
      downloadCsv(`healthplus-matriz-${scope.fileSlug}-${fecha}.csv`, [header, ...body]);
    } finally {
      setExportingMatriz(false);
    }
  };

  const exportarMatrizPdf = async () => {
    setExportingMatriz(true);
    try {
      const uid = matrizUserId ? Number(matrizUserId) : undefined;
      const pid = matrizProyectoId ? Number(matrizProyectoId) : undefined;
      const rowsRaw = await fetchUserProjectRequirements(
        uid != null && !Number.isNaN(uid) && uid > 0 ? uid : undefined,
        pid != null && !Number.isNaN(pid) && pid > 0 ? pid : undefined,
        dateParams(),
      );
      const rows = rowsRaw.filter((r) => {
        const okUser = uid == null || Number.isNaN(uid) || uid <= 0 ? true : r.usuarioId === uid;
        const okProject = pid == null || Number.isNaN(pid) || pid <= 0 ? true : r.proyectoId === pid;
        return okUser && okProject;
      });
      const fecha = new Date().toISOString().slice(0, 10);
      const scope = buildActorScope(usuarioMatrizNombre, proyectoMatrizNombre);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(11);
      doc.text(`HealthPlus — Participación (${scope.label})`, 14, 12);
      doc.setFontSize(8);
      doc.text(`Generado: ${fecha} · ${rows.length} fila(s)`, 14, 18);
      autoTable(doc, {
        startY: 22,
        head: [MATRIZ_COLUMNAS.map((c) => c.header)],
        body: rows.map((row) => MATRIZ_COLUMNAS.map((c) => String(matrizCell(row, c.key)))),
        styles: { fontSize: 7, cellPadding: 0.5 },
        headStyles: { fillColor: [47, 128, 209], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 251] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`healthplus-matriz-${scope.fileSlug}-${fecha}.pdf`);
    } finally {
      setExportingMatriz(false);
    }
  };

  const exportRowStrings = <T,>(row: T, cols: { key: keyof T; header: string }[]) =>
    cols.map((c) => {
      const v = row[c.key];
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    });

  const exportarValidacionesCsv = async () => {
    setExportingAux(true);
    try {
      const pid = valProyectoId ? Number(valProyectoId) : undefined;
      const vid = valValidadorId ? Number(valValidadorId) : undefined;
      const rowsRaw = await fetchValidationsDetail({
        projectId: pid != null && !Number.isNaN(pid) && pid > 0 ? pid : undefined,
        validadorId: vid != null && !Number.isNaN(vid) && vid > 0 ? vid : undefined,
        estado: valEstado || undefined,
      });
      const validadorNombreFiltro =
        vid != null && !Number.isNaN(vid) && vid > 0
          ? (usuariosLookup.find((u) => u.id === vid)?.nombre ?? "")
          : "";
      const rows = rowsRaw.filter((r) => {
        const okProject = pid == null || Number.isNaN(pid) || pid <= 0 ? true : r.proyectoId === pid;
        const okEstado = valEstado ? r.estado === valEstado : true;
        const okValidador = validadorNombreFiltro
          ? r.validadorNombre === validadorNombreFiltro
          : true;
        return okProject && okEstado && okValidador;
      });
      const fecha = new Date().toISOString().slice(0, 10);
      downloadCsv(`healthplus-validaciones-${fecha}.csv`, [
        VALIDATION_COLS.map((c) => c.header),
        ...rows.map((row) => exportRowStrings(row, VALIDATION_COLS)),
      ]);
    } finally {
      setExportingAux(false);
    }
  };

  const exportarValidacionesPdf = async () => {
    setExportingAux(true);
    try {
      const pid = valProyectoId ? Number(valProyectoId) : undefined;
      const vid = valValidadorId ? Number(valValidadorId) : undefined;
      const rowsRaw = await fetchValidationsDetail({
        projectId: pid != null && !Number.isNaN(pid) && pid > 0 ? pid : undefined,
        validadorId: vid != null && !Number.isNaN(vid) && vid > 0 ? vid : undefined,
        estado: valEstado || undefined,
      });
      const validadorNombreFiltro =
        vid != null && !Number.isNaN(vid) && vid > 0
          ? (usuariosLookup.find((u) => u.id === vid)?.nombre ?? "")
          : "";
      const rows = rowsRaw.filter((r) => {
        const okProject = pid == null || Number.isNaN(pid) || pid <= 0 ? true : r.proyectoId === pid;
        const okEstado = valEstado ? r.estado === valEstado : true;
        const okValidador = validadorNombreFiltro
          ? r.validadorNombre === validadorNombreFiltro
          : true;
        return okProject && okEstado && okValidador;
      });
      const fecha = new Date().toISOString().slice(0, 10);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(11);
      doc.text("HealthPlus — Validaciones", 14, 12);
      doc.setFontSize(8);
      doc.text(`Generado: ${fecha} · ${rows.length} fila(s)`, 14, 18);
      autoTable(doc, {
        startY: 22,
        head: [VALIDATION_COLS.map((c) => c.header)],
        body: rows.map((row) =>
          VALIDATION_COLS.map((c) => {
            const s = String(row[c.key] ?? "").replace(/\r?\n/g, " ");
            return s.length > 400 ? `${s.slice(0, 397)}…` : s;
          }),
        ),
        styles: { fontSize: 6, cellPadding: 0.45 },
        headStyles: { fillColor: [47, 128, 209], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 251] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`healthplus-validaciones-${fecha}.pdf`);
    } finally {
      setExportingAux(false);
    }
  };

  const exportarVersionesCsv = async () => {
    setExportingAux(true);
    try {
      const scope = getProjectScope(verProyectoId);
      const rows = await fetchVersionsExport(
        scope.projectId,
        verCodigos,
      );
      const fecha = new Date().toISOString().slice(0, 10);
      downloadCsv(`healthplus-versiones-requisitos-${scope.fileSlug}-${fecha}.csv`, [
        VERSION_COLS.map((c) => c.header),
        ...rows.map((row) => exportRowStrings(row, VERSION_COLS)),
      ]);
    } finally {
      setExportingAux(false);
    }
  };

  const exportarVersionesPdf = async () => {
    setExportingAux(true);
    try {
      const scope = getProjectScope(verProyectoId);
      const rows = await fetchVersionsExport(
        scope.projectId,
        verCodigos,
      );
      const fecha = new Date().toISOString().slice(0, 10);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(11);
      doc.text(`HealthPlus — Historial de versiones (${scope.label})`, 14, 12);
      doc.setFontSize(8);
      doc.text(`Generado: ${fecha} · ${rows.length} fila(s)`, 14, 18);
      autoTable(doc, {
        startY: 22,
        head: [VERSION_COLS.map((c) => c.header)],
        body: rows.map((row) =>
          VERSION_COLS.map((c) => {
            const s = String(row[c.key] ?? "").replace(/\r?\n/g, " ");
            return s.length > 350 ? `${s.slice(0, 347)}…` : s;
          }),
        ),
        styles: { fontSize: 5, cellPadding: 0.35 },
        headStyles: { fillColor: [47, 128, 209], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 251] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`healthplus-versiones-requisitos-${scope.fileSlug}-${fecha}.pdf`);
    } finally {
      setExportingAux(false);
    }
  };

  const exportarAdjuntosCsv = async () => {
    setExportingAux(true);
    try {
      const scope = getProjectScope(adjProyectoId);
      const rows = await fetchAttachmentsDetail(scope.projectId);
      const fecha = new Date().toISOString().slice(0, 10);
      downloadCsv(`healthplus-adjuntos-${scope.fileSlug}-${fecha}.csv`, [
        ATTACHMENT_COLS.map((c) => c.header),
        ...rows.map((row) => exportRowStrings(row, ATTACHMENT_COLS)),
      ]);
    } finally {
      setExportingAux(false);
    }
  };

  const exportarAdjuntosPdf = async () => {
    setExportingAux(true);
    try {
      const scope = getProjectScope(adjProyectoId);
      const rows = await fetchAttachmentsDetail(scope.projectId);
      const fecha = new Date().toISOString().slice(0, 10);
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(11);
      doc.text(`HealthPlus — Inventario de adjuntos (${scope.label})`, 14, 12);
      doc.setFontSize(8);
      doc.text(`Generado: ${fecha} · ${rows.length} archivo(s)`, 14, 18);
      autoTable(doc, {
        startY: 22,
        head: [ATTACHMENT_COLS.map((c) => c.header)],
        body: rows.map((row) =>
          ATTACHMENT_COLS.map((c) => {
            const s = String(row[c.key] ?? "").replace(/\r?\n/g, " ");
            return s.length > 320 ? `${s.slice(0, 317)}…` : s;
          }),
        ),
        styles: { fontSize: 6, cellPadding: 0.45 },
        headStyles: { fillColor: [47, 128, 209], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [246, 248, 251] },
        margin: { left: 10, right: 10 },
      });
      doc.save(`healthplus-adjuntos-${scope.fileSlug}-${fecha}.pdf`);
    } finally {
      setExportingAux(false);
    }
  };

  const proyectoOptions = proyectos.map((p) => ({ value: String(p.id), label: p.nombre }));
  const usuarioOptions = usuariosLookup.map((u) => ({ value: String(u.id), label: u.nombre }));
  const usuarioMatrizNombre =
    matrizUserId && !Number.isNaN(Number(matrizUserId))
      ? (usuariosLookup.find((u) => u.id === Number(matrizUserId))?.nombre ?? matrizUserId)
      : null;
  const proyectoMatrizNombre =
    matrizProyectoId && !Number.isNaN(Number(matrizProyectoId))
      ? (proyectos.find((p) => p.id === Number(matrizProyectoId))?.nombre ?? matrizProyectoId)
      : null;
  const proyectoValidacionNombre =
    valProyectoId && !Number.isNaN(Number(valProyectoId))
      ? (proyectos.find((p) => p.id === Number(valProyectoId))?.nombre ?? valProyectoId)
      : null;
  const validadorNombre =
    valValidadorId && !Number.isNaN(Number(valValidadorId))
      ? (usuariosLookup.find((u) => u.id === Number(valValidadorId))?.nombre ?? valValidadorId)
      : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#4B5563]">Reportes</h1>
          <p className="text-sm text-[#7A8798]">Métricas y análisis de requisitos</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            onClick={exportarCsv}
            disabled={isAnyLoading}
            aria-label="Exportar CSV resumen de métricas"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-sm font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] transition-colors disabled:opacity-50"
          >
            <FileDown size={16} strokeWidth={1.75} aria-hidden /> CSV resumen
          </button>
          <button
            type="button"
            onClick={() => void exportarCsvDetallado()}
            disabled={isAnyLoading || exportBusy}
            aria-label="Exportar CSV detallado de todos los requisitos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-sm font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] transition-colors disabled:opacity-50"
          >
            {exportingDetalle ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <FileText size={16} strokeWidth={1.75} aria-hidden />
            )}
            CSV detallado
          </button>
          <button
            type="button"
            onClick={() => void exportarPdfDetallado()}
            disabled={isAnyLoading || exportBusy}
            aria-label="Exportar PDF detallado de todos los requisitos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-sm font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] transition-colors disabled:opacity-50"
          >
            {exportingDetalle ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <FileDown size={16} strokeWidth={1.75} aria-hidden />
            )}
            PDF detallado
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Imprimir la vista de reportes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-sm font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] transition-colors"
          >
            <Printer size={16} strokeWidth={1.75} aria-hidden /> Imprimir vista
          </button>
        </div>
      </div>

      {/* Estadísticas primero; filtros/exportaciones debajo */}
      {isAnyLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      )}

      {!isAnyLoading && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: "Total Requisitos",     value: String(totalReq),            sub: `${stats?.proyectosActivos ?? 0} proyectos activos`, color: "bg-[#2F80D1]"   },
              { label: "Tasa de Aprobación",   value: `${tasaAprobacion}%`,        sub: `${aprobados}/${totalReq} aprobados`,               color: "bg-[#6BB58E]"  },
              { label: "Pendientes de Validar",value: String(pendientes),          sub: "en revisión",                                      color: "bg-[#E9BC62]" },
              { label: "En Revisión",          value: String(stats?.requisitosEnRevision ?? 0), sub: "requieren acción",                    color: "bg-[#E45469]" },
            ].map(k => (
              <div key={k.label} className={`${k.color} rounded-[14px] min-h-[88px] p-4 text-white shadow-sm`}>
                <p className="text-xs text-white/85 font-medium">{k.label}</p>
                <p className="text-3xl font-bold mt-0.5">{k.value}</p>
                <p className="text-xs text-white/70 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <BarChart3 size={16} className="text-blue-600" />
                  Requisitos por Estado
                </h2>
              </CardHeader>
              <CardContent>
                {porEstado.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={porEstado} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="estado" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                      <Bar dataKey="cantidad" name="Requisitos" fill="#2F80D1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <TrendingUp size={16} className="text-blue-600" />
                  Avance por Proyecto
                </h2>
              </CardHeader>
              <CardContent>
                {porProyecto.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={porProyecto} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="proyecto" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="requisitos" name="Total"     fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="aprobados"  name="Aprobados" fill="#2F80D1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <PieIcon size={16} className="text-blue-600" />
                  Por Prioridad
                </h2>
              </CardHeader>
              <CardContent>
                {porPrioridad.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={porPrioridad}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {porPrioridad.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                  <BarChart3 size={16} className="text-purple-600" />
                  Resumen por Proyecto
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                {porProyecto.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">Sin datos</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {porProyecto.map((p, i) => {
                      const pct = p.requisitos > 0 ? Math.round((p.aprobados / p.requisitos) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/80 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{p.proyecto}</p>
                            <p className="text-xs text-gray-400">{p.aprobados}/{p.requisitos} aprobados</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-700 w-9 text-right">{pct}%</span>
                          </div>
                          <Badge variant={pct >= 75 ? "success" : pct >= 40 ? "warning" : "gray"} className="shrink-0">
                            {pct >= 75 ? "Bueno" : pct >= 40 ? "Regular" : "Bajo"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="print:hidden border-[#E8EEF4] shadow-sm">
        <CardHeader>
          <h2 className="font-semibold text-gray-800 text-sm">Descargas filtradas</h2>
          <p className="text-xs text-[#7A8798] mt-1">
            Exporta el detalle completo solo de un proyecto, o la matriz de participación (qué requisitos tiene cada
            usuario en cada proyecto, como solicitante o responsable).
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="rounded-[10px] border border-[#E8EEF4] bg-[#FAFCFE] p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Filtros por fecha (opcionales)</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Se aplican al detalle global, detalle por proyecto y a la matriz de participación (criterio sobre
                  fechas del requisito).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreadoDesde("");
                  setCreadoHasta("");
                  setActualizadoDesde("");
                  setActualizadoHasta("");
                }}
                className="text-xs font-semibold text-[#2F80D1] hover:underline shrink-0"
              >
                Limpiar fechas
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                id="rep-creado-desde"
                label="Creado desde"
                type="date"
                value={creadoDesde}
                onChange={(e) => setCreadoDesde(e.target.value)}
              />
              <Input
                id="rep-creado-hasta"
                label="Creado hasta"
                type="date"
                value={creadoHasta}
                onChange={(e) => setCreadoHasta(e.target.value)}
              />
              <Input
                id="rep-act-desde"
                label="Actualizado desde"
                type="date"
                value={actualizadoDesde}
                onChange={(e) => setActualizadoDesde(e.target.value)}
              />
              <Input
                id="rep-act-hasta"
                label="Actualizado hasta"
                type="date"
                value={actualizadoHasta}
                onChange={(e) => setActualizadoHasta(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Detalle por proyecto</h3>
              <p className="text-xs text-gray-500">
                Mismas columnas que el CSV/PDF detallado global, limitadas al proyecto elegido.
              </p>
              <Select
                id="reporte-proyecto-detalle"
                label="Proyecto"
                placeholder="— Seleccionar —"
                options={proyectoOptions}
                value={proyectoDetalleId}
                onChange={(e) => setProyectoDetalleId(e.target.value)}
                disabled={loadingProyectosLista}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void exportarDetallePorProyectoCsv()}
                  disabled={exportBusy || loadingProyectosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingDetalle ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  CSV por proyecto
                </button>
                <button
                  type="button"
                  onClick={() => void exportarDetallePorProyectoPdf()}
                  disabled={exportBusy || loadingProyectosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingDetalle ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                  PDF por proyecto
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Matriz usuario — proyecto — requisito</h3>
              <p className="text-xs text-gray-500">
                Una fila por participación. Filtra por usuario y/o proyecto, o deja ambos en “Todos” para exportar
                todo el universo.
              </p>
              <p className="text-xs text-[#5E6C84] bg-[#F6F8FB] border border-[#E5EAF0] rounded px-2 py-1">
                Filtros activos: usuario {usuarioMatrizNombre ? `"${usuarioMatrizNombre}"` : "Todos"} · proyecto{" "}
                {proyectoMatrizNombre ? `"${proyectoMatrizNombre}"` : "Todos"}
              </p>
              <Select
                id="reporte-matriz-usuario"
                label="Usuario"
                placeholder="Todos los usuarios"
                options={usuarioOptions}
                value={matrizUserId}
                onChange={(e) => setMatrizUserId(e.target.value)}
                disabled={loadingUsuariosLista}
              />
              <Select
                id="reporte-matriz-proyecto"
                label="Proyecto (opcional)"
                placeholder="Todos los proyectos"
                options={proyectoOptions}
                value={matrizProyectoId}
                onChange={(e) => setMatrizProyectoId(e.target.value)}
                disabled={loadingProyectosLista}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void exportarMatrizCsv()}
                  disabled={exportBusy || loadingProyectosLista || loadingUsuariosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingMatriz ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  CSV matriz
                </button>
                <button
                  type="button"
                  onClick={() => void exportarMatrizPdf()}
                  disabled={exportBusy || loadingProyectosLista || loadingUsuariosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingMatriz ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                  PDF matriz
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="print:hidden border-[#E8EEF4] shadow-sm">
        <CardHeader>
          <h2 className="font-semibold text-gray-800 text-sm">Validaciones, versiones y adjuntos</h2>
          <p className="text-xs text-[#7A8798] mt-1">
            Exportaciones operativas para seguimiento de aprobaciones, auditoría de contenido e inventario de
            archivos (ruta interna de almacenamiento).
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Validaciones</h3>
              <p className="text-xs text-[#5E6C84] bg-[#F6F8FB] border border-[#E5EAF0] rounded px-2 py-1">
                Filtros activos: proyecto {proyectoValidacionNombre ? `"${proyectoValidacionNombre}"` : "Todos"} ·
                validador {validadorNombre ? `"${validadorNombre}"` : "Todos"} · estado{" "}
                {valEstado ? `"${valEstado}"` : "Todos"}
              </p>
              <Select
                id="rep-val-proyecto"
                label="Proyecto"
                placeholder="Todos"
                options={proyectoOptions}
                value={valProyectoId}
                onChange={(e) => setValProyectoId(e.target.value)}
                disabled={loadingProyectosLista}
              />
              <Select
                id="rep-val-validador"
                label="Validador"
                placeholder="Todos"
                options={usuarioOptions}
                value={valValidadorId}
                onChange={(e) => setValValidadorId(e.target.value)}
                disabled={loadingUsuariosLista}
              />
              <Select
                id="rep-val-estado"
                label="Estado"
                placeholder="Todos los estados"
                options={validationEstadoOptions}
                value={valEstado}
                onChange={(e) => setValEstado(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void exportarValidacionesCsv()}
                  disabled={exportBusy || loadingProyectosLista || loadingUsuariosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingAux ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => void exportarValidacionesPdf()}
                  disabled={exportBusy || loadingProyectosLista || loadingUsuariosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingAux ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                  PDF
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Historial de versiones</h3>
              <p className="text-xs text-gray-500">
                Opcional: proyecto y/o códigos separados por coma (ej. REQ-001,REQ-002). Sin filtros exporta todo.
              </p>
              <Select
                id="rep-ver-proyecto"
                label="Proyecto"
                placeholder="Todos"
                options={proyectoOptions}
                value={verProyectoId}
                onChange={(e) => setVerProyectoId(e.target.value)}
                disabled={loadingProyectosLista}
              />
              <div className="flex flex-col gap-1">
                <label htmlFor="rep-ver-codigos" className="text-sm font-medium text-gray-700">
                  Códigos de requisito (coma)
                </label>
                <textarea
                  id="rep-ver-codigos"
                  rows={2}
                  value={verCodigos}
                  onChange={(e) => setVerCodigos(e.target.value)}
                  placeholder="REQ-001, REQ-002"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void exportarVersionesCsv()}
                  disabled={exportBusy || loadingProyectosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingAux ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => void exportarVersionesPdf()}
                  disabled={exportBusy || loadingProyectosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingAux ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                  PDF
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Adjuntos</h3>
              <p className="text-xs text-gray-500">Lista archivos con ruta relativa en el servidor de aplicación.</p>
              <Select
                id="rep-adj-proyecto"
                label="Proyecto"
                placeholder="Todos"
                options={proyectoOptions}
                value={adjProyectoId}
                onChange={(e) => setAdjProyectoId(e.target.value)}
                disabled={loadingProyectosLista}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void exportarAdjuntosCsv()}
                  disabled={exportBusy || loadingProyectosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingAux ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => void exportarAdjuntosPdf()}
                  disabled={exportBusy || loadingProyectosLista}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-xs font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] disabled:opacity-50"
                >
                  {exportingAux ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                  PDF
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
