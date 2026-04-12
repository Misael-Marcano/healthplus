import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import type { User, RolePermisos } from "@/types";

const KEY_ADMIN = ["users", "admin"] as const;
const KEY_LOOKUP = ["users", "lookup"] as const;

export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  permisos?: RolePermisos | null;
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get<Role[]>("/roles").then((r) => r.data),
  });
}

function normalizeUser(u: any): User {
  return {
    ...u,
    rol: u.rol ?? u.role?.nombre,
  };
}

/** id + nombre para selects (todos los usuarios autenticados). */
export function useUserLookup() {
  return useQuery({
    queryKey: KEY_LOOKUP,
    queryFn: () =>
      api.get<{ id: number; nombre: string }[]>("/users/lookup").then((r) => r.data),
  });
}

/** Listado completo para la pantalla de administración de usuarios. */
export function useUsersAdmin() {
  return useQuery({
    queryKey: KEY_ADMIN,
    queryFn: () => api.get<any[]>("/users").then((r) => r.data.map(normalizeUser)),
  });
}

interface CreateUserDto {
  nombre: string;
  email: string;
  password: string;
  roleId: number;
  activo?: boolean;
}

interface UpdateUserDto {
  id: number;
  nombre?: string;
  email?: string;
  password?: string;
  roleId?: number;
  /** Desactivar o reactivar cuenta (misma semántica que en JIRA / soft-delete). */
  activo?: boolean;
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserDto) =>
      api.post("/users", dto).then((r) => r.data),
    onSuccess: () => {
      toast.success("Usuario creado");
      qc.invalidateQueries({ queryKey: KEY_ADMIN });
      qc.invalidateQueries({ queryKey: KEY_LOOKUP });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: UpdateUserDto) =>
      api.patch(`/users/${id}`, dto).then((r) => r.data),
    onSuccess: () => {
      toast.success("Usuario actualizado");
      qc.invalidateQueries({ queryKey: KEY_ADMIN });
      qc.invalidateQueries({ queryKey: KEY_LOOKUP });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: KEY_ADMIN });
      qc.invalidateQueries({ queryKey: KEY_LOOKUP });
    },
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permisos }: { id: number; permisos: RolePermisos }) =>
      api.patch(`/roles/${id}/permissions`, { permisos }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}
