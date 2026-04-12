# Roles y acceso por usuario — HealthPlus

**Fuente visual oficial:** `[roles por usuario.png](roles%20por%20usuario.png)` — matriz **Permisos por Rol** (badges por rol: Administrador, Analista TI, Stakeholder, Gerencia, Consulta).

El frontend y la tabla de **Usuarios** replican esta matriz. La lógica de rutas vive en `frontend/src/lib/permissions.ts` (`canAccessPath`, `canValidateRequirements`, `canViewReports`, etc.).

---

## Matriz de permisos (según la imagen)


| Permiso            | Administrador | Analista TI | Stakeholder | Gerencia | Consulta |
| ------------------ | ------------- | ----------- | ----------- | -------- | -------- |
| Gestionar usuarios | ✓             | —           | —           | —        | —        |
| Crear requisitos   | ✓             | ✓           | —           | —        | —        |
| Editar requisitos  | ✓             | ✓           | —           | —        | —        |
| Validar requisitos | ✓             | —           | ✓           | —        | —        |
| Ver reportes       | ✓             | ✓           | —           | ✓        | ✓        |
| Configuración      | ✓             | —           | —           | —        | —        |


- **Validar** = aprobar / rechazar / comentar en el flujo de validación (UI solo para administrador y stakeholder).
- **Solicitar validación** (enviar un requisito a validar) la usan administrador y analista TI desde la pantalla Validación; no es la misma fila que “Validar requisitos”.

---

## Navegación por rol (implementación)


| Ruta / sección                      | administrador | analista | stakeholder | gerencia | consulta |
| ----------------------------------- | ------------- | -------- | ----------- | -------- | -------- |
| Dashboard                           | ✓             | ✓        | —           | —        | —        |
| Requisitos, Proyectos, Priorización | ✓             | ✓        | —           | —        | —        |
| Validación                          | ✓             | ✓        | ✓           | —        | —        |
| Reportes                            | ✓             | ✓        | —           | ✓        | ✓        |
| Auditoría, Usuarios, Configuración  | ✓             | —        | —           | —        | —        |


- **Stakeholder:** solo **Validación** en el menú; al iniciar sesión se abre `/validacion`.
- **Gerencia** y **consulta:** solo **Reportes**; al iniciar sesión se abre `/reportes`.
- **Analista:** no ve acciones de **validar** (aprobar/rechazar) en la pantalla Validación; sí puede **solicitar** validación.

---

## API (resumen)

`RolesGuard` + `@Roles()` aplican en los controladores. Resumen alineado con la matriz:

- **Requisitos** (`/api/requirements`) y **proyectos** (`/api/projects`) y **versiones** (`/api/requirements/:id/versions`): **administrador**, **analista**.
- **Reportes** (`/api/reports/*`): **administrador**, **analista**, **gerencia**, **consulta**.
- **Validación** (`/api/validation`): `GET` pendiente e historial — **administrador**, **analista**, **stakeholder**; `POST` solicitar — **administrador**, **analista**; `PATCH` aprobar/rechazar/comentar — **administrador**, **stakeholder**.
- **Usuarios / roles / auditoría** y `PATCH /api/settings`: principalmente **administrador** (ver Swagger).

Autenticación: `POST /api/auth/login` (opción `remember`), recuperación: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`. Detalle: **Swagger** en `/api/docs`.