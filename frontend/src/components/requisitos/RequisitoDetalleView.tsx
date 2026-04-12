"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  MessageSquareText,
  Paperclip,
  Pencil,
  FileText,
  History,
  ListTree,
  AlignLeft,
  CheckSquare,
} from "lucide-react";
import { useRequirement } from "@/hooks/useRequirements";
import { useRequirementVersions } from "@/hooks/useVersions";
import { useAddRequirementComment } from "@/hooks/useRequirementComments";
import {
  useUploadRequirementAttachment,
  useDeleteRequirementAttachment,
  downloadRequirementAttachment,
} from "@/hooks/useRequirementAttachments";
import { useAuth } from "@/context/AuthContext";
import { canWriteCoreEntities } from "@/lib/permissions";
import {
  displayEstado,
  prioridadConfig,
  formatBytes,
} from "@/lib/requisitos-display";
import type { Requisito } from "@/types";
import { CommentBody } from "@/components/requisitos/CommentBody";
import { CommentMentionTextarea } from "@/components/requisitos/CommentMentionTextarea";

type TabId = "actividad" | "historial" | "adjuntos";

function initials(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

/** Tarjeta contenedora estilo issue tracker (sombra suave tipo JIRA Cloud). */
function IssueCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg bg-white shadow-[0_1px_2px_rgba(9,30,66,0.08)] border border-[#DFE1E6] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-[#DFE1E6] bg-[#FAFBFC]">
      <Icon size={16} className="text-[#5E6C84] shrink-0" aria-hidden />
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#5E6C84]">
        {title}
      </h2>
    </div>
  );
}

