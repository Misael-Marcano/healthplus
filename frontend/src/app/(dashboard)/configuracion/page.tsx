"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Building2, Tags, Workflow, Bell,
  Save, Check, ChevronRight, Users, Loader2, ListChecks, Trash2, Plus, Layers,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import {
  useRequirementStatuses,
  useCreateRequirementStatus,
  useDeleteRequirementStatus,
} from "@/hooks/useRequirementStatuses";
import {
  useRequirementCategories,
  useCreateRequirementCategory,
  useDeleteRequirementCategory,
} from "@/hooks/useRequirementCategories";
import { RequirePathAccess } from "@/components/auth/RequireRole";
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/useSettings";
import { useLocale } from "@/context/LocaleContext";

const STORAGE_KEY_LEGACY = "healthplus_config";

const secciones = [
  { id: "organizacion", label: "Organización",     icon: Building2   },
  { id: "catalogos",    label: "Catálogos",         icon: Tags        },
  { id: "estados-req",  label: "Estados requisitos", icon: ListChecks },
  { id: "categorias-req", label: "Categorías requisitos", icon: Layers },
  { id: "versiones",    label: "Control Versiones", icon: Workflow    },
  { id: "roles",        label: "Roles y acceso",    icon: Users       },
  { id: "notifs",       label: "Notificaciones",    icon: Bell        },
];

const DEFAULT_CATS = ["Citas", "Expedientes", "Facturación", "Notificaciones", "Integración", "Rendimiento", "Administración"];

const NOTIFS_DEFAULT = ["n1","n2","n3","n4","n5","n6","n7","n8"];
const VERSION_OPTS_DEFAULT = ["req_motivo","notif_cambio","hist_completo","auto_version"];

interface Config {
  org: { nombre: string; area: string; email: string; ciudad: string; tel: string; web: string };
  prefs: { lang: string; tz: string; datefmt: string };
  cats: string[];
  vtrigger: string;
  versionOpts: string[];
  notifOpts: string[];
  smtp: { host: string; port: string; user: string };
  smtpPasswordSet?: boolean;
}

function loadLegacyLocalConfig(): Config | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Config & { matriz?: unknown };
    delete parsed.matriz;
    return parsed;
  } catch {
    return null;
  }
}

function getDefault(): Config {
  return {
    org: { nombre: "HealthPlus Clínica Integral", area: "Tecnología (TI)", email: "ti@healthplus.com", ciudad: "Santo Domingo, República Dominicana", tel: "+1 (809) 555-0000", web: "https://healthplus.com.do" },
    prefs: { lang: "es", tz: "AST", datefmt: "dd/mm/yyyy" },
    cats: DEFAULT_CATS,
    vtrigger: "descripcion",
    versionOpts: VERSION_OPTS_DEFAULT,
    notifOpts: NOTIFS_DEFAULT,
    smtp: { host: "", port: "587", user: "" },
    smtpPasswordSet: false,
  };
}

