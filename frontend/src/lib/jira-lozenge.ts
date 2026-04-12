import type { BadgeVariant } from "@/lib/requisitos-display";
import { ESTADO_VARIANTS } from "@/lib/requisitos-display";

/** Estilo “lozenge” Jira Cloud (compacto, ~11px, esquinas 3px). */
export const JIRA_LOZENGE: Record<BadgeVariant, string> = {
  success:
    "bg-[#E3FCEF] text-[#006644] border border-[#ABF5D1] hover:bg-[#D1F2E5] hover:border-[#8FDFC3]",
  warning:
    "bg-[#FFF7D6] text-[#974F0C] border border-[#FFE380] hover:bg-[#FFF0B3] hover:border-[#FFC400]",
  default:
    "bg-[#DEEBFF] text-[#0747A6] border border-[#B3D4FF] hover:bg-[#CCE0FF] hover:border-[#85B8FF]",
  danger:
    "bg-[#FFEBE6] text-[#BF2600] border border-[#FFBDAD] hover:bg-[#FFD5CC] hover:border-[#FF9C8C]",
  gray: "bg-[#EBECF0] text-[#42526E] border border-[#DCDFE4] hover:bg-[#DFE1E6]",
  purple:
    "bg-[#EAE6FF] text-[#403294] border border-[#C0B6F2] hover:bg-[#DFD8F7] hover:border-[#A89FEB]",
};

/** Select compacto alineado tipo Jira (altura fija, chevron). */
export const JIRA_SELECT_LOZENGE_BASE =
  "min-h-[28px] h-7 w-full rounded-[3px] pl-2 pr-8 " +
  "text-left text-[12px] font-semibold leading-none shadow-none cursor-pointer " +
  "transition-colors appearance-none " +
  "focus:outline-none focus:ring-2 focus:ring-[#0052CC]/35 focus:ring-offset-0 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

/** Campos neutros (proyecto, categoría). */
export const JIRA_SELECT_NEUTRAL =
  "min-h-[28px] h-7 w-full rounded-[3px] border border-[#DFE1E6] " +
  "bg-[#FAFBFC] pl-2 pr-8 text-left text-[13px] font-normal text-[#172B4D] leading-tight " +
  "shadow-sm cursor-pointer transition-colors appearance-none " +
  "hover:bg-white hover:border-[#C1C7D0] " +
  "focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25 focus:border-[#0052CC] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

/** Persona: fondo suave tipo celda Jira. */
export const JIRA_SELECT_USER =
  "min-h-[28px] h-7 w-full min-w-0 rounded-[3px] border border-[#DFE1E6] " +
  "bg-white pl-2 pr-8 text-left text-[13px] font-medium text-[#172B4D] leading-tight " +
  "shadow-sm cursor-pointer transition-colors appearance-none " +
  "hover:border-[#C1C7D0] hover:bg-[#FAFBFC] " +
  "focus:outline-none focus:ring-2 focus:ring-[#0052CC]/25 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function lozengeVariantForEstadoSlug(slug: string): BadgeVariant {
  return ESTADO_VARIANTS[slug]?.variant ?? "default";
}

export function initialsFromName(nombre: string): string {
  return (
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}
