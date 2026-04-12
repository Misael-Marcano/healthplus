"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle, XCircle, MessageSquare, Clock,
  CheckCircle2, Loader2, SendHorizonal,
} from "lucide-react";
import { usePendingValidations, useValidate, useRequestValidation } from "@/hooks/useValidation";
import { useRequirements } from "@/hooks/useRequirements";
import { useUserLookup } from "@/hooks/useUsers";
import { useAuth } from "@/context/AuthContext";
import { canSolicitarValidacion, canValidateRequirements } from "@/lib/permissions";
import { CommentBody } from "@/components/requisitos/CommentBody";

interface ValidationRecord {
  id: number;
  estado: "pendiente" | "aprobado" | "rechazado" | "comentado";
  comentario?: string;
  creadoEn: string;
  requisito: { id: number; codigo: string; titulo: string; proyecto?: { nombre: string } };
  solicitante?: { nombre: string };
}

const estadoConfig: Record<ValidationRecord["estado"], { label: string; variant: "success" | "warning" | "default" | "gray" | "danger" | "purple"; icon: React.ElementType }> = {
  pendiente: { label: "Pendiente",         variant: "warning", icon: Clock         },
  aprobado:  { label: "Aprobado",          variant: "success", icon: CheckCircle   },
  rechazado: { label: "Rechazado",         variant: "danger",  icon: XCircle       },
  comentado: { label: "Con observaciones", variant: "default", icon: MessageSquare },
};