export function RequisitoDetalleView({ requirementId }: { requirementId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const canWrite = canWriteCoreEntities(user?.rol);
  const { data: req, isLoading, isError, isFetching } = useRequirement(requirementId);
  const { data: versions = [], isLoading: loadingV } = useRequirementVersions(requirementId);
  const [tab, setTab] = useState<TabId>("actividad");
  const [nuevoComentario, setNuevoComentario] = useState("");
  const addComment = useAddRequirementComment();
  const uploadAtt = useUploadRequirementAttachment();
  const deleteAtt = useDeleteRequirementAttachment();

  const comentarios = req?.comments ?? [];
  const adjuntos = req?.attachments ?? [];
  const ed = req ? displayEstado(req) : null;

  const enviarComentario = async () => {
    const t = nuevoComentario.trim();
    if (!t || addComment.isPending) return;
    await addComment.mutateAsync({ requirementId, texto: t });
    setNuevoComentario("");
  };

  const irEditar = () => {
    router.push(`/requisitos?edit=${requirementId}`);
  };

  if (isLoading && !req) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={36} className="animate-spin text-[#0052CC]" />
        <p className="text-sm text-[#5E6C84]">Cargando requisito…</p>
      </div>
    );
  }

  if (isError || !req) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <FileText size={40} className="mx-auto text-[#DFE1E6] mb-3" />
        <h1 className="text-lg font-semibold text-[#172B4D]">No se encontró el requisito</h1>
        <p className="text-sm text-[#5E6C84] mt-1 mb-6">Puede haber sido eliminado o no tienes acceso.</p>
        <Link
          href="/requisitos"
          className="inline-flex items-center justify-center rounded font-medium px-4 min-h-10 text-sm bg-white text-[#0052CC] border border-[#DFE1E6] hover:bg-[#F4F5F7]"
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  const loadingTab =
    isFetching && (tab === "actividad" || tab === "adjuntos");

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#F7F8F9] w-full min-w-0">
      {/* Cabecera del issue — ancho completo del área de contenido (estilo Jira) */}
      <header className="bg-white border-b border-[#DFE1E6] w-full">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-transparent">
            <div className="flex items-center gap-2 min-w-0 text-sm">
              <Link
                href="/requisitos"
                className="inline-flex items-center gap-1.5 font-medium text-[#5E6C84] hover:text-[#0052CC] shrink-0"
              >
                <ArrowLeft size={16} strokeWidth={2} />
                Requisitos
              </Link>
            </div>
            {canWrite && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={irEditar}
                className="border-[#DFE1E6] bg-white hover:bg-[#F4F5F7] text-[#172B4D]"
              >
                <Pencil size={15} /> Editar
              </Button>
            )}
          </div>

          <div className="py-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5E6C84]">
              <span className="font-mono font-semibold text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded">
                {req.codigo}
              </span>
              <span className="text-[#DFE1E6]">·</span>
              <span className="truncate max-w-[min(100%,280px)]" title={req.proyectoNombre}>
                {req.proyectoNombre}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold text-[#172B4D] leading-snug tracking-tight pr-2 max-w-[min(100%,56rem)]">
              {req.titulo}
            </h1>

            <IssueMetaRow req={req} ed={ed} />
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_min(400px,28vw)] gap-6 lg:gap-8 xl:gap-10 items-start">
          {/* Columna principal — un solo panel continuo (menos cajas, más lectura tipo Jira) */}
          <div className="min-w-0">
            <IssueCard className="overflow-hidden">
              <SectionHeader icon={AlignLeft} title="Descripción" />
              <div className="px-5 sm:px-6 py-4 sm:py-5">
                <div className="prose prose-sm max-w-none text-[#172B4D] whitespace-pre-wrap leading-relaxed text-[15px]">
                  {req.descripcion}
                </div>
              </div>

              {req.criteriosAceptacion ? (
                <>
                  <SectionHeader icon={CheckSquare} title="Criterios de aceptación" />
                  <div className="px-5 sm:px-6 py-4 sm:py-5 bg-[#FAFBFC]/50">
                    <div className="text-sm text-[#172B4D] whitespace-pre-wrap leading-relaxed border-l-2 border-[#0052CC]/35 pl-4">
                      {req.criteriosAceptacion}
                    </div>
                  </div>
                </>
              ) : null}

              {/* Pestañas integradas en el mismo panel */}
              <div className="border-t border-[#DFE1E6] bg-[#FAFBFC]">
                <div
                  className="flex flex-wrap border-b border-[#DFE1E6] bg-[#FAFBFC] gap-0.5 px-2 sm:px-3 pt-1"
                  role="tablist"
                  aria-label="Secciones"
                >
                  {(
                    [
                      ["actividad", "Actividad", MessageSquareText, comentarios.length] as const,
                      ["historial", "Historial", History, versions.length] as const,
                      ["adjuntos", "Adjuntos", Paperclip, adjuntos.length] as const,
                    ]).map(([id, label, Icon, count]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className={`inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors rounded-t ${
                          tab === id
                            ? "border-[#0052CC] text-[#0052CC] bg-white shadow-[0_-1px_0_0_white]"
                            : "border-transparent text-[#5E6C84] hover:text-[#172B4D] hover:bg-white/60"
                        }`}
                      >
                        <Icon size={16} className="opacity-80 shrink-0" />
                        <span>{label}</span>
                        <span
                          className={`text-xs tabular-nums px-1.5 py-0.5 rounded ${
                            tab === id ? "bg-[#DEEBFF] text-[#0052CC]" : "bg-[#EBECF0] text-[#5E6C84]"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    ))}
                </div>

                {loadingTab && (
                  <div className="flex items-center gap-2 text-sm text-[#5E6C84] py-3 px-5 bg-white border-b border-[#DFE1E6]">
                    <Loader2 size={16} className="animate-spin text-[#0052CC]" /> Actualizando…
                  </div>
                )}

                <div className="bg-white">
                {tab === "actividad" && (
                  <div>
                    <div className="px-5 sm:px-6 py-3 border-b border-[#EBECF0] bg-white">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#5E6C84]">
                        Comentarios
                      </h2>
                    </div>
                    <div className="px-5 sm:px-6 py-4 space-y-0">
                      {comentarios.length === 0 ? (
                        <p className="text-sm text-[#5E6C84] text-center py-10 border border-dashed border-[#DFE1E6] rounded-md bg-[#FAFBFC]">
                          Aún no hay actividad. Sé el primero en comentar.
                        </p>
                      ) : (
                        <ul className="divide-y divide-[#EBECF0]">
                          {comentarios.map((c) => {
                            const propio = user?.id != null && c.autor?.id === user.id;
                            const name = c.autor?.nombre ?? "Usuario";
                            return (
                              <li key={c.id} className="flex gap-3 py-4 first:pt-0">
                                <div
                                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                    propio
                                      ? "bg-[#0052CC] text-white"
                                      : "bg-[#DFE1E6] text-[#42526E]"
                                  }`}
                                  aria-hidden
                                >
                                  {initials(name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                                    <span className="text-sm font-semibold text-[#172B4D]">
                                      {name}
                                      {propio && (
                                        <span className="ml-1.5 text-[10px] font-bold uppercase text-[#0052CC]">
                                          Tú
                                        </span>
                                      )}
                                    </span>
                                    <time
                                      className="text-xs text-[#5E6C84]"
                                      dateTime={c.creadoEn}
                                    >
                                      {c.creadoEn
                                        ? new Date(c.creadoEn).toLocaleString("es-DO", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                          })
                                        : ""}
                                    </time>
                                  </div>
                                  <div className="text-sm text-[#172B4D] whitespace-pre-wrap leading-relaxed">
                                    <CommentBody texto={c.texto} />
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    {canWrite && (
                      <div className="border-t border-[#DFE1E6] bg-[#FAFBFC] px-5 sm:px-6 py-4 space-y-2">
                        <p className="text-xs text-[#5E6C84]">
                          Usa <kbd className="px-1 py-0.5 rounded border border-[#DFE1E6] bg-white font-mono text-[10px]">@</kbd> para mencionar a un usuario y notificarle en el flujo del requisito.
                        </p>
                        <CommentMentionTextarea
                          label="Añadir comentario"
                          id="com-nuevo"
                          rows={4}
                          value={nuevoComentario}
                          onChange={setNuevoComentario}
                          placeholder="Escribe un comentario… (@ para mencionar)"
                        />
                        <div className="flex justify-end pt-1">
                          <Button
                            type="button"
                            onClick={() => void enviarComentario()}
                            loading={addComment.isPending}
                            disabled={!nuevoComentario.trim()}
                            className="bg-[#0052CC] hover:bg-[#0747A6] text-white border-0"
                          >
                            Comentar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === "historial" && (
                  <div>
                    <div className="flex items-center gap-2 px-5 sm:px-6 py-3 border-b border-[#EBECF0] bg-white">
                      <ListTree size={16} className="text-[#5E6C84]" aria-hidden />
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#5E6C84]">
                        Versiones del requisito
                      </h2>
                    </div>
                    <div className="p-5 sm:p-6 space-y-3">
                      {loadingV ? (
                        <div className="flex justify-center py-12">
                          <Loader2 size={24} className="animate-spin text-[#0052CC]" />
                        </div>
                      ) : versions.length === 0 ? (
                        <p className="text-sm text-[#5E6C84] text-center py-10">
                          No hay versiones archivadas.
                        </p>
                      ) : (
                        <ol className="relative border-l-2 border-[#DFE1E6] ml-2 pl-5 space-y-4">
                          {versions.map((v) => (
                            <li key={v.id} className="relative">
                              <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#0052CC] ring-4 ring-white" />
                              <div className="rounded-md border border-[#DFE1E6] bg-white p-4 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="default" className="font-mono">
                                      v{v.version}
                                    </Badge>
                                    <span className="text-xs text-[#5E6C84]">
                                      {new Date(v.creadoEn).toLocaleDateString("es-DO", {
                                        dateStyle: "medium",
                                      })}
                                    </span>
                                  </div>
                                  {v.creadoPor && (
                                    <span className="text-xs text-[#5E6C84]">{v.creadoPor.nombre}</span>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-[#172B4D]">{v.titulo}</p>
                                <p className="text-sm text-[#42526E] mt-1">{v.descripcion}</p>
                                {v.motivoCambio && (
                                  <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                                    <span className="font-semibold">Motivo: </span>
                                    {v.motivoCambio}
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                )}

                {tab === "adjuntos" && (
                  <div>
                    <div className="flex items-center gap-2 px-5 sm:px-6 py-3 border-b border-[#EBECF0] bg-white">
                      <Paperclip size={16} className="text-[#5E6C84]" aria-hidden />
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-[#5E6C84]">
                        Archivos adjuntos
                      </h2>
                    </div>
                    <div className="p-5 sm:p-6 space-y-4">
                      <p className="text-xs text-[#5E6C84]">
                        PDF o Word asociados a este requisito.
                      </p>
                      {canWrite && (
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded font-medium text-sm cursor-pointer border border-[#DFE1E6] bg-white hover:bg-[#F4F5F7] text-[#172B4D]">
                          <Paperclip size={16} className="text-[#0052CC]" />
                          Adjuntar archivo
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={(e) => {
                              const files = Array.from(e.target.files ?? []);
                              for (const file of files) {
                                void uploadAtt.mutateAsync({ requirementId, file });
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                      {uploadAtt.isPending && (
                        <span className="text-xs text-[#5E6C84] inline-flex items-center gap-1">
                          <Loader2 size={14} className="animate-spin" /> Subiendo…
                        </span>
                      )}
                      <ul className="rounded-md border border-[#DFE1E6] divide-y divide-[#EBECF0] overflow-hidden">
                        {adjuntos.length === 0 ? (
                          <li className="px-4 py-10 text-sm text-[#5E6C84] text-center bg-[#FAFBFC]">
                            Sin adjuntos.
                          </li>
                        ) : (
                          adjuntos.map((a) => (
                            <li
                              key={a.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 hover:bg-[#FAFBFC] transition-colors"
                            >
                              <div className="min-w-0 flex items-start gap-3">
                                <div className="shrink-0 mt-0.5 w-8 h-8 rounded bg-[#EBECF0] flex items-center justify-center">
                                  <FileText size={16} className="text-[#42526E]" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-[#172B4D] truncate">
                                    {a.nombreOriginal}
                                  </p>
                                  <p className="text-[11px] text-[#5E6C84] mt-0.5">
                                    {formatBytes(a.tamanoBytes)}
                                    {a.subidoPor?.nombre ? ` · ${a.subidoPor.nombre}` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-4 shrink-0 pl-11 sm:pl-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void downloadRequirementAttachment(
                                      requirementId,
                                      a.id,
                                      a.nombreOriginal,
                                    )
                                  }
                                  className="text-xs font-medium text-[#0052CC] hover:underline"
                                >
                                  Descargar
                                </button>
                                {canWrite && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm("¿Eliminar este adjunto?")) {
                                        void deleteAtt.mutateAsync({
                                          requirementId,
                                          attachmentId: a.id,
                                        });
                                      }
                                    }}
                                    disabled={deleteAtt.isPending}
                                    className="text-xs font-medium text-red-600 hover:underline"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </IssueCard>
          </div>

          {/* Panel lateral — campos tipo JIRA */}
          <aside className="xl:sticky xl:top-20 space-y-4 min-w-0 w-full">
            <IssueCard className="overflow-hidden">
              <div className="px-4 py-3 border-b border-[#DFE1E6] bg-[#FAFBFC]">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#5E6C84]">
                  Detalles
                </h2>
              </div>
              <div className="px-0 py-1">
                <JiraField label="Estado" value={ed?.label ?? "–"} accent={ed?.variant} />
                <JiraField
                  label="Prioridad"
                  value={prioridadConfig[req.prioridad]?.label ?? req.prioridad}
                  accent={prioridadConfig[req.prioridad]?.variant}
                />
                <JiraField
                  label="Tipo"
                  value={req.tipo === "funcional" ? "Funcional" : "No funcional"}
                />
                <JiraField label="Proyecto" value={req.proyectoNombre || "–"} />
                <JiraField label="Categoría" value={req.categoriaNombre || req.categoria || "–"} />
                <JiraField label="Solicitante" value={req.solicitante || "–"} />
                <JiraField label="Responsable" value={req.responsable || "–"} />
                <JiraField label="Versión actual" value={`v${req.version}`} mono />
                <JiraField
                  label="Creado"
                  value={
                    req.creadoEn
                      ? new Date(req.creadoEn).toLocaleDateString("es-DO", {
                          dateStyle: "medium",
                        })
                      : "–"
                  }
                />
                <JiraField
                  label="Actualizado"
                  value={
                    req.actualizadoEn
                      ? new Date(req.actualizadoEn).toLocaleDateString("es-DO", {
                          dateStyle: "medium",
                        })
                      : "–"
                  }
                />
              </div>
            </IssueCard>
          </aside>
        </div>
      </div>
    </div>
  );
}

function IssueMetaRow({
  req,
  ed,
}: {
  req: Requisito;
  ed: ReturnType<typeof displayEstado> | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ed && (
        <Badge variant={ed.variant} className="font-medium px-2.5 py-0.5">
          {ed.label}
        </Badge>
      )}
      <Badge variant={prioridadConfig[req.prioridad]?.variant ?? "gray"} className="font-medium px-2.5 py-0.5">
        {prioridadConfig[req.prioridad]?.label}
      </Badge>
      <span
        className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium ${
          req.tipo === "funcional"
            ? "bg-[#DEEBFF] text-[#0747A6]"
            : "bg-[#EAE6FF] text-[#403294]"
        }`}
      >
        {req.tipo === "funcional" ? "Funcional" : "No funcional"}
      </span>
      <span className="text-xs text-[#5E6C84] tabular-nums">v{req.version}</span>
    </div>
  );
}

function JiraField({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex gap-3 px-4 py-2.5 border-b border-[#EBECF0] last:border-b-0 hover:bg-[#FAFBFC]/80 transition-colors">
      <dt className="text-xs text-[#5E6C84] font-medium w-[108px] xl:w-[120px] shrink-0 pt-0.5 leading-snug">
        {label}
      </dt>
      <dd className="text-sm text-[#172B4D] min-w-0 flex-1 text-right break-words leading-snug">
        {accent ? (
          <span className="inline-flex items-center justify-end">
            <Badge variant={accent as "default" | "success" | "warning" | "gray" | "danger" | "purple"}>
              {value}
            </Badge>
          </span>
        ) : (
          <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
        )}
      </dd>
    </div>
  );
}
