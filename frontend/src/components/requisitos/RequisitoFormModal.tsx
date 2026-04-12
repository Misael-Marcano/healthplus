"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip } from "lucide-react";
import {
  useCreateRequirement,
  useUpdateRequirement,
} from "@/hooks/useRequirements";
import { useRequirementStatuses } from "@/hooks/useRequirementStatuses";
import { useRequirementCategories } from "@/hooks/useRequirementCategories";
import { useProjects } from "@/hooks/useProjects";
import { useUserLookup } from "@/hooks/useUsers";
import { canWriteCoreEntities } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { useUploadRequirementAttachment } from "@/hooks/useRequirementAttachments";
import type { Requisito } from "@/types";
import { formatBytes } from "@/lib/requisitos-display";

const reqSchema = z.object({
  titulo: z.string().min(3, "Mínimo 3 caracteres"),
  descripcion: z.string().min(10, "Mínimo 10 caracteres"),
  projectId: z.string().min(1, "Selecciona un proyecto"),
  tipo: z.enum(["funcional", "no_funcional"]),
  categoryDefId: z.string().optional(),
  prioridad: z.enum(["critica", "alta", "media", "baja"]),
  statusDefId: z.string().min(1, "Selecciona un estado"),
  criteriosAceptacion: z.string().optional(),
  solicitanteId: z.string().optional(),
  responsableId: z.string().optional(),
});

type ReqForm = z.infer<typeof reqSchema>;

export interface RequisitoFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  /** Requisito actual (obligatorio si mode === "edit") */
  requirement: Requisito | null;
}

