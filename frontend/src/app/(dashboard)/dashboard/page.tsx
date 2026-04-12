"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { FileText, Clock, CheckCircle, AlertCircle, Plus, ArrowRight, Zap, ArrowUpDown, BarChart3, FolderKanban } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { canWriteCoreEntities } from "@/lib/permissions";
import { useDashboardStats, useMonthlyProgress } from "@/hooks/useReports";
import { useRequirements } from "@/hooks/useRequirements";

const estadoBadge: Record<string, { label: string; variant: "success" | "warning" | "default" | "gray" | "danger" }> = {
  aprobado:    { label: "Aprobado",    variant: "success"  },
  en_revision: { label: "En Revisión", variant: "warning"  },
  borrador:    { label: "Borrador",    variant: "gray"     },
  validado:    { label: "Validado",    variant: "default"  },
  rechazado:   { label: "Rechazado",   variant: "danger"   },
};

const accesosRapidos = [
  { label: "Añadir Requisito", icon: Plus,        href: "/requisitos",   color: "bg-white text-[#4E6A8F] border-[#E5EAF1] hover:bg-[#F6F8FB]" },
  { label: "Priorizar",        icon: ArrowUpDown, href: "/priorizacion", color: "bg-white text-[#4E6A8F] border-[#E5EAF1] hover:bg-[#F6F8FB]" },
  { label: "Validar",          icon: CheckCircle, href: "/validacion",   color: "bg-white text-[#4E6A8F] border-[#E5EAF1] hover:bg-[#F6F8FB]" },
  { label: "Reportes",         icon: BarChart3,   href: "/reportes",     color: "bg-white text-[#4E6A8F] border-[#E5EAF1] hover:bg-[#F6F8FB]" },
];


/** Colores semánticos según guía de diseño (cards de métricas). */
function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: "total" | "pendiente" | "aprobado" | "revision" }) {
  const bg =
    tone === "total"
      ? "bg-[#2F80D1]"
      : tone === "pendiente"
        ? "bg-[#E9BC62]"
        : tone === "aprobado"
          ? "bg-[#6BB58E]"
          : "bg-[#E45469]";
  return (
    <div className={`${bg} rounded-[14px] min-h-[92px] p-4 text-white shadow-[0_1px_4px_rgba(15,23,42,0.08)]`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-white/85 leading-tight">{label}</p>
          <p className="text-3xl font-bold mt-1 leading-none tracking-tight">{value}</p>
        </div>
        <div className="bg-white/20 p-2 rounded-xl shrink-0">
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const canWrite = canWriteCoreEntities(user?.rol);
  const { data: stats } = useDashboardStats();
  const { data: progressData = [] } = useMonthlyProgress();
  const { data: requisitos } = useRequirements();

  const ultimos = (requisitos ?? []).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#4B5563]">
            ¡Bienvenido, {user?.nombre ?? "Usuario"}!
          </h1>
          <p className="text-sm text-[#7A8798] mt-0.5 capitalize">
            {user?.rol} · {new Date().toLocaleDateString("es-DO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {canWrite && (
          <Link href="/requisitos">
            <Button className="w-full sm:w-auto"><Plus size={15} /> Añadir Requisito</Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Requisitos Totales" value={stats?.totalRequisitos ?? 0}     icon={FileText}   tone="total" />
        <StatCard label="Req. Pendientes"    value={stats?.requisitosPendientes ?? 0} icon={Clock}       tone="pendiente" />
        <StatCard label="Req. Aprobados"     value={stats?.requisitosAprobados ?? 0}  icon={CheckCircle} tone="aprobado" />
        <StatCard label="En Revisión"        value={stats?.requisitosEnRevision ?? 0} icon={AlertCircle} tone="revision" />
      </div>

      {/* Gráfico + Últimos */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3">
          <CardHeader>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <FolderKanban size={16} className="text-blue-600" /> Progreso Mensual (últimos 6 meses)
            </h2>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={progressData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradApr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }} />
                <Area type="monotone" dataKey="requisitos" name="Registrados" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradReq)" dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }} />
                <Area type="monotone" dataKey="aprobados"  name="Aprobados"   stroke="#10b981" strokeWidth={2.5} fill="url(#gradApr)" dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-1 pl-1">
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> Registrados</span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-0.5 bg-green-500 inline-block rounded" /> Aprobados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <FileText size={16} className="text-blue-600" /> Últimos Añadidos
            </h2>
            <Link href="/requisitos" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={11} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {ultimos.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No hay requisitos aún</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {ultimos.map((req) => (
                  <div key={req.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/80 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-gray-400 font-mono">{req.codigo}</p>
                      <p className="text-sm text-gray-700 truncate font-medium">{req.titulo}</p>
                    </div>
                    <div className="ml-3 shrink-0">
                      <Badge variant={estadoBadge[req.estado]?.variant ?? "gray"} className="text-[10px]">
                        {estadoBadge[req.estado]?.label ?? req.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <Zap size={16} className="text-yellow-500" /> Accesos Rápidos
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {accesosRapidos.map(({ label, icon: Icon, href, color }) => (
              <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 font-medium text-sm transition-colors shadow-sm ${color}`}>
                <Icon size={18} /> {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
