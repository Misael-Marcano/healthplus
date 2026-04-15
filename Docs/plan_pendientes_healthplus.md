# Plan de pendientes — HealthPlus (seguimiento vivo)

**Última actualización:** 2026-04-11 — bandeja **`GET /api/notifications/inbox`** (validaciones + comentarios/adjuntos recientes para admin/analista); campana actualizada; e2e; doc despliegue.

**Cómo usar:** marca `[x]` cuando un ítem quede cumplido. Añade fecha breve al final de la línea si ayuda al equipo (ej. `— 2026-04-15`).

---

## Cumplimiento — Requisitos funcionales (2.1)

Referencia: acciones y procesos que el sistema debe realizar. Estado frente a la implementación actual (`backend` NestJS + TypeORM, `frontend` Next.js).

| # | Requisito (resumen) | Estado | Evidencia en producto |
|---|----------------------|--------|-------------------------|
| 1 | Registro de requisitos: nombre, descripción, tipo y responsable | **Cumplido** | Alta en **Requisitos** (`titulo` equivale al nombre del ítem), `descripcion`, `tipo` funcional/no funcional, `responsable` y proyecto; `codigo` autogenerado. API `POST /api/requirements`. |
| 2 | Clasificación en funcionales y no funcionales | **Cumplido** | Campo `tipo` y filtros en listado. |
| 3 | Priorización según criterios (alto, medio, bajo) | **Cumplido** *(ampliado)* | Prioridad `critica` \| `alta` \| `media` \| `baja` más matriz persistida **impacto / urgencia / esfuerzo / valor** (1–5) y pantalla **Priorización**. |
| 4 | Gestión de cambios: registrar modificaciones | **Cumplido** | Actualización de requisitos; **auditoría** (`audit_logs`, acciones como `CREAR_REQUISITO` / cambios); historial de versiones con motivo. |
| 5 | Historial de versiones por requisito | **Cumplido** | Entidad `requirement_versions`; API `GET/POST /api/requirements/:id/versions`; UI en detalle del requisito. |
| 6 | Validación y aprobación por stakeholders internos | **Cumplido** | `requirement_validations`, roles en validación; pantalla **Validación** y flujos según `Docs/roles_por_usuario` / matriz de API. |
| 7 | Reportes del estado y progreso de requisitos | **Cumplido** | **Reportes**: KPIs, CSV resumen, CSV/PDF detallado de requisitos (`GET /api/reports/requirements-detail`). |
| 8 | Consulta y búsqueda rápida y organizada | **Cumplido** | Listado con **búsqueda** (código, título, proyecto, solicitante, responsable), filtros por proyecto, estado, prioridad y tipo; paginación. |

---

## Cumplimiento — Requisitos no funcionales (2.2)

Referencia: calidad y restricciones de operación.

| # | Requisito (resumen) | Estado | Notas |
|---|----------------------|--------|--------|
| 1 | Interfaz fácil de usar e intuitiva (incl. no técnicos) | **Parcial** | UI en español, flujos por rol, diseño unificado; mejoras continuas en **P3/P4** (toasts, a11y ampliada). |
| 2 | Seguridad: solo usuarios autorizados | **Cumplido** | JWT, cookies de sesión en web, `RolesGuard` / `@Roles()`, middleware de rutas; revisión puntual de endpoints en **P4**. |
| 3 | Buen rendimiento: carga rápida de información y reportes | **Parcial** | React Query, exportaciones en cliente; sin SLA ni pruebas de carga documentadas. |
| 4 | Escalable ante nuevos proyectos de la clínica | **Parcial** | Arquitectura modular y multi-proyecto; escalado horizontal = **ops** (BD, despliegue). |
| 5 | Compatible con navegadores web modernos | **Cumplido** | Stack actual (Next.js 16, ES moderno); objetivo: últimas versiones de Chrome/Edge/Firefox/Safari. |
| 6 | Alta disponibilidad en jornada laboral | **Pendiente (ops)** | Depende de hosting, réplicas, backups y monitorización; no es función de la app en sí. Ver **P4 — Operación**. |
| 7 | Trazabilidad de requisitos desde creación hasta validación final | **Cumplido** | Auditoría, versiones, validaciones, comentarios y adjuntos enlazados al requisito. |

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
- [x] **Middleware de Next.js** (o equivalente) para proteger rutas del área autenticada y evitar acceso solo por cliente. — `src/proxy.ts` (Next 16) + cookie `hp_authenticated` + migración de sesión en `/login`
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

## P2 — Historial de versiones (alineación real con cambios)

