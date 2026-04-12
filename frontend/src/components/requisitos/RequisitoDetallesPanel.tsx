"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Link2,
  Loader2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Requisito } from "@/types";
import { useUpdateRequirement } from "@/hooks/useRequirements";
import { useProjects } from "@/hooks/useProjects";
import { useRequirementStatuses } from "@/hooks/useRequirementStatuses";
import { useRequirementCategories } from "@/hooks/useRequirementCategories";
import { useUserLookup } from "@/hooks/useUsers";
import { displayEstado, prioridadConfig } from "@/lib/requisitos-display";
import type { BadgeVariant } from "@/lib/requisitos-display";
import {
  JIRA_LOZENGE,
  lozengeVariantForEstadoSlug,
  initialsFromName,
} from "@/lib/jira-lozenge";
import { JiraMenuDropdown, JiraUserMenuDropdown, type JiraMenuItem } from "./jira-dropdown";

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[13px] leading-snug text-[#5E6C84]">{label}</div>
      <div className="min-w-0 text-[14px] leading-relaxed text-[#172B4D]">{children}</div>
    </div>
  );
}

function Chip({ label, variant }: { label: string; variant: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded px-2 py-0.5 text-[12px] font-semibold leading-tight",
        JIRA_LOZENGE[variant],
      )}
    >
      {label}
    </span>
  );
}

