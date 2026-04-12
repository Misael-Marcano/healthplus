# Plan de pendientes — HealthPlus (seguimiento vivo)

**Última actualización:** 2026-04-11 — Requisitos: estados configurables, comentarios, adjuntos PDF/Word, filtros; reportes CSV/PDF detallados; plan sincronizado con código.

**Cómo usar:** marca `[x]` cuando un ítem quede cumplido. Añade fecha breve al final de la línea si ayuda al equipo (ej. `— 2026-04-15`).

---

## Leyenda de prioridad


| Nivel  | Significado                                                            |
| ------ | ---------------------------------------------------------------------- |
| **P0** | Bloquea seguridad o coherencia crítica en producción                   |
| **P1** | Debe hacerse antes de un despliegue “serio” o cumplimiento del alcance |
| **P2** | Mejora importante de producto o operación                              |
| **P3** | Pulido, nice-to-have                                                   |
| **P4** | Backlog — completitud producto, producción y endurecimiento              |


---

## P0 — Seguridad y autorización (backend + alineación)

- [x] **Registrar y aplicar `RolesGuard`** globalmente o por controlador, de modo que `@Roles()` en NestJS tenga efecto real (usuarios, auditoría, etc.). — `AuthModule` + lectura de rol vía `user.role.nombre` / `user.rol`
- [x] **Revisar cada endpoint** con `@Roles`: que listados sensibles (p. ej. usuarios, auditoría completa) solo sean accesibles según rol definido. — `GET /users`, `GET /users/:id`, `GET /roles` solo admin; `GET /users/lookup` para asignaciones; `GET /audit/entity` solo admin
- [x] **Probar con Swagger o cliente** que un usuario no administrador no pueda crear/editar/borrar usuarios ni ver auditoría si así está definido. — QA manual recomendada (p. ej. `POST /api/users` o `GET /api/audit` con token no admin → 403)

---

## P1 — Seguridad y permisos en la web

- [x] **Ocultar o deshabilitar** entradas de menú y acciones (CRUD, usuarios, configuración sensible) según `user.rol`, alineado con el backend. — `lib/permissions.ts`, `Sidebar`, botones en dashboard/requisitos/proyectos; `RequireRole` en usuarios/auditoría/configuración
- [x] **Middleware de Next.js** (o equivalente) para proteger rutas del área autenticada y evitar acceso solo por cliente. — `src/middleware.ts` + cookie `hp_authenticated` + migración de sesión en `/login`
- [x] **Manejo de 403** desde la API: mensaje claro y redirección o pantalla de “sin permiso”. — `lib/api.ts` + `/sin-permiso`

---

## P1 — Datos y configuración

- [x] **Configuración del sistema**: decidir si la pantalla actual vive en backend (entidad/tablas o settings) y **persistir** lo que deba ser global (organización, catálogos reales, SMTP si aplica). — Módulo `settings`: tabla `system_settings`, `GET/PATCH /api/settings` (PATCH solo admin); front con `useSystemSettings` / `useUpdateSystemSettings`; importación opcional desde `localStorage` legacy
- [x] **Matriz de permisos**: o bien se elimina de la UI hasta que el backend la soporte, o se **implementa en API** y se sincroniza con la UI (no solo `localStorage`). — Matriz interactiva sustituida por sección **Roles y acceso** con enlace a Usuarios; permisos efectivos vía roles en servidor

---

## P2 — Autenticación de usuario

