"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "@/hooks/useReports";

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
  { key: "creadoEn", header: "Creado" },
  { key: "actualizadoEn", header: "Actualizado" },
];

async function fetchRequirementsDetail(): Promise<RequirementDetailExportRow[]> {
  const { data } = await api.get<RequirementDetailExportRow[]>("/reports/requirements-detail");
  return data;
}

export default function ReportesPage() {
  const [exportingDetalle, setExportingDetalle] = useState(false);
  const { data: stats,      isLoading: loadingStats   } = useDashboardStats();
  const { data: byStatus,   isLoading: loadingStatus  } = useReportByStatus();
  const { data: byProject,  isLoading: loadingProject } = useReportByProject();
  const { data: byPriority, isLoading: loadingPriority} = useReportByPriority();

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
      const detalle = await fetchRequirementsDetail();
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
      const detalle = await fetchRequirementsDetail();
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-sm font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] transition-colors disabled:opacity-50"
          >
            <FileDown size={16} strokeWidth={1.75} /> CSV resumen
          </button>
          <button
            type="button"
            onClick={() => void exportarCsvDetallado()}
            disabled={isAnyLoading || exportingDetalle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-sm font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] transition-colors disabled:opacity-50"
          >
            {exportingDetalle ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} strokeWidth={1.75} />}
            CSV detallado
          </button>
          <button
            type="button"
            onClick={() => void exportarPdfDetallado()}
            disabled={isAnyLoading || exportingDetalle}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-sm font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] transition-colors disabled:opacity-50"
          >
            {exportingDetalle ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} strokeWidth={1.75} />}
            PDF detallado
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#D9E2EC] bg-white text-sm font-semibold text-[#4E6A8F] hover:bg-[#F6F8FB] transition-colors"
          >
            <Printer size={16} strokeWidth={1.75} /> Imprimir vista
          </button>
        </div>
      </div>

      {/* Loading global */}
      {isAnyLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-500" />
        </div>
      )}

      {!isAnyLoading && (
        <>
          {/* KPIs */}
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

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Por estado */}
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

            {/* Por proyecto */}
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

          {/* Distribución por prioridad + resumen por proyecto */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Pie por prioridad */}
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

            {/* Tabla resumen por proyecto */}
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
    </div>
  );
}
