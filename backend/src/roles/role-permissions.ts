/** Claves alineadas con la matriz de la UI (usuarios). */
export type RolePermisos = {
  manageUsers: boolean;
  createReq: boolean;
  editReq: boolean;
  validate: boolean;
  reports: boolean;
  settings: boolean;
};

export const PERMISO_KEYS: (keyof RolePermisos)[] = [
  'manageUsers',
  'createReq',
  'editReq',
  'validate',
  'reports',
  'settings',
];

export const DEFAULT_PERMISOS_POR_ROL: Record<string, RolePermisos> = {
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

export function mergePermisos(
  nombreRol: string,
  raw: unknown,
): RolePermisos {
  const base =
    DEFAULT_PERMISOS_POR_ROL[nombreRol] ??
    DEFAULT_PERMISOS_POR_ROL.consulta;
  if (!raw || typeof raw !== 'object') return { ...base };
  const o = raw as Record<string, boolean>;
  const out = { ...base };
  for (const k of PERMISO_KEYS) {
    if (typeof o[k] === 'boolean') out[k] = o[k];
  }
  return out;
}