export function RequisitoFormModal({
  open,
  onClose,
  mode,
  requirement,
}: RequisitoFormModalProps) {
  const { user } = useAuth();
  const canWrite = canWriteCoreEntities(user?.rol);
  const [archivosPendientes, setArchivosPendientes] = useState<File[]>([]);

  const { data: proyectos = [] } = useProjects();
  const { data: usuarios = [] } = useUserLookup();
  const createMutation = useCreateRequirement();
  const updateMutation = useUpdateRequirement();
  const uploadAttachmentMutation = useUploadRequirementAttachment();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReqForm>({
    resolver: zodResolver(reqSchema),
    defaultValues: {
      tipo: "funcional",
      prioridad: "media",
      statusDefId: "",
      categoryDefId: "",
    },
  });

  const watchProjectId = watch("projectId");
  const { data: statusesForm = [], isLoading: loadingStatusesForm } =
    useRequirementStatuses(watchProjectId ? Number(watchProjectId) : undefined);
  const { data: categoriesForm = [], isLoading: loadingCategoriesForm } =
    useRequirementCategories(watchProjectId ? Number(watchProjectId) : undefined);

  const isEdit = mode === "edit" && requirement != null;

  useEffect(() => {
    if (!open) return;
    if (mode === "create") {
      setArchivosPendientes([]);
      reset({
        tipo: "funcional",
        prioridad: "media",
        statusDefId: "",
        categoryDefId: "",
        projectId: "",
      });
    }
  }, [open, mode, reset]);

  useEffect(() => {
    if (!open || mode !== "edit" || !requirement) return;
    setArchivosPendientes([]);
    const solicitanteUser = usuarios.find((u) => u.nombre === requirement.solicitante);
    const responsableUser = usuarios.find((u) => u.nombre === requirement.responsable);
    reset({
      titulo: requirement.titulo,
      descripcion: requirement.descripcion,
      projectId: String(requirement.proyectoId ?? ""),
      tipo: requirement.tipo,
      categoryDefId:
        requirement.categoryDefId != null ? String(requirement.categoryDefId) : "",
      prioridad: requirement.prioridad,
      statusDefId: requirement.statusDefId != null ? String(requirement.statusDefId) : "",
      criteriosAceptacion: requirement.criteriosAceptacion ?? "",
      solicitanteId: solicitanteUser ? String(solicitanteUser.id) : "",
      responsableId: responsableUser ? String(responsableUser.id) : "",
    });
  }, [open, mode, requirement?.id, usuarios, reset, requirement]);

  useEffect(() => {
    if (!open || isEdit || !watchProjectId || loadingStatusesForm) return;
    if (statusesForm.length === 0) return;
    const current = watch("statusDefId");
    if (current && statusesForm.some((s) => String(s.id) === current)) return;
    const borrador = statusesForm.find((s) => s.slug === "borrador") ?? statusesForm[0];
    setValue("statusDefId", String(borrador.id));
  }, [open, isEdit, watchProjectId, statusesForm, loadingStatusesForm, setValue, watch]);

  useEffect(() => {
    if (!open || !isEdit || !requirement || !watchProjectId || loadingStatusesForm) return;
    if (statusesForm.length === 0) return;
    const cur = watch("statusDefId");
    if (cur) return;
    const match = statusesForm.find((s) => s.slug === requirement.estado);
    if (match) setValue("statusDefId", String(match.id));
  }, [
    open,
    isEdit,
    requirement,
    watchProjectId,
    statusesForm,
    loadingStatusesForm,
    setValue,
    watch,
  ]);

  useEffect(() => {
    if (!open || !isEdit || !requirement || !watchProjectId || loadingCategoriesForm) return;
    if (categoriesForm.length === 0) return;
    const cur = watch("categoryDefId");
    if (cur) return;
    const slug = requirement.categoria?.trim();
    if (!slug) return;
    const match = categoriesForm.find((c) => c.slug === slug);
    if (match) setValue("categoryDefId", String(match.id));
  }, [
    open,
    isEdit,
    requirement,
    watchProjectId,
    categoriesForm,
    loadingCategoriesForm,
    setValue,
    watch,
  ]);

  const onSubmit = async (data: ReqForm) => {
    const payload = {
      titulo: data.titulo,
      descripcion: data.descripcion,
      projectId: Number(data.projectId),
      tipo: data.tipo,
      categoryDefId: Number(data.categoryDefId) || 0,
      prioridad: data.prioridad,
      statusDefId: Number(data.statusDefId),
      criteriosAceptacion: data.criteriosAceptacion || undefined,
      solicitanteId: data.solicitanteId ? Number(data.solicitanteId) : undefined,
      responsableId: data.responsableId ? Number(data.responsableId) : undefined,
    };
    try {
      let requirementId: number;
      if (isEdit && requirement) {
        await updateMutation.mutateAsync({ id: requirement.id, ...payload });
        requirementId = requirement.id;
      } else {
        const created = await createMutation.mutateAsync(payload);
        requirementId = (created as { id: number }).id;
      }
      if (archivosPendientes.length > 0 && requirementId) {
        for (const file of archivosPendientes) {
          await uploadAttachmentMutation.mutateAsync({ requirementId, file });
        }
      }
      setArchivosPendientes([]);
      reset();
      onClose();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "No se pudo guardar el requisito o los adjuntos.");
    }
  };

  const title =
    mode === "edit" && requirement
      ? `Editar ${requirement.codigo}`
      : "Nuevo Requisito";

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Título *"
              id="titulo"
              error={errors.titulo?.message}
              {...register("titulo")}
            />
          </div>
          <Select
            label="Proyecto *"
            id="projectId"
            error={errors.projectId?.message}
            placeholder="Seleccionar proyecto"
            options={proyectos.map((p) => ({ value: String(p.id), label: p.nombre }))}
            {...register("projectId")}
          />
          <Select
            label="Tipo *"
            id="tipo"
            options={[
              { value: "funcional", label: "Funcional" },
              { value: "no_funcional", label: "No Funcional" },
            ]}
            {...register("tipo")}
          />
        </div>
        <Textarea
          label="Descripción *"
          id="descripcion"
          rows={3}
          error={errors.descripcion?.message}
          {...register("descripcion")}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Prioridad *"
            id="prioridad"
            options={[
              { value: "critica", label: "Crítica" },
              { value: "alta", label: "Alta" },
              { value: "media", label: "Media" },
              { value: "baja", label: "Baja" },
            ]}
            {...register("prioridad")}
          />
          <Select
            label="Estado *"
            id="statusDefId"
            error={errors.statusDefId?.message}
            placeholder={
              !watchProjectId ? "Primero elige proyecto" : loadingStatusesForm ? "Cargando…" : "Seleccionar"
            }
            options={statusesForm.map((s) => ({ value: String(s.id), label: s.nombre }))}
            disabled={!watchProjectId || loadingStatusesForm}
            {...register("statusDefId")}
          />
          <Select
            label="Categoría"
            id="categoryDefId"
            placeholder={
              !watchProjectId ? "Primero elige proyecto" : loadingCategoriesForm ? "Cargando…" : "Sin categoría"
            }
            options={[
              { value: "", label: "Sin categoría" },
              ...categoriesForm.map((c) => ({ value: String(c.id), label: c.nombre })),
            ]}
            disabled={!watchProjectId || loadingCategoriesForm}
            {...register("categoryDefId")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Solicitante"
            id="solicitanteId"
            placeholder="Sin asignar"
            options={usuarios.map((u) => ({ value: String(u.id), label: u.nombre }))}
            {...register("solicitanteId")}
          />
          <Select
            label="Responsable TI"
            id="responsableId"
            placeholder="Sin asignar"
            options={usuarios.map((u) => ({ value: String(u.id), label: u.nombre }))}
            {...register("responsableId")}
          />
        </div>
        <Textarea label="Criterios de Aceptación" id="criterios" rows={3} {...register("criteriosAceptacion")} />
        {canWrite && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3 space-y-2">
            <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
              <Paperclip size={16} className="text-gray-500" /> Adjuntos (PDF o Word)
            </p>
            <p className="text-xs text-gray-500">Máx. 10 MB por archivo. Se suben al guardar.</p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setArchivosPendientes(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700"
            />
            {archivosPendientes.length > 0 && (
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                {archivosPendientes.map((f, i) => (
                  <li key={`${f.name}-${i}`}>
                    {f.name} ({formatBytes(f.size)})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setArchivosPendientes([]);
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isSubmitting || uploadAttachmentMutation.isPending}
            disabled={!!watchProjectId && (loadingStatusesForm || loadingCategoriesForm)}
          >
            {isEdit ? "Guardar cambios" : "Crear Requisito"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