- [x] **Flujo “Olvidé mi contraseña”** — `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, tabla `password_resets`; UI `/olvido-contrasena`, `/restablecer-contrasena`; en **desarrollo** la API puede devolver `resetUrl` / `debugToken` (envío por correo pendiente de SMTP).
- [x] **“Recuérdame”** — `login` envía `remember`; refresh token usa `JWT_REFRESH_EXPIRES_IN_REMEMBER` (p. ej. `30d`) frente al valor por defecto.

---

## P2 — Priorización de requisitos

- [x] **Persistir** impacto, urgencia, esfuerzo y valor — columnas en `requirements` + DTOs; pantalla carga y guarda los cuatro valores y la prioridad derivada.

---

## P2 — Reportes y exportación

- [x] **Exportar CSV** de métricas y tablas resumidas; botón **Imprimir** (`window.print()`) para la vista de reportes.
- [x] **CSV resumen** desde la pantalla Reportes (KPIs + por estado/proyecto/prioridad) — etiqueta “CSV resumen”.
- [x] **Exportación detallada de requisitos** — `GET /api/reports/requirements-detail`; en UI: **CSV detallado** (UTF-8 con BOM) y **PDF detallado** (`jspdf` + `jspdf-autotable`, landscape), columnas alineadas con el listado plano del backend.

---

## P2 — Requisitos: estados, comentarios y adjuntos (nuevo alcance)

- [x] **Catálogo de estados configurable** — entidad `RequirementStatusDef` (global y por `projectId`), seed de estados por defecto; API `GET/POST/PATCH/DELETE /api/requirement-statuses`; requisitos enlazan `status_def_id` + slug `estado`.
- [x] **UI configuración** — sección **Estados requisitos** (ámbito global o por proyecto): alta y desactivación de estados no sistema.
- [x] **UI requisitos** — formulario con `statusDefId` según proyecto; filtros por proyecto y estado; etiquetas de estado desde catálogo (`estadoNombre`); filtro **Estado** con opciones combinadas (API + slugs conocidos + estados presentes en datos cargados) para no quedar solo el placeholder.
- [x] **Comentarios** — entidad `RequirementComment`; `GET/POST /api/requirements/:id/comments`; detalle con pestaña comentarios, autor y fecha; resaltado “Tú” para el usuario actual.
- [x] **Adjuntos PDF y Word** — entidad `RequirementAttachment`; almacenamiento en `uploads/` (env `UPLOAD_DIR`); límites Multer 10 MB; MIME: PDF, `.doc`, `.docx`; API listar/subir/descargar/eliminar bajo `/api/requirements/:id/attachments`; UI: selector en crear/editar (sube tras guardar) y pestaña **Adjuntos** en el detalle.

---

## P3 — Experiencia y calidad

- [x] **`not-found.tsx`** y **`error.tsx`** en el App Router — `app/not-found.tsx`, `app/error.tsx` (estilo HealthPlus, enlace a login).
- [x] **Toasts / feedback global** para errores de API en mutaciones — `sonner` + `Toaster` en `Providers`; `MutationCache` en `queryClient` con `getApiErrorMessage`; omitir toast en 401/403; meta `skipGlobalErrorToast` tipada en `types/react-query.d.ts`.
- [x] **Accesibilidad básica** — login: `htmlFor`, `autocomplete`, `role="alert"` en error, `aria-label` en mostrar contraseña, `<main>`; área autenticada: enlace “Ir al contenido principal” + `#main-content`.
- [x] **Metadatos** — `template` `%s | HealthPlus` en layout raíz; `robots: noindex` en app (intranet); layouts para `(dashboard)`, `(auth)`, `sin-permiso` y `not-found`.

---

## P4 — Backlog (completitud producto y producción)

### Operación y despliegue

- [ ] **SMTP / envío de correo** en producción para recuperación de contraseña y (opcional) notificaciones transaccionales.
- [ ] **Migraciones de base de datos** versionadas (sustituir o complementar `synchronize` de TypeORM en SQL Server); incluir tablas nuevas (`requirement_status_defs`, `requirement_comments`, `requirement_attachments`) si se despliega sin `synchronize`.
- [ ] **Documentación de despliegue**: variables de entorno (`FRONTEND_URL`, `UPLOAD_DIR`, BD, JWT), backup/restauración BD, checklist de go-live, **respaldo/copia de carpeta `uploads`** para adjuntos.
- [ ] **Secretos y configuración** solo en servidor o gestor de secretos (sin credenciales en repositorio).