function EstadosRequisitosPanel() {
  const { data: proyectos = [] } = useProjects();
  const [scope, setScope] = useState<"global" | "project">("global");
  const [projectId, setProjectId] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const pid = scope === "project" && projectId ? Number(projectId) : undefined;
  const { data: statuses = [], isLoading } = useRequirementStatuses(pid, {
    enabled: scope === "global" || (scope === "project" && !!projectId),
  });
  const createMut = useCreateRequirementStatus();
  const deleteMut = useDeleteRequirementStatus();

  const crear = async () => {
    const n = nombre.trim();
    if (n.length < 2) return;
    await createMut.mutateAsync({
      nombre: n,
      slug: slug.trim() || undefined,
      ...(scope === "project" && projectId ? { projectId: Number(projectId) } : {}),
    });
    setNombre("");
    setSlug("");
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="font-semibold text-gray-900">Catálogo de estados</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Estados globales aplican a todos los proyectos; los específicos de un proyecto sustituyen al global con el mismo identificador (slug) cuando exista ambos.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-wrap">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setScope("global"); setProjectId(""); }}
              className={`rounded-lg px-3 py-2 text-sm font-medium border ${scope === "global" ? "border-blue-600 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => setScope("project")}
              className={`rounded-lg px-3 py-2 text-sm font-medium border ${scope === "project" ? "border-blue-600 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              Por proyecto
            </button>
          </div>
          {scope === "project" && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm max-w-xs"
            >
              <option value="">Selecciona proyecto…</option>
              {proyectos.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.nombre}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          <Input label="Nombre del estado" id="st-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. En proceso" />
          <Input label="Slug (opcional)" id="st-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="en_proceso" />
          <Button
            type="button"
            onClick={() => void crear()}
            loading={createMut.isPending}
            disabled={nombre.trim().length < 2 || (scope === "project" && !projectId)}
          >
            <Plus size={16} /> Crear estado
          </Button>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
              <Loader2 size={18} className="animate-spin mr-2" /> Cargando estados…
            </div>
          ) : statuses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No hay estados en este ámbito.</p>
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">Estados de requisitos configurados en el ámbito seleccionado</caption>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs uppercase text-gray-500">
                  <th scope="col" className="px-4 py-2">Nombre</th>
                  <th scope="col" className="px-4 py-2">Slug</th>
                  <th scope="col" className="px-4 py-2">Orden</th>
                  <th scope="col" className="px-4 py-2">Sistema</th>
                  <th scope="col" className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statuses.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-2 font-medium text-gray-800">{s.nombre}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{s.slug}</td>
                    <td className="px-4 py-2 text-gray-600">{s.orden}</td>
                    <td className="px-4 py-2">{s.esSistema ? <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Sistema</span> : "—"}</td>
                    <td className="px-4 py-2 text-right">
                      {!s.esSistema ? (
                        <button
                          type="button"
                          onClick={() => { if (confirm("¿Desactivar este estado?")) deleteMut.mutate(s.id); }}
                          disabled={deleteMut.isPending}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Desactivar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No eliminable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoriasRequisitosPanel() {
  const { data: proyectos = [] } = useProjects();
  const [scope, setScope] = useState<"global" | "project">("global");
  const [projectId, setProjectId] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const pid = scope === "project" && projectId ? Number(projectId) : undefined;
  const { data: categories = [], isLoading } = useRequirementCategories(pid, {
    enabled: scope === "global" || (scope === "project" && !!projectId),
  });
  const createMut = useCreateRequirementCategory();
  const deleteMut = useDeleteRequirementCategory();

  const crear = async () => {
    const n = nombre.trim();
    if (n.length < 2) return;
    await createMut.mutateAsync({
      nombre: n,
      slug: slug.trim() || undefined,
      ...(scope === "project" && projectId ? { projectId: Number(projectId) } : {}),
    });
    setNombre("");
    setSlug("");
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="font-semibold text-gray-900">Catálogo de categorías</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Categorías globales aplican a todos los proyectos; las específicas de un proyecto sustituyen a la global con el mismo identificador (slug) cuando existan ambas.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-wrap">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setScope("global"); setProjectId(""); }}
              className={`rounded-lg px-3 py-2 text-sm font-medium border ${scope === "global" ? "border-blue-600 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => setScope("project")}
              className={`rounded-lg px-3 py-2 text-sm font-medium border ${scope === "project" ? "border-blue-600 bg-blue-50 text-blue-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              Por proyecto
            </button>
          </div>
          {scope === "project" && (
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm max-w-xs"
            >
              <option value="">Selecciona proyecto…</option>
              {proyectos.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.nombre}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border border-gray-100 rounded-xl p-4 bg-gray-50/50">
          <Input label="Nombre de la categoría" id="cat-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Integración" />
          <Input label="Slug (opcional)" id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="integracion" />
          <Button
            type="button"
            onClick={() => void crear()}
            loading={createMut.isPending}
            disabled={nombre.trim().length < 2 || (scope === "project" && !projectId)}
          >
            <Plus size={16} /> Crear categoría
          </Button>
        </div>

        <div className="border border-gray-100 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
              <Loader2 size={18} className="animate-spin mr-2" /> Cargando categorías…
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No hay categorías en este ámbito.</p>
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">Categorías de requisitos en el ámbito seleccionado</caption>
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs uppercase text-gray-500">
                  <th scope="col" className="px-4 py-2">Nombre</th>
                  <th scope="col" className="px-4 py-2">Slug</th>
                  <th scope="col" className="px-4 py-2">Orden</th>
                  <th scope="col" className="px-4 py-2">Sistema</th>
                  <th scope="col" className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-2 font-medium text-gray-800">{c.nombre}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-600">{c.slug}</td>
                    <td className="px-4 py-2 text-gray-600">{c.orden}</td>
                    <td className="px-4 py-2">{c.esSistema ? <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Sistema</span> : "—"}</td>
                    <td className="px-4 py-2 text-right">
                      {!c.esSistema ? (
                        <button
                          type="button"
                          onClick={() => { if (confirm("¿Desactivar esta categoría?")) deleteMut.mutate(c.id); }}
                          disabled={deleteMut.isPending}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Desactivar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No eliminable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ConfiguracionPageContent() {
  const { t } = useLocale();
  const [seccion, setSeccion] = useState("organizacion");
  const [saved, setSaved]     = useState(false);
  const [cfg, setCfg]         = useState<Config>(getDefault);
  const [newCat, setNewCat]   = useState("");
  const [smtpPassInput, setSmtpPassInput] = useState("");
  const [importedLegacy, setImportedLegacy] = useState(false);

  const { data: remote, isLoading, isError, error, refetch } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();

  useEffect(() => {
    if (!remote) return;
    setCfg({
      org: { ...remote.org },
      prefs: { ...remote.prefs },
      cats: [...remote.cats],
      vtrigger: remote.vtrigger,
      versionOpts: [...remote.versionOpts],
      notifOpts: [...remote.notifOpts],
      smtp: { ...remote.smtp },
      smtpPasswordSet: remote.smtpPasswordSet,
    });
  }, [remote]);

  const handleImportLegacy = () => {
    const legacy = loadLegacyLocalConfig();
    if (legacy) {
      setCfg((c) => ({ ...c, ...legacy, smtp: { ...c.smtp, ...legacy.smtp } }));
      setImportedLegacy(true);
      setTimeout(() => setImportedLegacy(false), 4000);
    }
  };

  const handleSave = async () => {
    const updated = await updateMutation.mutateAsync({
      org: cfg.org,
      prefs: cfg.prefs,
      cats: cfg.cats,
      vtrigger: cfg.vtrigger,
      versionOpts: cfg.versionOpts,
      notifOpts: cfg.notifOpts,
      smtp: {
        host: cfg.smtp.host,
        port: cfg.smtp.port,
        user: cfg.smtp.user,
        ...(smtpPassInput.trim() ? { password: smtpPassInput.trim() } : {}),
      },
    });
    setSmtpPassInput("");
    setCfg((c) => ({
      ...c,
      smtpPasswordSet: updated.smtpPasswordSet,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    try {
      localStorage.removeItem(STORAGE_KEY_LEGACY);
    } catch { /* ignore */ }
  };

  const setOrg   = (k: keyof Config["org"],   v: string) => setCfg(c => ({ ...c, org:   { ...c.org,   [k]: v } }));
  const setPrefs = (k: keyof Config["prefs"], v: string) => setCfg(c => ({ ...c, prefs: { ...c.prefs, [k]: v } }));
  const setSmtp  = (k: keyof Config["smtp"],  v: string) => setCfg(c => ({ ...c, smtp:  { ...c.smtp,  [k]: v } }));

  const removeCat = (cat: string) => setCfg(c => ({ ...c, cats: c.cats.filter(x => x !== cat) }));
  const addCat    = () => { if (newCat.trim()) { setCfg(c => ({ ...c, cats: [...c.cats, newCat.trim()] })); setNewCat(""); } };

  const toggleVersionOpt = (id: string) =>
    setCfg(c => ({ ...c, versionOpts: c.versionOpts.includes(id) ? c.versionOpts.filter(x => x !== id) : [...c.versionOpts, id] }));

  const toggleNotif = (id: string) =>
    setCfg(c => ({ ...c, notifOpts: c.notifOpts.includes(id) ? c.notifOpts.filter(x => x !== id) : [...c.notifOpts, id] }));

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Menú lateral */}
      <div className="w-full lg:w-56 shrink-0">
        <Card className="lg:sticky lg:top-0">
          <CardContent className="p-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">Secciones</p>
            <nav className="space-y-0.5">
              {secciones.map(s => (
                <button key={s.id} onClick={() => setSeccion(s.id)}
                  className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left ${
                    seccion === s.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <s.icon size={16} className={seccion === s.id ? "text-white" : "text-gray-400"} />
                    {s.label}
                  </span>
                  {seccion === s.id && <ChevronRight size={14} className="text-white/70" />}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 space-y-4">
        {isLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            <Loader2 size={16} className="animate-spin text-blue-600" /> {t("config.loadingSettings")}
          </div>
        )}
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-medium">{t("config.loadError")}</p>
            <p className="text-red-700/90 mt-1">
              {(error as { message?: string })?.message ?? "Error de red"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => refetch()}>Reintentar</Button>
              {loadLegacyLocalConfig() && (
                <Button type="button" size="sm" onClick={handleImportLegacy}>Importar copia local (navegador)</Button>
              )}
            </div>
          </div>
        )}
        {importedLegacy && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Datos importados desde el almacenamiento local. Pulsa Guardar para persistirlos en el servidor.
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
            <Check size={16} className="text-green-600 shrink-0" /> {t("config.saved")}
          </div>
        )}

        {/* ORGANIZACIÓN */}
        {seccion === "organizacion" && (
          <>
            <Card>
              <CardHeader><div><h2 className="font-semibold text-gray-900">{t("config.org.title")}</h2><p className="text-xs text-gray-400 mt-0.5">{t("config.org.subtitle")}</p></div></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label={t("config.org.name")} id="org-nombre" value={cfg.org.nombre} onChange={e => setOrg("nombre", e.target.value)} />
                  <Input label={t("config.org.area")} id="org-area"   value={cfg.org.area}   onChange={e => setOrg("area",   e.target.value)} />
                  <Input label={t("config.org.email")} type="email" id="org-email" value={cfg.org.email} onChange={e => setOrg("email", e.target.value)} />
                  <Input label={t("config.org.city")}  id="org-ciudad" value={cfg.org.ciudad} onChange={e => setOrg("ciudad", e.target.value)} />
                  <Input label={t("config.org.phone")} id="org-tel"    value={cfg.org.tel}    onChange={e => setOrg("tel",    e.target.value)} />
                  <Input label={t("config.org.web")} id="org-web"    value={cfg.org.web}    onChange={e => setOrg("web",    e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><div><h2 className="font-semibold text-gray-900">{t("config.prefs.title")}</h2><p className="text-xs text-gray-400 mt-0.5">{t("config.prefs.subtitle")}</p></div></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Select label={t("config.prefs.lang")} id="lang" value={cfg.prefs.lang} onChange={e => setPrefs("lang", e.target.value)} options={[{ value:"es", label:"Español" },{ value:"en", label:"English" }]} />
                  <Select label={t("config.prefs.tz")} id="tz" value={cfg.prefs.tz} onChange={e => setPrefs("tz", e.target.value)} options={[{ value:"AST", label:"AST (Santo Domingo)" },{ value:"EST", label:"EST (New York)" }]} />
                  <Select label={t("config.prefs.datefmt")} id="datefmt" value={cfg.prefs.datefmt} onChange={e => setPrefs("datefmt", e.target.value)} options={[{ value:"dd/mm/yyyy", label:"DD/MM/YYYY" },{ value:"mm/dd/yyyy", label:"MM/DD/YYYY" }]} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* CATÁLOGOS */}
        {seccion === "catalogos" && (
          <>
            <Card>
              <CardHeader>
                <div>
                  <h2 className="font-semibold text-gray-900">Categorías de requisitos</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    El catálogo oficial de categorías vive en la sección <span className="font-medium text-gray-600">Categorías requisitos</span> (mismo criterio que los estados: globales o por proyecto). Las etiquetas siguientes son solo referencia local para otros contenidos de configuración.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {cfg.cats.map(c => (
                    <span key={c} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
                      {c}
                      <button type="button" onClick={() => removeCat(c)} className="text-blue-400 hover:text-red-500 transition-colors">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addCat(); }}
                    placeholder="Etiqueta local..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <Button size="sm" type="button" onClick={addCat}>Agregar</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div>
                  <h2 className="font-semibold text-gray-900">Estados de requisitos</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    El catálogo de estados es configurable: usa la sección <span className="font-medium text-gray-600">Estados requisitos</span> en el menú lateral para crear o administrar estados globales o por proyecto.
                  </p>
                </div>
              </CardHeader>
            </Card>
          </>
        )}

        {seccion === "estados-req" && <EstadosRequisitosPanel />}

        {seccion === "categorias-req" && <CategoriasRequisitosPanel />}

        {/* CONTROL DE VERSIONES */}
        {seccion === "versiones" && (
          <Card>
            <CardHeader><div><h2 className="font-semibold text-gray-900">Control de Versiones</h2><p className="text-xs text-gray-400 mt-0.5">Define cuándo se crea una nueva versión de un requisito</p></div></CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Select label="Crear nueva versión cuando se modifica" id="vtrigger"
                  value={cfg.vtrigger} onChange={e => setCfg(c => ({ ...c, vtrigger: e.target.value }))}
                  options={[
                    { value:"descripcion", label:"Descripción o criterios de aceptación" },
                    { value:"titulo",      label:"Título del requisito" },
                    { value:"manual",      label:"Solo manualmente" },
                    { value:"cualquier",   label:"Cualquier cambio" },
                  ]}
                />
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Opciones de versionado</p>
                  {[
                    { id:"req_motivo",    label:"Requerir descripción del motivo al crear nueva versión" },
                    { id:"notif_cambio",  label:"Notificar a los stakeholders cuando se crea una nueva versión" },
                    { id:"hist_completo", label:"Guardar historial completo de cambios campo por campo" },
                    { id:"auto_version",  label:"Incrementar versión automáticamente al aprobar cambios mayores" },
                  ].map(opt => (
                    <label key={opt.id} className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={cfg.versionOpts.includes(opt.id)} onChange={() => toggleVersionOpt(opt.id)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ROLES (definidos en el servidor) */}
        {seccion === "roles" && (
          <Card>
            <CardHeader>
              <div>
                <h2 className="font-semibold text-gray-900">Roles y permisos efectivos</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Los permisos de menú, API y acciones se aplican según el rol asignado a cada usuario en la base de datos (no editable desde esta matriz).
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <p>
                Para crear usuarios, desactivar cuentas o asignar roles (Administrador, Analista TI, Stakeholder, etc.), usa la gestión de usuarios.
              </p>
              <Link
                href="/usuarios"
                className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline"
              >
                Ir a Usuarios →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* NOTIFICACIONES */}
        {seccion === "notifs" && (
          <>
            <Card>
              <CardHeader><div><h2 className="font-semibold text-gray-900">Configuración de Email</h2><p className="text-xs text-gray-400 mt-0.5">Servidor SMTP para el envío de notificaciones</p></div></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Servidor SMTP" id="smtp-host" placeholder="smtp.healthplus.com" value={cfg.smtp.host} onChange={e => setSmtp("host", e.target.value)} />
                  <Input label="Puerto"         id="smtp-port" placeholder="587"                  value={cfg.smtp.port} onChange={e => setSmtp("port", e.target.value)} />
                  <Input label="Usuario SMTP"   id="smtp-user" placeholder="noreply@healthplus.com" value={cfg.smtp.user} onChange={e => setSmtp("user", e.target.value)} />
                  <Input
                    label="Contraseña SMTP"
                    type="password"
                    id="smtp-pass"
                    autoComplete="new-password"
                    value={smtpPassInput}
                    onChange={(e) => setSmtpPassInput(e.target.value)}
                    placeholder={cfg.smtpPasswordSet ? "Dejar vacío para mantener la guardada" : "Opcional"}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><div><h2 className="font-semibold text-gray-900">Eventos de Notificación</h2><p className="text-xs text-gray-400 mt-0.5">Elige qué eventos generan un email automático</p></div></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    { id:"n1", label:"Al asignar un requisito a un responsable" },
                    { id:"n2", label:"Al aprobar un requisito" },
                    { id:"n3", label:"Al rechazar un requisito" },
                    { id:"n4", label:"Al solicitar validación de un requisito" },
                    { id:"n5", label:"Al agregar un comentario u observación" },
                    { id:"n6", label:"Al crear una nueva versión de un requisito" },
                    { id:"n7", label:"Al cambiar el estado de un requisito" },
                    { id:"n8", label:"Resumen semanal de requisitos pendientes" },
                  ].map(n => (
                    <label key={n.id} className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={cfg.notifOpts.includes(n.id)} onChange={() => toggleNotif(n.id)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{n.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-end pb-2">
          <Button
            onClick={() => void handleSave()}
            size="lg"
            loading={updateMutation.isPending}
            disabled={isLoading}
          >
            <Save size={16} /> {t("config.saveServer")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <RequirePathAccess pathname="/configuracion">
      <ConfiguracionPageContent />
    </RequirePathAccess>
  );
}
