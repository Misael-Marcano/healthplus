"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Plus, Search, Pencil, ShieldCheck,
  Users, UserCheck, UserX, Loader2, UserMinus, UserPlus,
} from "lucide-react";
import type { User, UserRole } from "@/types";
import type { MessageKey } from "@/i18n/dictionaries";
import { useUsersAdmin, useRoles, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/useUsers";
import { RequireRole } from "@/components/auth/RequireRole";
import { useLocale } from "@/context/LocaleContext";
import { useAuth } from "@/context/AuthContext";

const rolConfig: Record<UserRole, { label: string; variant: "success" | "warning" | "default" | "gray" | "danger" | "purple" }> = {
  administrador: { label: "Administrador", variant: "danger"  },
  analista:      { label: "Analista TI",   variant: "default" },
  stakeholder:   { label: "Stakeholder",   variant: "purple"  },
  gerencia:      { label: "Gerencia",      variant: "warning" },
  consulta:      { label: "Consulta",      variant: "gray"    },
};

const rolOptions = [
  { value: "administrador", label: "Administrador" },
  { value: "analista",      label: "Analista TI"   },
  { value: "stakeholder",   label: "Stakeholder"   },
  { value: "gerencia",      label: "Gerencia"      },
  { value: "consulta",      label: "Consulta"      },
];

const avatarColors = [
  "bg-blue-500", "bg-purple-500", "bg-green-500",
  "bg-orange-500", "bg-red-500", "bg-teal-500", "bg-pink-500",
];

function getInitials(nombre: string) {
  return nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const createSchema = z.object({
  nombre:   z.string().min(1, "Nombre requerido"),
  email:    z.string().email("Email inválido"),
  rol:      z.enum(["administrador", "analista", "stakeholder", "gerencia", "consulta"]),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const editSchema = z.object({
  nombre:   z.string().min(1, "Nombre requerido"),
  email:    z.string().email("Email inválido"),
  rol:      z.enum(["administrador", "analista", "stakeholder", "gerencia", "consulta"]),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
  activo:   z.boolean(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues   = z.infer<typeof editSchema>;

function UsuariosPageContent() {
  const { t } = useLocale();
  const { user: currentUser } = useAuth();
  const [search,    setSearch]    = useState("");
  const [filtroRol, setFiltroRol] = useState<UserRole | "">("");
  const [filtroEstado, setFiltroEstado] = useState<"" | "activo" | "inactivo">("");
  const [modalNuevo, setModalNuevo] = useState(false);
  const [editando,   setEditando]   = useState<User | null>(null);

  const { data: usuarios = [], isLoading } = useUsersAdmin();
  const { data: roles = [] } = useRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const createForm = useForm<CreateValues>({ resolver: zodResolver(createSchema) });
  const editForm   = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { activo: true },
  });

  const openEdit = (u: User) => {
    setEditando(u);
    editForm.reset({
      nombre: u.nombre,
      email: u.email,
      rol: u.rol,
      password: "",
      activo: u.activo,
    });
  };

  const handleCreate = (values: CreateValues) => {
    const role = roles.find(r => r.nombre === values.rol);
    const roleId = role?.id ?? 1;
    createMutation.mutate(
      { nombre: values.nombre, email: values.email, password: values.password, roleId },
      { onSuccess: () => { setModalNuevo(false); createForm.reset(); } },
    );
  };

  const handleEdit = (values: EditValues) => {
    if (!editando) return;
    const role = roles.find(r => r.nombre === values.rol);
    const roleId = role?.id;
    updateMutation.mutate(
      {
        id: editando.id,
        nombre: values.nombre,
        email: values.email,
        activo: values.activo,
        ...(roleId ? { roleId } : {}),
        ...(values.password ? { password: values.password } : {}),
      },
      { onSuccess: () => setEditando(null) },
    );
  };

  const handleDeactivate = (u: User) => {
    if (currentUser?.id === u.id) {
      toast.error(t("users.cannotDeactivateSelf"));
      return;
    }
    if (!confirm(t("users.deactivateConfirm"))) return;
    deleteMutation.mutate(u.id);
  };

  const handleActivate = (u: User) => {
    updateMutation.mutate({ id: u.id, activo: true });
  };

  const filtrados = usuarios.filter(u => {
    const q = search.toLowerCase();
    const matchText =
      u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRol = filtroRol === "" || u.rol === filtroRol;
    const matchEstado =
      filtroEstado === "" ||
      (filtroEstado === "activo" && u.activo) ||
      (filtroEstado === "inactivo" && !u.activo);
    return matchText && matchRol && matchEstado;
  });

  const activos = usuarios.filter(u => u.activo).length;

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("users.title")}</h1>
            <p className="text-sm text-gray-400">{usuarios.length} {t("users.subtitle")}</p>
          </div>
          <Button onClick={() => setModalNuevo(true)}>
            <Plus size={15} /> {t("users.new")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("users.total"),    value: usuarios.length,             icon: Users,     color: "bg-blue-500"  },
            { label: t("users.activeCount"),  value: activos,                     icon: UserCheck, color: "bg-green-500" },
            { label: t("users.inactiveCount"),value: usuarios.length - activos,   icon: UserX,     color: "bg-gray-400"  },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl p-4 text-white shadow-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-white/80">{s.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <s.icon size={18} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("users.searchPlaceholder")}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <select
                value={filtroRol}
                onChange={e => setFiltroRol(e.target.value as UserRole | "")}
                className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{t("users.filterRole")}</option>
                {rolOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value as "" | "activo" | "inactivo")}
                className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">{t("users.filterStatus")}: {t("users.statusAll")}</option>
                <option value="activo">{t("users.statusActive")}</option>
                <option value="inactivo">{t("users.statusInactive")}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        )}

        {/* Tabla */}
        {!isLoading && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("users.colUser")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">{t("users.colEmail")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("users.colRole")}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">{t("users.colState")}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">{t("users.colActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">
                        {t("users.none")}
                      </td>
                    </tr>
                  ) : (
                    filtrados.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {getInitials(u.nombre)}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{u.nombre}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={rolConfig[u.rol].variant}>
                            {rolConfig[u.rol].label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.activo ? "text-green-600" : "text-gray-400"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? "bg-green-500" : "bg-gray-300"}`} />
                            {u.activo ? t("users.stateActive") : t("users.stateInactive")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title={t("users.edit")}
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            {u.activo ? (
                              <button
                                type="button"
                                title={t("users.deactivate")}
                                onClick={() => handleDeactivate(u)}
                                disabled={deleteMutation.isPending || currentUser?.id === u.id}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                              >
                                <UserMinus size={14} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                title={t("users.activate")}
                                onClick={() => handleActivate(u)}
                                disabled={updateMutation.isPending}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                              >
                                <UserPlus size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Permisos por Rol */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
              <ShieldCheck size={16} className="text-blue-600" />
              {t("users.permMatrix")}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-gray-500 font-semibold">{t("users.permCol")}</th>
                    {(["administrador", "analista", "stakeholder", "gerencia", "consulta"] as UserRole[]).map(r => (
                      <th key={r} className="py-2 text-center">
                        <Badge variant={rolConfig[r].variant}>{rolConfig[r].label}</Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                  {([
                    ["users.perm.manageUsers",  true,  false, false, false, false],
                    ["users.perm.createReq",    true,  true,  false, false, false],
                    ["users.perm.editReq",   true,  true,  false, false, false],
                    ["users.perm.validate",  true,  false, true,  false, false],
                    ["users.perm.reports",        true,  true,  false, true,  true ],
                    ["users.perm.settings",       true,  false, false, false, false],
                  ] as const).map(([labelKey, ...perms]) => (
                    <tr key={labelKey}>
                      <td className="py-2 font-medium">{t(labelKey as MessageKey)}</td>
                      {(perms as boolean[]).map((p, i) => (
                        <td key={i} className="py-2 text-center">
                          {p ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">–</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Nuevo Usuario */}
      <Modal
        open={modalNuevo}
        onClose={() => { setModalNuevo(false); createForm.reset(); }}
        title={t("users.modalNew")}
        size="sm"
      >
        <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
          <Input
            label={`${t("users.fieldName")} *`}
            placeholder={t("users.fieldName")}
            id="nombre"
            error={createForm.formState.errors.nombre?.message}
            {...createForm.register("nombre")}
          />
          <Input
            label={`${t("users.fieldEmail")} *`}
            type="email"
            placeholder="correo@healthplus.com"
            id="email"
            error={createForm.formState.errors.email?.message}
            {...createForm.register("email")}
          />
          <Select
            label={`${t("users.fieldRole")} *`}
            id="rol"
            placeholder={t("users.fieldRole")}
            options={rolOptions}
            error={createForm.formState.errors.rol?.message}
            {...createForm.register("rol")}
          />
          <Input
            label={`${t("users.fieldPassword")} *`}
            type="password"
            placeholder="••••••••"
            id="password"
            error={createForm.formState.errors.password?.message}
            {...createForm.register("password")}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => { setModalNuevo(false); createForm.reset(); }}>
              {t("users.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {t("users.create")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal
        open={!!editando}
        onClose={() => setEditando(null)}
        title={t("users.modalEdit")}
        size="sm"
      >
        <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
          <Input
            label={`${t("users.fieldName")} *`}
            placeholder={t("users.fieldName")}
            id="edit-nombre"
            error={editForm.formState.errors.nombre?.message}
            {...editForm.register("nombre")}
          />
          <Input
            label={`${t("users.fieldEmail")} *`}
            type="email"
            placeholder="correo@healthplus.com"
            id="edit-email"
            error={editForm.formState.errors.email?.message}
            {...editForm.register("email")}
          />
          <Select
            label={`${t("users.fieldRole")} *`}
            id="edit-rol"
            placeholder={t("users.fieldRole")}
            options={rolOptions}
            error={editForm.formState.errors.rol?.message}
            {...editForm.register("rol")}
          />
          <Input
            label={t("users.fieldPasswordEdit")}
            type="password"
            placeholder={t("users.fieldPasswordHint")}
            id="edit-password"
            error={editForm.formState.errors.password?.message}
            {...editForm.register("password")}
          />
          <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
            <Controller
              name="activo"
              control={editForm.control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
            {t("users.fieldActive")}
          </label>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setEditando(null)}>
              {t("users.cancel")}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {t("users.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function UsuariosPage() {
  return (
    <RequireRole roles={["administrador"]}>
      <UsuariosPageContent />
    </RequireRole>
  );
}