- [x] **Fase 1 (backend): numeración consistente de versiones** — `POST /api/requirements/:id/versions` calcula `nextVersion` desde `MAX(requirement_versions.version)` por requisito y sincroniza `requirements.version` al crear la versión.
- [x] **Fase 1 (backend): protección de datos de versión** — validación de motivo obligatorio (trim / vacío) antes de guardar el registro de versión.
- [x] **Fase 2 (frontend): flujo manual de versionado en detalle** — en pestaña **Historial** se agregó acción “Registrar versión”, solicitud de motivo y refresco de historial/requisito por invalidaciones React Query.
- [x] **Fase 2 (frontend): feedback UX** — botón con estado de carga y mensajes de error cuando no se pueda registrar versión.
- [x] **Fase 3 (backend+frontend): gatillo automático en edición** — `PATCH /requirements/:id` ya crea snapshot automático según `settings.vtrigger` (`descripcion`, `titulo`, `manual`, `cualquier`).
- [x] **Fase 3 (backend+frontend): aplicar `settings.versionOpts`** — `req_motivo` (obligatorio cuando aplica), `notif_cambio` (correo a participantes del requisito si hay SMTP) y `hist_completo` (auditoría con delta campo a campo) implementados.
- [ ] **Fase 4 (qa/reportes): pruebas de punta a punta** — crear/editar requisito, validar aparición en historial (`GET /versions`) y exportación `reports/versions`. Estado actual: build backend/frontend OK; `npm run test` backend OK; `npm run test:e2e` quedó omitido por bandera de integración (`E2E_INTEGRATION`).

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

- [x] **SMTP / envío de correo** — `MailModule` + Nodemailer; `POST /auth/forgot-password` envía correo si `SMTP_*` en env o SMTP configurado en **Configuración del sistema** (host no vacío). En desarrollo, si el envío no ocurre, se mantiene `resetUrl` / `debugToken` en la respuesta.
- [x] **Migraciones de base de datos** — carpeta `src/database/migrations`, `data-source.ts`, `npm run migration:run`, migración inicial vacía (baseline); `RUN_MIGRATIONS_ON_BOOT` opcional en `app.module`. Generar migraciones incrementales con `migration:generate` cuando exista CLI/BD de referencia (ver TypeORM 0.3).
- [x] **Documentación de despliegue** — `Docs/despliegue.md` (variables, SMTP dual, backups, checklist); `backend/.env.example` actualizado. *(Secretos: política descrita; cumplimiento = proceso de equipo.)*
- [x] **Secretos y configuración** — guía en `Docs/despliegue.md`: no commitear `.env` real, secretos en orquestador, rotación de JWT; cumplimiento operativo = proceso de equipo.
- [x] **Alta disponibilidad / continuidad** (RNF 2.2 ítem 6) — orientación en `Docs/despliegue.md` (SLA, `GET /api`, réplicas stateless, SQL Server, migraciones, backups); acuerdo y despliegue real = **ops**.

### Seguridad avanzada

- [x] **`@Roles()` en API de dominio** alineado con `Docs/roles por usuario.png` — requisitos, proyectos, versiones: `administrador`, `analista`; reportes: `administrador`, `analista`, `gerencia`, `consulta`; validación: lectura `administrador`, `analista`, `stakeholder`; solicitar `administrador`, `analista`; aprobar/rechazar/comentar `administrador`, `stakeholder`.
- [ ] **Revisión de endpoints restantes** — automatizado: `test/app.e2e-spec.ts` (`E2E_INTEGRATION=1`) con roles seed, adjuntos GET/POST PDF, **400** MIME inválido, **`GET /api/settings`**, **`GET /api/notifications/inbox`** (401 / 200 admin / 200 stakeholder), **`GET /api/audit`** (200 admin / 403 stakeholder). Pendiente: otras rutas bajo criterio de equipo.
- [ ] **Opcional:** validación más estricta de sesión en borde (p. ej. proxy Next) según política de amenaza.

### Producto y UX

- [ ] **Notificaciones** — campana con **`GET /notifications/inbox`** (`unreadCount`, ítems con `read`) y **`POST /notifications/mark-read`**; tabla `notification_reads`. Al abrir el panel se marcan como leídas las mostradas; el badge usa solo no leídas. Validaciones + (admin/analista) comentarios/adjuntos recientes. **Correo** al solicitar validación (SMTP + `FRONTEND_URL`). Pendiente: otros eventos (auditoría, `@`) u otros correos.
- [x] **PDF export “real” para datos tabulares** — PDF detallado de requisitos en Reportes (`jspdf-autotable`). La vista gráfica sigue pudiendo imprimirse con **Imprimir vista** (`window.print()`).
- [x] **Incluir en exportaciones** — CSV/PDF detallado incluyen `adjuntosCount` y `adjuntosNombres` (nombres separados por `; `). Backend `GET /reports/requirements-detail` agrega datos desde `requirement_attachments`.
- [x] **Toasts de éxito** — Requisitos (crear/editar/eliminar), proyectos, usuarios, comentarios, adjuntos (subir/eliminar), nueva versión, configuración del sistema; validación ya tenía toasts (`useValidate` / `useRequestValidation`).
- [ ] **Accesibilidad** ampliada: **tablas** (captions + `scope`); **Reportes** + **Validación** (filtros: `role="group"`, `aria-pressed`, `aria-label`); botones solo icono en tablas principales; topbar; **Sidebar** (`aria-current="page"`, `nav` etiquetado); **Dashboard** (region métricas + `sr-only` heading, iconos decorativos). **Contraste:** paginación requisitos. Pendiente: más vistas / grises. **Modales** `Modal`: dialog ARIA, Escape, foco. *(Ref. RNF usabilidad §2.2.)*

