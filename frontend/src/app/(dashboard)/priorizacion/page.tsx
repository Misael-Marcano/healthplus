"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Save, RotateCcw, Loader2 } from "lucide-react";
import { useRequirements, useUpdateRequirement } from "@/hooks/useRequirements";
import type { PrioridadRequisito } from "@/types";

const prioridadConfig: Record<PrioridadRequisito, { label: string; variant: "success" | "warning" | "default" | "gray" | "danger" | "purple" }> = {
  critica: { label: "Crítica", variant: "danger"  },
  alta:    { label: "Alta",    variant: "warning" },
  media:   { label: "Media",   variant: "default" },
  baja:    { label: "Baja",    variant: "gray"    },
};

interface Scores { impacto: number; urgencia: number; esfuerzo: number; valor: number }

const DEFAULT_BY_PRIORIDAD: Record<PrioridadRequisito, Scores> = {
  critica: { impacto: 5, urgencia: 5, esfuerzo: 3, valor: 5 },
  alta:    { impacto: 4, urgencia: 3, esfuerzo: 4, valor: 3 },
  media:   { impacto: 2, urgencia: 1, esfuerzo: 3, valor: 2 },
  baja:    { impacto: 1, urgencia: 1, esfuerzo: 4, valor: 1 },
};

function calcScore(s: Scores) {
  return ((s.impacto + s.urgencia + s.valor) * 10) / s.esfuerzo;
}

function scoreToPrioridad(score: number): PrioridadRequisito {
  if (score >= 30) return "critica";
  if (score >= 20) return "alta";
  if (score >= 12) return "media";
  return "baja";
}

export default function PriorizacionPage() {
  const { data: requisitos = [], isLoading } = useRequirements();
  const updateMutation = useUpdateRequirement();

  // scores locales indexados por id de requisito
  const [scores, setScores] = useState<Record<number, Scores>>({});
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inicializar scores desde los requisitos cargados (persistidos en API)
  useEffect(() => {
    if (requisitos.length === 0) return;
    const initial: Record<number, Scores> = {};
    requisitos.forEach((r) => {
      const prioridad = (r.prioridad as PrioridadRequisito) ?? "media";
      const fallback = DEFAULT_BY_PRIORIDAD[prioridad] ?? DEFAULT_BY_PRIORIDAD.media;
      initial[r.id] = {
        impacto: r.impacto ?? fallback.impacto,
        urgencia: r.urgencia ?? fallback.urgencia,
        esfuerzo: r.esfuerzo ?? fallback.esfuerzo,
        valor: r.valor ?? fallback.valor,
      };
    });
    setScores(initial);
    setChanged(false);
  }, [requisitos]);

  const handleChange = (id: number, field: keyof Scores, value: number) => {
    setScores((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setChanged(true);
  };

  const handleReset = () => {
    const initial: Record<number, Scores> = {};
    requisitos.forEach((r) => {
      const prioridad = (r.prioridad as PrioridadRequisito) ?? "media";
      const fallback = DEFAULT_BY_PRIORIDAD[prioridad] ?? DEFAULT_BY_PRIORIDAD.media;
      initial[r.id] = {
        impacto: r.impacto ?? fallback.impacto,
        urgencia: r.urgencia ?? fallback.urgencia,
        esfuerzo: r.esfuerzo ?? fallback.esfuerzo,
        valor: r.valor ?? fallback.valor,
      };
    });
    setScores(initial);
    setChanged(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await Promise.all(
      requisitos.map((r) => {
        const s = scores[r.id];
        if (!s) return Promise.resolve();
        const newPrioridad = scoreToPrioridad(calcScore(s));
        return updateMutation.mutateAsync({
          id: r.id,
          impacto: s.impacto,
          urgencia: s.urgencia,
          esfuerzo: s.esfuerzo,
          valor: s.valor,
          prioridad: newPrioridad,
        });
      }),
    );
    setChanged(false);
    setSaving(false);
  };

  const withScores = requisitos.map((r) => ({
    ...r,
    scores: scores[r.id] ?? DEFAULT_BY_PRIORIDAD[r.prioridad as PrioridadRequisito] ?? DEFAULT_BY_PRIORIDAD.media,
  }));

  const sorted = [...withScores].sort((a, b) => calcScore(b.scores) - calcScore(a.scores));

  const ScoreInput = ({ id, field, value }: { id: number; field: keyof Scores; value: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => handleChange(id, field, n)}
          className={`w-6 h-6 rounded-md text-xs font-semibold transition-colors ${
            value >= n ? "bg-[#2C5FA3] text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-[#EAF2F8] hover:text-[#2C5FA3]"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Priorización</h1>
          <p className="text-sm text-gray-400">Evalúa impacto, urgencia, esfuerzo y valor de negocio (escala 1–5)</p>
        </div>
        <div className="flex gap-2">
          {changed && (
            <Button variant="secondary" onClick={handleReset} disabled={saving}>
              <RotateCcw size={14} /> Restablecer
            </Button>
          )}
          <Button onClick={handleSave} disabled={!changed || saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span><span className="font-semibold text-blue-600">Impacto:</span> ¿Qué tan relevante es para el negocio?</span>
            <span><span className="font-semibold text-orange-500">Urgencia:</span> ¿Con qué velocidad se necesita?</span>
            <span><span className="font-semibold text-red-500">Esfuerzo:</span> ¿Qué tan difícil es implementarlo? (1=fácil)</span>
            <span><span className="font-semibold text-green-600">Valor:</span> ¿Cuánto valor entrega al usuario?</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
            <ArrowUpDown size={16} className="text-blue-600" /> Matriz de Priorización
          </h2>
          <span className="text-xs text-gray-400">Score = (Impacto + Urgencia + Valor) × 10 ÷ Esfuerzo</span>
        </CardHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : sorted.length === 0 ? (
          <CardContent className="py-10 text-center text-sm text-gray-400">
            No hay requisitos. Crea algunos en la sección Requisitos.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <caption className="sr-only">
                Matriz de priorización por impacto, urgencia, esfuerzo y valor
              </caption>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Requisito</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-blue-600 uppercase tracking-wide">Impacto</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-orange-500 uppercase tracking-wide">Urgencia</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-red-500 uppercase tracking-wide">Esfuerzo</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wide">Valor</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((req, idx) => {
                  const s = req.scores;
                  const score = calcScore(s);
                  const prioridad = scoreToPrioridad(score);
                  return (
                    <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 text-sm font-bold text-gray-400">#{idx + 1}</td>
                      <th scope="row" className="px-4 py-3 text-left font-normal">
                        <p className="text-xs font-mono text-blue-600">{req.codigo}</p>
                        <p className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{req.titulo}</p>
                        <p className="text-xs text-gray-400">{req.proyectoNombre}</p>
                      </th>
                      <td className="px-4 py-3"><div className="flex justify-center"><ScoreInput id={req.id} field="impacto"  value={s.impacto}  /></div></td>
                      <td className="px-4 py-3"><div className="flex justify-center"><ScoreInput id={req.id} field="urgencia" value={s.urgencia} /></div></td>
                      <td className="px-4 py-3"><div className="flex justify-center"><ScoreInput id={req.id} field="esfuerzo" value={s.esfuerzo} /></div></td>
                      <td className="px-4 py-3"><div className="flex justify-center"><ScoreInput id={req.id} field="valor"    value={s.valor}    /></div></td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-gray-800">{score.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={prioridadConfig[prioridad].variant}>
                          {prioridadConfig[prioridad].label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