export default function ValidacionPage() {
  const { user } = useAuth();
  const puedeValidar = canValidateRequirements(user?.rol);
  const puedeSolicitar = canSolicitarValidacion(user?.rol);

  const [filtro,    setFiltro]    = useState<ValidationRecord["estado"] | "todos">("todos");
  const [selected,  setSelected]  = useState<ValidationRecord | null>(null);
  const [comentario,setComentario]= useState("");
  const [accion,    setAccion]    = useState<"aprobar" | "rechazar" | "comentar" | null>(null);

  // Solicitar validación
  const [modalSolicitar, setModalSolicitar] = useState(false);
  const [reqId,       setReqId]       = useState("");
  const [validadorId, setValidadorId] = useState("");

  const { data: validaciones = [], isLoading } = usePendingValidations() as { data: ValidationRecord[]; isLoading: boolean };
  const { data: requisitos = [] }              = useRequirements({ enabled: puedeSolicitar });
  const { data: usuarios   = [] }              = useUserLookup();

  const validateMutation = useValidate();
  const requestMutation  = useRequestValidation();

  const filtradas  = filtro === "todos" ? validaciones : validaciones.filter(v => v.estado === filtro);
  const pendientes = validaciones.filter(v => v.estado === "pendiente").length;

  const abrirAccion = (v: ValidationRecord, a: "aprobar" | "rechazar" | "comentar") => {
    setSelected(v); setAccion(a); setComentario("");
  };

  const confirmarAccion = () => {
    if (!selected || !accion) return;
    const estadoMap = { aprobar: "aprobado", rechazar: "rechazado", comentar: "comentado" } as const;
    validateMutation.mutate(
      { id: selected.id, estado: estadoMap[accion], comentario: comentario || undefined },
      { onSuccess: () => { setAccion(null); setSelected(null); } },
    );
  };

  const confirmarSolicitud = () => {
    if (!reqId || !validadorId) return;
    requestMutation.mutate(
      { requirementId: Number(reqId), validadorId: Number(validadorId) },
      { onSuccess: () => { setModalSolicitar(false); setReqId(""); setValidadorId(""); } },
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Validación de Requisitos</h1>
            <p className="text-sm text-gray-400">{pendientes} requisito(s) pendiente(s) de validación</p>
          </div>
          {puedeSolicitar && (
            <Button onClick={() => setModalSolicitar(true)}>
              <SendHorizonal size={15} /> Solicitar validación
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Pendientes",        value: validaciones.filter(v => v.estado === "pendiente").length, color:"bg-orange-400" },
            { label:"Aprobados",         value: validaciones.filter(v => v.estado === "aprobado").length,  color:"bg-green-500"  },
            { label:"Rechazados",        value: validaciones.filter(v => v.estado === "rechazado").length, color:"bg-red-400"    },
            { label:"Con observaciones", value: validaciones.filter(v => v.estado === "comentado").length, color:"bg-blue-500"   },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl p-4 text-white shadow-sm`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-white/80 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {(["todos","pendiente","aprobado","rechazado","comentado"] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                filtro === f ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
              }`}
            >
              {f === "todos" ? "Todos" : estadoConfig[f].label}
            </button>
          ))}
        </div>

        {isLoading && <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500" /></div>}

        {!isLoading && (
          <div className="space-y-3">
            {filtradas.length === 0 && (
              <Card><CardContent className="py-10 text-center text-sm text-gray-400">No hay validaciones en este estado.</CardContent></Card>
            )}
            {filtradas.map(v => {
              const cfg = estadoConfig[v.estado];
              const Icon = cfg.icon;
              return (
                <Card key={v.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{v.requisito?.codigo}</span>
                          <Badge variant={cfg.variant}><Icon size={11} className="mr-1" />{cfg.label}</Badge>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{v.requisito?.titulo}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {v.requisito?.proyecto?.nombre && `${v.requisito.proyecto.nombre} · `}
                          {v.solicitante?.nombre && `Solicitado por ${v.solicitante.nombre} · `}
                          {new Date(v.creadoEn).toLocaleDateString("es-DO")}
                        </p>
                        {v.comentario && (
                          <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 border border-gray-100">
                            <MessageSquare size={11} className="inline mr-1 text-gray-400 align-text-bottom" />
                            <CommentBody texto={v.comentario} />
                          </div>
                        )}
                      </div>
                      {puedeValidar && v.estado === "pendiente" && (
                        <div className="flex gap-2 shrink-0 flex-wrap">
                          <button type="button" onClick={() => abrirAccion(v, "aprobar")}  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"><CheckCircle size={13} /> Aprobar</button>
                          <button type="button" onClick={() => abrirAccion(v, "rechazar")} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"><XCircle size={13} /> Rechazar</button>
                          <button type="button" onClick={() => abrirAccion(v, "comentar")} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"><MessageSquare size={13} /> Comentar</button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Aprobar / Rechazar / Comentar */}
      <Modal open={!!accion && !!selected} onClose={() => { setAccion(null); setSelected(null); }}
        title={accion === "aprobar" ? "Aprobar Requisito" : accion === "rechazar" ? "Rechazar Requisito" : "Agregar Observación"}
        size="sm"
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">{selected.requisito?.codigo}</p>
              <p className="text-sm font-semibold text-gray-900">{selected.requisito?.titulo}</p>
            </div>
            {accion === "aprobar" && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                <p className="text-sm text-green-800">Al aprobar, el requisito pasará al estado <strong>Aprobado</strong>.</p>
              </div>
            )}
            {accion === "rechazar" && (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <XCircle size={20} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-800">El requisito pasará a estado <strong>Rechazado</strong>. Indica el motivo.</p>
              </div>
            )}
            <Textarea
              label={accion === "aprobar" ? "Comentario (opcional)" : "Motivo / Observación *"}
              placeholder={accion === "comentar" ? "Describe la observación..." : accion === "rechazar" ? "Indica el motivo del rechazo..." : "Comentario adicional..."}
              value={comentario} onChange={e => setComentario(e.target.value)} rows={3}
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="secondary" onClick={() => { setAccion(null); setSelected(null); }}>Cancelar</Button>
              <Button variant={accion === "rechazar" ? "danger" : "primary"} onClick={confirmarAccion} disabled={validateMutation.isPending}>
                {validateMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                {accion === "aprobar"  ? <><CheckCircle size={14} /> Confirmar aprobación</> :
                 accion === "rechazar" ? <><XCircle size={14} /> Confirmar rechazo</> :
                 <><MessageSquare size={14} /> Enviar observación</>}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Solicitar Validación */}
      <Modal open={modalSolicitar} onClose={() => setModalSolicitar(false)} title="Solicitar Validación" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Selecciona el requisito y el validador que revisará el requisito.</p>
          <Select
            label="Requisito *"
            id="req-solicitar"
            placeholder="Seleccionar requisito"
            value={reqId}
            onChange={e => setReqId(e.target.value)}
            options={requisitos.map(r => ({ value: String(r.id), label: `${r.codigo} — ${r.titulo}` }))}
          />
          <Select
            label="Validador *"
            id="validador-solicitar"
            placeholder="Seleccionar validador"
            value={validadorId}
            onChange={e => setValidadorId(e.target.value)}
            options={usuarios.map(u => ({ value: String(u.id), label: u.nombre }))}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalSolicitar(false)}>Cancelar</Button>
            <Button onClick={confirmarSolicitud} disabled={!reqId || !validadorId || requestMutation.isPending}>
              {requestMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              <SendHorizonal size={14} /> Enviar solicitud
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