export function RequisitoDetallesPanel({
  req,
  requirementId,
  canWrite,
}: {
  req: Requisito;
  requirementId: number;
  canWrite: boolean;
}) {
  const [detallesOpen, setDetallesOpen] = useState(true);
  const updateMutation = useUpdateRequirement();
  const pending = updateMutation.isPending;
  const { data: proyectos = [] } = useProjects();
  const { data: statuses = [], isLoading: loadingSt } = useRequirementStatuses(req.proyectoId);
  const { data: categories = [], isLoading: loadingCat } = useRequirementCategories(req.proyectoId);
  const { data: usuarios = [] } = useUserLookup();

  const ed = displayEstado(req);

  const solicitanteIdStr = useMemo(() => {
    const u = usuarios.find((x) => x.nombre === req.solicitante);
    return u ? String(u.id) : "";
  }, [usuarios, req.solicitante]);

  const responsableIdStr = useMemo(() => {
    const u = usuarios.find((x) => x.nombre === req.responsable);
    return u ? String(u.id) : "";
  }, [usuarios, req.responsable]);

  const statusValue = useMemo(() => {
    if (req.statusDefId != null) return String(req.statusDefId);
    const bySlug = statuses.find((s) => s.slug === req.estado);
    return bySlug ? String(bySlug.id) : "";
  }, [req.statusDefId, req.estado, statuses]);

  const selectedStatusSlug = useMemo(() => {
    const row = statuses.find((s) => String(s.id) === statusValue);
    return row?.slug ?? req.estado;
  }, [statuses, statusValue, req.estado]);

  const statusMenuItems: JiraMenuItem[] = useMemo(
    () =>
      statuses.map((s) => ({
        value: String(s.id),
        label: s.nombre,
        lozengeClass: JIRA_LOZENGE[lozengeVariantForEstadoSlug(s.slug)],
      })),
    [statuses],
  );

  const prioridadItems: JiraMenuItem[] = useMemo(
    () =>
      (
        [
          ["critica", "Crítica"],
          ["alta", "Alta"],
          ["media", "Media"],
          ["baja", "Baja"],
        ] as const
      ).map(([v, l]) => ({
        value: v,
        label: l,
        lozengeClass: JIRA_LOZENGE[prioridadConfig[v].variant],
      })),
    [],
  );

  const tipoItems: JiraMenuItem[] = useMemo(
    () => [
      {
        value: "funcional",
        label: "Funcional",
        lozengeClass: JIRA_LOZENGE.default,
      },
      {
        value: "no_funcional",
        label: "No funcional",
        lozengeClass: JIRA_LOZENGE.purple,
      },
    ],
    [],
  );

  const proyectoItems: JiraMenuItem[] = useMemo(
    () => proyectos.map((p) => ({ value: String(p.id), label: p.nombre })),
    [proyectos],
  );

  const categoriaItems: JiraMenuItem[] = useMemo(() => {
    const base: JiraMenuItem[] = [{ value: "", label: "Sin categoría" }];
    return base.concat(categories.map((c) => ({ value: String(c.id), label: c.nombre })));
  }, [categories]);

  const esfuerzoItems: JiraMenuItem[] = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((n) => ({
        value: String(n),
        label: String(n),
      })),
    [],
  );

  const categoryValue = useMemo(() => {
    if (req.categoryDefId != null && req.categoryDefId > 0) return String(req.categoryDefId);
    return "";
  }, [req.categoryDefId]);

  const userMenuItems = useMemo(() => {
    const base = [{ value: "", label: "Sin asignar" }];
    return base.concat(usuarios.map((u) => ({ value: String(u.id), label: u.nombre })));
  }, [usuarios]);

  const solicitanteUser = useMemo(
    () => (solicitanteIdStr ? usuarios.find((u) => String(u.id) === solicitanteIdStr) : undefined),
    [usuarios, solicitanteIdStr],
  );
  const responsableUser = useMemo(
    () => (responsableIdStr ? usuarios.find((u) => String(u.id) === responsableIdStr) : undefined),
    [usuarios, responsableIdStr],
  );

  const patch = async (dto: Record<string, unknown>) => {
    try {
      await updateMutation.mutateAsync({
        id: requirementId,
        ...dto,
      } as { id: number } & Record<string, unknown>);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "No se pudo guardar el cambio.");
    }
  };

  const copyEnlace = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  };

  const catNombre = req.categoriaNombre || req.categoria || "";

  return (
    <div className="rounded-md border border-[#DCDFE4] bg-white shadow-[0_1px_2px_rgba(9,30,66,0.08)]">
      {/* Fila superior: estado + acción rápida */}
      <div className="flex items-stretch gap-2 border-b border-[#DCDFE4] px-3 py-2.5">
        <div className="min-w-0 flex-1">
          {canWrite ? (
            <JiraMenuDropdown
              variant="lozenge"
              ariaLabel="Estado del requisito"
              value={statusValue}
              items={statusMenuItems}
              disabled={loadingSt || statuses.length === 0}
              pending={pending}
              onChange={(v) => {
                if (!v) return;
                void patch({ statusDefId: Number(v) });
              }}
            />
          ) : (
            <div
              className={cn(
                "inline-flex h-8 w-full items-center rounded-md border border-[#DCDFE4] px-2.5 text-[13px] font-semibold",
                JIRA_LOZENGE[lozengeVariantForEstadoSlug(selectedStatusSlug)],
              )}
            >
              <span className="truncate">{ed.label}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => void copyEnlace()}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#DCDFE4] bg-white text-[#5E6C84] transition-colors hover:bg-[#F1F2F4] hover:text-[#172B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#388BFF]"
          title="Copiar enlace"
          aria-label="Copiar enlace al portapapeles"
        >
          <Link2 size={16} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* Título compacto tipo Jira */}
      <div className="border-b border-[#DCDFE4] bg-[#FAFBFC] px-3 py-2.5">
        <div className="rounded-md border border-[#DCDFE4] bg-white px-2.5 py-2 text-left shadow-sm">
          <span className="font-mono text-[12px] font-semibold text-[#0C66E4]">{req.codigo}</span>
          <span className="mx-1.5 text-[#DCDFE4]" aria-hidden>
            ·
          </span>
          <span className="text-[13px] font-medium leading-snug text-[#172B4D] line-clamp-3">
            {req.titulo}
          </span>
        </div>
      </div>

      {/* Encabezado Detalles (colapsable) */}
      <div className="flex items-stretch border-b border-[#DCDFE4]">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-[#F1F2F4]"
          onClick={() => setDetallesOpen((o) => !o)}
          aria-expanded={detallesOpen}
        >
          {detallesOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[#5E6C84]" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-[#5E6C84]" aria-hidden />
          )}
          <span className="min-w-0 flex-1 text-[15px] font-semibold leading-tight text-[#172B4D]">
            Detalles
          </span>
          {pending && (
            <Loader2 size={14} className="shrink-0 animate-spin text-[#0C66E4]" aria-hidden />
          )}
        </button>
        <button
          type="button"
          className="flex w-10 shrink-0 items-center justify-center text-[#5E6C84] transition-colors hover:bg-[#F1F2F4] hover:text-[#172B4D] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#388BFF]"
          title="Preferencias del panel"
          aria-label="Preferencias del panel"
          onClick={(e) => e.preventDefault()}
        >
          <Settings size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {detallesOpen && (
        <div className="px-3 py-4">
          <div className="flex flex-col gap-5">
            {/* Etiquetas (chips) */}
            <DetailField label="Etiquetas">
              <div className="flex flex-wrap gap-1.5">
                <Chip label={ed.label} variant={lozengeVariantForEstadoSlug(selectedStatusSlug)} />
                <Chip
                  label={prioridadConfig[req.prioridad]?.label ?? req.prioridad}
                  variant={prioridadConfig[req.prioridad]?.variant ?? "gray"}
                />
                <Chip
                  label={req.tipo === "funcional" ? "Funcional" : "No funcional"}
                  variant={req.tipo === "funcional" ? "default" : "purple"}
                />
                {catNombre ? (
                  <Chip label={catNombre} variant="gray" />
                ) : null}
              </div>
            </DetailField>

            <DetailField label="Prioridad">
              {canWrite ? (
                <JiraMenuDropdown
                  variant="lozenge"
                  ariaLabel="Prioridad"
                  value={req.prioridad}
                  items={prioridadItems}
                  pending={pending}
                  onChange={(v) => void patch({ prioridad: v })}
                />
              ) : (
                <span className="font-medium">{prioridadConfig[req.prioridad]?.label}</span>
              )}
            </DetailField>

            <DetailField label="Tipo">
              {canWrite ? (
                <JiraMenuDropdown
                  variant="lozenge"
                  ariaLabel="Tipo de requisito"
                  value={req.tipo}
                  items={tipoItems}
                  pending={pending}
                  onChange={(v) => void patch({ tipo: v })}
                />
              ) : (
                <span className="font-medium">
                  {req.tipo === "funcional" ? "Funcional" : "No funcional"}
                </span>
              )}
            </DetailField>

            <DetailField label="Proyecto">
              {canWrite ? (
                <JiraMenuDropdown
                  variant="neutral"
                  ariaLabel="Proyecto"
                  value={String(req.proyectoId)}
                  items={proyectoItems}
                  pending={pending}
                  onChange={(v) => void patch({ projectId: Number(v) })}
                />
              ) : (
                <Link
                  href="/proyectos"
                  className="inline-flex font-medium text-[#0C66E4] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#388BFF] rounded-sm"
                >
                  {req.proyectoNombre || "—"}
                </Link>
              )}
            </DetailField>

            <DetailField label="Categoría">
              {canWrite ? (
                <JiraMenuDropdown
                  variant="neutral"
                  ariaLabel="Categoría"
                  value={categoryValue}
                  items={categoriaItems}
                  disabled={loadingCat}
                  pending={pending}
                  onChange={(v) => void patch({ categoryDefId: v ? Number(v) : 0 })}
                />
              ) : (
                <span>{catNombre || "Ninguno"}</span>
              )}
            </DetailField>

            <DetailField label="Estimación (1–5)">
              {canWrite ? (
                <JiraMenuDropdown
                  variant="neutral"
                  ariaLabel="Estimación"
                  value={String(req.esfuerzo ?? 3)}
                  items={esfuerzoItems}
                  pending={pending}
                  onChange={(v) => void patch({ esfuerzo: Number(v) })}
                />
              ) : (
                <span className="font-medium">{req.esfuerzo ?? "—"}</span>
              )}
            </DetailField>

            <DetailField label="Persona asignada">
              {canWrite ? (
                <JiraUserMenuDropdown
                  ariaLabel="Persona asignada"
                  value={responsableIdStr}
                  items={userMenuItems}
                  pending={pending}
                  initials={
                    responsableUser ? initialsFromName(responsableUser.nombre) : ""
                  }
                  avatarClassName={
                    responsableUser
                      ? "bg-[#0C66E4] text-white"
                      : "bg-[#EBECF0] text-[#5E6C84]"
                  }
                  onChange={(v) => void patch({ responsableId: v ? Number(v) : null })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  {req.responsable ? (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0C66E4] text-[10px] font-bold text-white">
                        {initialsFromName(req.responsable)}
                      </span>
                      <span className="min-w-0 truncate font-medium">{req.responsable}</span>
                    </>
                  ) : (
                    <span className="text-[13px] text-[#5E6C84]">Ninguno</span>
                  )}
                </div>
              )}
            </DetailField>

            <DetailField label="Informador">
              {canWrite ? (
                <JiraUserMenuDropdown
                  ariaLabel="Informador"
                  value={solicitanteIdStr}
                  items={userMenuItems}
                  pending={pending}
                  initials={
                    solicitanteUser ? initialsFromName(solicitanteUser.nombre) : ""
                  }
                  avatarClassName={
                    solicitanteUser
                      ? "bg-[#1D7A8C] text-white"
                      : "bg-[#EBECF0] text-[#5E6C84]"
                  }
                  onChange={(v) => void patch({ solicitanteId: v ? Number(v) : null })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  {req.solicitante ? (
                    <>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1D7A8C] text-[10px] font-bold text-white">
                        {initialsFromName(req.solicitante)}
                      </span>
                      <span className="min-w-0 truncate font-medium">{req.solicitante}</span>
                    </>
                  ) : (
                    <span className="text-[13px] text-[#5E6C84]">Ninguno</span>
                  )}
                </div>
              )}
            </DetailField>

            <DetailField label="Versión actual">
              <span className="font-mono text-[13px] text-[#42526E]">v{req.version}</span>
            </DetailField>

            <DetailField label="Creado">
              <span>
                {req.creadoEn
                  ? new Date(req.creadoEn).toLocaleDateString("es-DO", { dateStyle: "medium" })
                  : "—"}
              </span>
            </DetailField>

            <DetailField label="Actualizado">
              <span>
                {req.actualizadoEn
                  ? new Date(req.actualizadoEn).toLocaleDateString("es-DO", { dateStyle: "medium" })
                  : "—"}
              </span>
            </DetailField>
          </div>
        </div>
      )}
    </div>
  );
}