### Calidad técnica

- [x] **Pruebas e2e o de API** — `test/app.e2e-spec.ts`: salud, login, admin (adjuntos GET/POST PDF + **400** MIME inválido + **`GET /settings`** + **`GET /audit`** + **`GET /notifications/inbox`**); stakeholder (`/notifications/inbox`); gerencia/consulta; seeds demo. `E2E_INTEGRATION=1` + SQL Server.
- [x] **Migrar convención** `middleware` → **proxy** — `src/proxy.ts`, export `proxy()`; mismo matcher y lógica de auth. *(Next 16.)*

### Producto — posibles extensiones (no bloqueantes)

- [x] **Listado de requisitos**: columna con conteo de adjuntos (API: `loadRelationCountAndMap` en `GET /requirements`).
- [ ] **Permisos por rol**: evaluar si `gerencia`/`consulta` deben solo lectura en requisitos con adjuntos (hoy **no** tienen `GET /requirements`; solo reportes; e2e documenta 403 gerencia en listado de requisitos).

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
| 2026-04-12 | Revisión cumplimiento §2.1 / §2.2; matriz en documento; P4 ops vinculado a RNF alta disponibilidad |
| 2026-04-12 | P4: adjuntos en export detalle + columna conteo en tabla requisitos + toasts éxito en hooks principales |
| 2026-04-12 | P4: correo recuperación contraseña (Nodemailer), `MailModule`, `Docs/despliegue.md`, `.env.example` SMTP |
| 2026-04-12 | P4: migraciones TypeORM baseline + `migration:run`; e2e API con `E2E_INTEGRATION=1`; `AppController` health público |
| 2026-04-11 | Notificación por correo al solicitar validación (`MailService.sendValidationRequestedEmail`) |
| 2026-04-11 | Front: `middleware.ts` → `proxy.ts`; `Modal` con patrón dialog (ARIA, Escape, foco) |
| 2026-04-11 | Tablas dashboard: captions + `scope` col/row en vistas frecuentes |
| 2026-04-11 | `aria-label` en acciones tabla requisitos/proyectos/usuarios; paginación requisitos |
| 2026-04-11 | e2e API: rutas protegidas + rol stakeholder; seed stakeholder demo; política secretos despliegue |
| 2026-04-11 | Seed gerencia demo + e2e matriz reportes/requisitos; Reportes `aria-label` exportación |
| 2026-04-11 | Seed consulta + e2e adjuntos + consulta/reportes |
| 2026-04-11 | e2e POST multipart adjunto PDF |
| 2026-04-11 | e2e adjunto MIME inválido; HA en despliegue; a11y filtros Validación |
| 2026-04-11 | e2e `GET /api/settings` (401/200) y `GET /api/audit` (200/403); a11y Sidebar + Dashboard |
| 2026-04-11 | `GET /api/notifications/inbox` + campana (comentarios/adjuntos admin-analista); e2e inbox |

---

## Resumen: hecho vs pendiente (rápido)

| Área | §2.1 / §2.2 | Hecho (alto nivel) | Pendiente principal |
| ---- | ------------ | ------------------- | --------------------- |
| Alcance funcional | RF 1–8 | Registro, tipos, priorización ampliada, cambios, versiones, validación, reportes, búsqueda/filtros | — |
| No funcional | RNF 1–7 | Seguridad por rol, trazabilidad, navegadores modernos, feedback más visible en mutaciones | Usabilidad/UX y a11y en profundidad; rendimiento medido; escalado y **HA** en ops |
| Requisitos (producto) | — | Estados, comentarios, adjuntos, filtros, contador adjuntos en tabla | — |
| Reportes | — | CSV resumen, CSV/PDF detalle (incl. adjuntos) | — |
| Ops | RNF 6 | SMTP, guía despliegue, migraciones, e2e, orientación HA/backups en doc | Backups/restauración ejecutados en prod (proceso) |

---

*Cuando completes un bloque entero de prioridad, actualiza la fecha en la cabecera del documento.*