### Seguridad avanzada

- [x] **`@Roles()` en API de dominio** alineado con `Docs/roles por usuario.png` — requisitos, proyectos, versiones: `administrador`, `analista`; reportes: `administrador`, `analista`, `gerencia`, `consulta`; validación: lectura `administrador`, `analista`, `stakeholder`; solicitar `administrador`, `analista`; aprobar/rechazar/comentar `administrador`, `stakeholder`.
- [ ] **Revisión de endpoints restantes** (auth público excluido) y pruebas manuales / automatizadas con tokens por rol (incl. adjuntos y `requirement-statuses`).
- [ ] **Opcional:** validación más estricta de sesión en borde (p. ej. proxy Next) según política de amenaza.

### Producto y UX

- [ ] **Notificaciones in-app** (campana con datos reales) o emails según eventos (validación pendiente, cambio de estado, nuevo comentario/adjunto).
- [x] **PDF export “real” para datos tabulares** — PDF detallado de requisitos en Reportes (`jspdf-autotable`). La vista gráfica sigue pudiendo imprimirse con **Imprimir vista** (`window.print()`).
- [ ] **Incluir en exportaciones** (opcional negocio): columnas de conteo de adjuntos o nombres de archivos en CSV/PDF detallado; hoy el detalle cubre campos del requisito, no lista de adjuntos.
- [ ] **Toasts de éxito** en más mutaciones (patrón `meta` o helpers); iniciado en validación (`useValidate`).
- [ ] **Accesibilidad** ampliada: tablas, modales, foco, contraste en vistas frecuentes.

### Calidad técnica

- [ ] **Pruebas e2e o de API** para flujos críticos (login, CRUD requisito, validación, subida/descarga adjunto).
- [ ] **Migrar convención** `middleware` → **proxy** de Next.js cuando se actualice la guía del proyecto (aviso en build 16).

### Producto — posibles extensiones (no bloqueantes)

- [ ] **Listado de requisitos**: columna o badge con número de adjuntos sin abrir el detalle.
- [ ] **Permisos por rol**: evaluar si `gerencia`/`consulta` deben solo lectura en requisitos con adjuntos (hoy CRUD requisitos sigue siendo admin/analista según matriz).

---

## Registro de avance (opcional)


| Fecha | Ítem cerrado (referencia corta) |
| ----- | -------------------------------- |
| 2026-04-11 | P0 RolesGuard + endpoints; P1 permisos UI, middleware, 403, `GET /users/lookup` |
| 2026-04-11 | P1 configuración persistida (`/api/settings`), UI sin matriz ficticia |
| 2026-04-11 | P2 forgot/reset password, remember, scoring en BD, CSV reportes, UI guía diseño, `Docs/roles_por_usuario.md` |
| 2026-04-11 | P3 not-found + error boundary, toasts mutaciones, metadatos por segmento, a11y login + skip link |
| 2026-04-11 | P4 `@Roles` en requirements, projects, reports, validation, versions; toast éxito en `useValidate` |
| 2026-04-11 | P2 estados configurables + comentarios + API/reportes detalle; P2 adjuntos PDF/Word + pestañas UI; filtro estado reforzado; PDF detallado reportes |


---

## Resumen: hecho vs pendiente (rápido)

| Área | Hecho (alto nivel) | Pendiente principal |
| ---- | ------------------- | --------------------- |
| Requisitos | Estados CRUD, comentarios, adjuntos, filtros | Opcional: adjuntos en export, contador en tabla |
| Reportes | CSV resumen, CSV/PDF detalle requisitos | — |
| Ops | — | SMTP prod, migraciones, docs deploy, backups `uploads` |
| UX/A11y/QA | Base + PDF datos | Toasts éxito ampliados, a11y profunda, e2e |

---

*Cuando completes un bloque entero de prioridad, actualiza la fecha en la cabecera del documento.*
