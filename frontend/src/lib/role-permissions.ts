import type { RolePermisos, UserRole } from "@/types";

const DEFAULT_PERMISOS_POR_ROL: Record<string, RolePermisos> = {
  administrador: {
    manageUsers: true,
    createReq: true,
    editReq: true,
    validate: true,
    reports: true,
    settings: true,
  },
  analista: {
    manageUsers: false,
    createReq: true,
    editReq: true,
    validate: false,
    reports: true,
    settings: false,
  },
  stakeholder: {
    manageUsers: false,
    createReq: false,
    editReq: false,
    validate: true,
    reports: false,
    settings: false,
  },
  gerencia: {
    manageUsers: false,
    createReq: false,
    editReq: false,
    validate: false,
    reports: true,
    settings: false,
  },
  consulta: {
    manageUsers: false,
    createReq: false,
    editReq: false,
    validate: false,
    reports: true,
    settings: false,
  },
};

export const PERMISO_MATRIX_KEYS: (keyof RolePermisos)[] = [
  "manageUsers",
  "createReq",
  "editReq",
  "validate",
  "reports",
  "settings",
];

export function mergeRolePermisos(
  nombreRol: string,
  raw: unknown,
): RolePermisos {
  const base =
    DEFAULT_PERMISOS_POR_ROL[nombreRol] ??
    DEFAULT_PERMISOS_POR_ROL.consulta;
  if (!raw || typeof raw !== "object") return { ...base };
  const o = raw as Record<string, boolean>;
  const out = { ...base };
  for (const k of PERMISO_MATRIX_KEYS) {
    if (typeof o[k] === "boolean") out[k] = o[k];
  }
  return out;
}

export function roleOrder(a: { nombre: string }, b: { nombre: string }): number {
  const order: UserRole[] = [
    "administrador",
    "analista",
    "stakeholder",
    "gerencia",
    "consulta",
  ];
  const ia = order.indexOf(a.nombre as UserRole);
  const ib = order.indexOf(b.nombre as UserRole);
  if (ia === -1 && ib === -1) return a.nombre.localeCompare(b.nombre);
  if (ia === -1) return 1;
  if (ib === -1) return -1;
  return ia - ib;
}
