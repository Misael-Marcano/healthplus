import type { PrioridadRequisito, Requisito } from "@/types";

export type BadgeVariant =
  | "success"
  | "warning"
  | "default"
  | "gray"
  | "danger"
  | "purple";

/** Slugs históricos del sistema; los demás usan nombre del catálogo. */
export const ESTADO_VARIANTS: Partial<
  Record<string, { label: string; variant: BadgeVariant }>
> = {
  aprobado:        { label: "Aprobado",      variant: "success"  },
  en_revision:     { label: "En Revisión",   variant: "warning"  },
  borrador:        { label: "Borrador",      variant: "gray"     },
  validado:        { label: "Validado",      variant: "default"  },
  rechazado:       { label: "Rechazado",     variant: "danger"   },
  implementado:    { label: "Implementado",  variant: "purple"   },
  cerrado:         { label: "Cerrado",       variant: "gray"     },
  cancelado:       { label: "Cancelado",     variant: "danger"   },
  requiere_ajuste: { label: "Req. Ajuste",   variant: "warning"  },
  en_proceso:      { label: "En proceso",    variant: "warning"  },
  completado:      { label: "Completado",    variant: "success"  },
};

export function displayEstado(
  req: Pick<Requisito, "estado" | "estadoNombre">,
): { label: string; variant: BadgeVariant } {
  const slug = req.estado;
  const preset = ESTADO_VARIANTS[slug];
  const label =
    req.estadoNombre?.trim() ||
    preset?.label ||
    slug.replace(/_/g, " ");
  return { label, variant: preset?.variant ?? "default" };
}

export const prioridadConfig: Record<
  PrioridadRequisito,
  { label: string; variant: BadgeVariant }
> = {
  critica: { label: "Crítica", variant: "danger"  },
  alta:    { label: "Alta",    variant: "warning" },
  media:   { label: "Media",   variant: "default" },
  baja:    { label: "Baja",    variant: "gray"    },
};

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
