# HealthPlus

Sistema web para **gestionar el ciclo de vida de requisitos de software** en un entorno sanitario (clínica u organización de salud). Centraliza el registro, la priorización, la validación por partes interesadas, el seguimiento por proyectos y la generación de reportes, con **trazabilidad** desde la creación hasta la aprobación y cambios posteriores.

---

## Visión general

HealthPlus responde a la necesidad de que TI y negocio compartan una **fuente única de verdad** sobre qué se pide, en qué estado está cada petición y quién la validó. En lugar de hojas de cálculo o correos sueltos, el equipo trabaja sobre **requisitos vinculados a proyectos**, con historial de versiones, comentarios, adjuntos y un flujo explícito de **validación** (aprobar o rechazar) por roles definidos.

El producto está pensado para **usuarios no técnicos** (gestión, áreas clínicas como stakeholders) y para **analistas o administradores de sistemas**, con una interfaz en español y permisos distintos según el rol.

---

## Qué hace el sistema (por áreas)

### Requisitos

- Alta y edición de requisitos con **código autogenerado**, título, descripción, tipo (**funcional** / **no funcional**), proyecto, responsable, solicitante y metadatos de estado.
- **Búsqueda y filtros** (por proyecto, estado, prioridad, tipo, texto en código/título, etc.) y listados paginados para localizar información rápidamente.
- **Gestión del cambio**: las modificaciones quedan reflejadas en el propio requisito y, donde aplica, en el **historial de versiones** con motivo de cambio.

### Proyectos

- Los requisitos se agrupan bajo **proyectos** (iniciativas o líneas de trabajo de la organización), lo que permite escalar a medida que la clínica incorpora nuevos proyectos sin perder el orden.

### Priorización

- Prioridad operativa (**crítica**, **alta**, **media**, **baja**) y una **matriz de priorización** persistente con criterios numéricos (por ejemplo impacto, urgencia, esfuerzo y valor en escala 1–5), visible en la pantalla dedicada para apoyar decisiones de ordenación.

### Validación y aprobación

- Flujo de **validación por stakeholders internos**: solicitud de validación, revisión y decisión alineada con roles (p. ej. administrador y stakeholder pueden validar según la matriz de permisos del producto).
- Complementa la trazabilidad formal con **comentarios** y **adjuntos** asociados al requisito.

### Reportes

- **Indicadores y resúmenes** del estado y la evolución de los requisitos.
- **Exportación** a CSV (resumen y listados) y generación de informes detallados (p. ej. PDF) para comunicar avance a gerencia u otras áreas autorizadas.

### Auditoría

- Registro de **acciones relevantes** (creación de requisitos, cambios, etc.) para cumplir requisitos de trazabilidad y revisión posterior; el acceso completo a esta área está restringido normalmente a **administración**.

### Usuarios y roles

- **Autenticación** con JWT (sesión web basada en cookies donde corresponde) y flujos de **recuperación de contraseña** (olvido / restablecimiento).
- **Roles** típicos: administrador, analista, stakeholder, gerencia, consulta (y variantes según despliegue). Cada rol determina qué pantallas y acciones están disponibles (por ejemplo: solo validación para stakeholder; reportes para gerencia/consulta; administración de usuarios y configuración sensible solo para administrador).

### Configuración del sistema

- Parámetros globales de la aplicación **persistidos en servidor** (organización, ajustes que el producto exponga en API), de modo que no dependan solo del navegador.

### Notificaciones

- **Bandeja / campana** orientada a actividad reciente relevante para quien valida o gestiona (p. ej. validaciones pendientes, comentarios o adjuntos recientes), integrada con la API de notificaciones.

---

## Arquitectura técnica (resumen)


| Capa              | Tecnología                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | [Next.js](https://nextjs.org/) (App Router), React, TypeScript, TanStack Query, Tailwind CSS                                |
| **Backend**       | [NestJS](https://nestjs.com/), TypeScript, API REST bajo prefijo típico `/api`, documentación Swagger donde esté habilitada |
| **Base de datos** | Microsoft SQL Server ([TypeORM](https://typeorm.io/), entidades y migraciones en el backend)                                |


Los datos sensibles y la lógica de negocio viven en el **servidor**; el cliente aplica **permisos de interfaz** alineados con el control de acceso en API (roles, guards).

---

## Estructura del repositorio

```
HealthPlus/
├── backend/      # API NestJS, entidades, migraciones, seeds
├── frontend/     # Aplicación web Next.js
└── Docs/         # Documentación adicional (planes, despliegue, diagramas, etc.)
```

---

## Puesta en marcha

1. **Backend**: instalar dependencias, configurar variables de entorno (véase `backend/.env.example`) y arrancar en modo desarrollo (`npm run start:dev` en `backend/`).
2. **Frontend**: instalar dependencias y ejecutar el servidor de desarrollo (`npm run dev` en `frontend/`), apuntando al origen de la API según tu entorno.

Para detalles de despliegue, variables y operación, consulta la documentación en `Docs/` (por ejemplo `Docs/despliegue.md` si está presente en tu copia del repositorio).

---

## Documentación relacionada

- Seguimiento funcional y roadmap: `Docs/plan_pendientes_healthplus.md`
- Diagramas o modelo de datos: `Docs/database-diagrams.md`, `Docs/database.dbml` (si aplica)

---

*HealthPlus — gestión integral de requisitos para entornos de salud.*