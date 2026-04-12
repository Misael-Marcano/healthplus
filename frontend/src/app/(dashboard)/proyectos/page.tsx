"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, FolderKanban, Users, FileText, CheckCircle,
  Eye, Pencil, CalendarDays, Loader2, Trash2,
} from "lucide-react";
import type { Proyecto } from "@/types";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProjects";
import { useUserLookup } from "@/hooks/useUsers";
import { useAuth } from "@/context/AuthContext";
import { canWriteCoreEntities } from "@/lib/permissions";

const estadoProyectoConfig: Record<Proyecto["estado"], { label: string; variant: "success" | "warning" | "default" | "gray" | "danger" | "purple" }> = {
  activo:     { label: "Activo",     variant: "success" },
  pausado:    { label: "Pausado",    variant: "warning" },
  completado: { label: "Completado", variant: "default" },
  cancelado:  { label: "Cancelado",  variant: "danger"  },
};

const schema = z.object({
  nombre:        z.string().min(1, "Nombre requerido"),
  descripcion:   z.string().optional(),
  responsableId: z.string().optional(),
  estado:        z.enum(["activo", "pausado", "completado", "cancelado"]),
  fechaInicio:   z.string().optional(),
  fechaFin:      z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProyectosPage() {
  const [modalForm, setModalForm] = useState(false);
  const [editando, setEditando] = useState<Proyecto | null>(null);
  const [detalle, setDetalle] = useState<Proyecto | null>(null);
  const [vista, setVista] = useState<"tarjetas" | "lista">("tarjetas");

  const { user } = useAuth();
  const canWrite = canWriteCoreEntities(user?.rol);

  const { data: proyectos = [], isLoading } = useProjects();
  const { data: usuarios = [] } = useUserLookup();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    setEditando(null);
    reset({ nombre: "", descripcion: "", responsableId: "", estado: "activo", fechaInicio: "", fechaFin: "" });
    setModalForm(true);
  };

  const openEdit = (p: Proyecto) => {
    setEditando(p);
    // Find user by nombre to get their ID
    const responsableUser = usuarios.find(u => u.nombre === p.responsable);
    reset({
      nombre:        p.nombre,
      descripcion:   p.descripcion ?? "",
      responsableId: responsableUser ? String(responsableUser.id) : "",
      estado:        p.estado,
      fechaInicio:   p.fechaInicio ?? "",
      fechaFin:      p.fechaFin ?? "",
    });
    setModalForm(true);
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      nombre:        values.nombre,
      descripcion:   values.descripcion,
      estado:        values.estado,
      fechaInicio:   values.fechaInicio || undefined,
      fechaFin:      values.fechaFin || undefined,
      responsableId: values.responsableId ? Number(values.responsableId) : undefined,
    };
    if (editando) {
      updateMutation.mutate({ id: editando.id, ...payload }, { onSuccess: () => { setModalForm(false); setEditando(null); } });
    } else {
      createMutation.mutate(payload, { onSuccess: () => { setModalForm(false); reset(); } });
    }
  };

  const handleDelete = (p: Proyecto) => {
    if (!confirm(`¿Eliminar el proyecto "${p.nombre}"?`)) return;
    deleteMutation.mutate(p.id);
  };

  const activos         = proyectos.filter(p => p.estado === "activo").length;
  const totalReq        = proyectos.reduce((a, p) => a + (p.totalRequisitos ?? 0), 0);
  const totalAprobados  = proyectos.reduce((a, p) => a + (p.requisitosAprobados ?? 0), 0);
  const isPending       = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Proyectos</h1>
            <p className="text-sm text-gray-400">{proyectos.length} proyectos registrados</p>
          </div>
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setVista("tarjetas")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${vista === "tarjetas" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setVista("lista")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${vista === "lista" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              >
                Lista
              </button>
            </div>
            {canWrite && (
              <Button onClick={openCreate}>
                <Plus size={15} /> Nuevo Proyecto
              </Button>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Proyectos activos", value: activos,       icon: FolderKanban, color: "bg-blue-500"   },
            { label: "Total requisitos",  value: totalReq,      icon: FileText,     color: "bg-orange-400" },
            { label: "Req. en avance",     value: totalAprobados, icon: CheckCircle, color: "bg-green-500"  },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-xl p-4 text-white shadow-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-white/80">{s.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <s.icon size={18} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        )}

        {/* Vista Tarjetas */}
        {!isLoading && vista === "tarjetas" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {proyectos.length === 0 && (
              <p className="col-span-3 text-center text-sm text-gray-400 py-10">No hay proyectos registrados.</p>
            )}
            {proyectos.map((p) => {
              const total  = p.totalRequisitos ?? 0;
              const aprobados = p.requisitosAprobados ?? 0;
              const avance = total > 0 ? Math.round((aprobados / total) * 100) : 0;
              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <FolderKanban size={20} className="text-blue-600" />
                      </div>
                      <Badge variant={estadoProyectoConfig[p.estado].variant}>
                        {estadoProyectoConfig[p.estado].label}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-sm leading-snug">{p.nombre}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.descripcion}</p>

                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{aprobados}/{total} avanzados</span>
                        <span className="font-semibold text-gray-700">{avance}%</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight">Aprobado, implementado o cerrado</p>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${avance}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Users size={12} />
                        {p.responsable}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setDetalle(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye size={14} />
                        </button>
                        {canWrite && (
                          <>
                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Vista Lista */}
        {!isLoading && vista === "lista" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Proyecto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Responsable</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Avance</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {proyectos.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No hay proyectos registrados.</td></tr>
                  ) : (
                    proyectos.map((p) => {
                      const total = p.totalRequisitos ?? 0;
                      const avance = total > 0 ? Math.round(((p.requisitosAprobados ?? 0) / total) * 100) : 0;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{p.nombre}</p>
                            <p className="text-xs text-gray-400">{total} requisitos</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">{p.responsable}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${avance}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{avance}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <Badge variant={estadoProyectoConfig[p.estado].variant}>
                              {estadoProyectoConfig[p.estado].label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => setDetalle(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Eye size={14} /></button>
                              {canWrite && (
                                <>
                                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors"><Pencil size={14} /></button>
                                  <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Modal Crear / Editar */}
      <Modal
        open={modalForm}
        onClose={() => { setModalForm(false); setEditando(null); }}
        title={editando ? "Editar Proyecto" : "Nuevo Proyecto"}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre del proyecto *"
            placeholder="Nombre del proyecto"
            id="nombre"
            error={errors.nombre?.message}
            {...register("nombre")}
          />
          <Textarea
            label="Descripción"
            placeholder="Descripción del proyecto..."
            id="desc"
            {...register("descripcion")}
          />
          <Select
            label="Responsable"
            id="responsableId"
            placeholder="Sin asignar"
            options={usuarios.map(u => ({ value: String(u.id), label: u.nombre }))}
            {...register("responsableId")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de inicio *"
              type="date"
              id="fechaInicio"
              error={errors.fechaInicio?.message}
              {...register("fechaInicio")}
            />
            <Input
              label="Fecha estimada de fin"
              type="date"
              id="fechaFin"
              {...register("fechaFin")}
            />
          </div>
          {editando && (
            <Select
              label="Estado"
              id="estado"
              options={[
                { value: "activo",     label: "Activo"     },
                { value: "pausado",    label: "Pausado"    },
                { value: "completado", label: "Completado" },
                { value: "cancelado",  label: "Cancelado"  },
              ]}
              {...register("estado")}
            />
          )}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => { setModalForm(false); setEditando(null); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {editando ? "Guardar cambios" : "Crear Proyecto"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle */}
      <Modal open={!!detalle} onClose={() => setDetalle(null)} title="Detalle del Proyecto" size="md">
        {detalle && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <FolderKanban size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{detalle.nombre}</h3>
                <Badge variant={estadoProyectoConfig[detalle.estado].variant}>
                  {estadoProyectoConfig[detalle.estado].label}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600">{detalle.descripcion}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Responsable</p>
                <p className="font-medium text-gray-800 mt-0.5">{detalle.responsable}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Fecha inicio</p>
                <p className="font-medium text-gray-800 mt-0.5 flex items-center gap-1">
                  <CalendarDays size={12} /> {detalle.fechaInicio}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Requisitos</p>
                <p className="font-medium text-gray-800 mt-0.5">{detalle.totalRequisitos ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">En avance</p>
                <p className="font-medium text-gray-800 mt-0.5">{detalle.requisitosAprobados ?? 0}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Aprobado, implementado o cerrado</p>
              </div>
            </div>

            {(detalle.totalRequisitos ?? 0) > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progreso</span>
                  <span className="font-semibold">
                    {Math.round(((detalle.requisitosAprobados ?? 0) / (detalle.totalRequisitos ?? 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${Math.round(((detalle.requisitosAprobados ?? 0) / (detalle.totalRequisitos ?? 1)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setDetalle(null)}>Cerrar</Button>
              {canWrite && (
                <Button onClick={() => { setDetalle(null); openEdit(detalle); }}>
                  <Pencil size={14} /> Editar
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
