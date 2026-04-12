# Plan de Desarrollo del Proyecto

## Sistema de Gestión de Requisitos – HealthPlus Clínica Integral

## 1. Resumen ejecutivo

El proyecto consiste en el desarrollo de un **Sistema de Gestión de Requisitos** para **HealthPlus Clínica Integral**, orientado al área tecnológica de la organización. Su propósito es centralizar, organizar, priorizar, validar y dar seguimiento a los requisitos de proyectos de software internos, resolviendo problemas actuales como el uso de herramientas no especializadas, la falta de control de cambios, la poca trazabilidad y la ausencia de reportes claros.

A partir del análisis del brief, los documentos de levantamiento y el mockup entregado, se concluye que el proyecto es **viable**, tiene un alcance **realista** y puede ejecutarse con una arquitectura moderna basada en:

- **Frontend:** Next.js + TailwindCSS
- **Backend:** NestJS
- **Base de datos:** SQL Server
- **Contenedorización:** Docker

El enfoque recomendado es desarrollar primero un **MVP sólido**, centrado en la trazabilidad, control de cambios, validación y reportes, para luego ampliar funcionalidades en una segunda fase.

---

## 2. Contexto del proyecto

HealthPlus Clínica Integral es una clínica privada ubicada en Santo Domingo, República Dominicana. El sistema propuesto no estará orientado a la gestión clínica ni de pacientes, sino al control de requisitos de los proyectos de software internos del área TI.

### Problemática identificada

Actualmente, la gestión de requisitos presenta las siguientes debilidades:

- Uso de Word y Excel como herramientas principales
- Falta de estandarización en el registro de requisitos
- Cambios sin control formal
- Dificultad para identificar la versión vigente
- Comunicación limitada entre áreas
- Escasa trazabilidad
- Ausencia de reportes automatizados

Estas debilidades afectan la calidad de los proyectos tecnológicos y dificultan la toma de decisiones.

---

## 3. Objetivo general

Desarrollar un sistema web que permita administrar de forma eficiente los requisitos de los proyectos tecnológicos internos de HealthPlus Clínica Integral, asegurando su correcta definición, análisis, priorización, validación, seguimiento y control de cambios.

## 4. Objetivos específicos

- Centralizar el registro de requisitos en una sola plataforma.
- Clasificar requisitos funcionales y no funcionales.
- Facilitar la priorización según impacto e importancia.
- Controlar cambios y versiones.
- Permitir la validación con stakeholders internos.
- Generar reportes de apoyo a la toma de decisiones.
- Mantener trazabilidad e historial de modificaciones.

---

## 5. Alcance funcional

### Incluye

- Registro y gestión de requisitos
- Clasificación en requisitos funcionales y no funcionales
- Priorización de requisitos
- Gestión de cambios y versiones
- Validación de requisitos con stakeholders
- Reportes de estado del proyecto
- Gestión de usuarios internos y roles
- Dashboard con métricas clave
- Historial y auditoría de cambios

### No incluye

- Gestión de pacientes
- Integración con seguros médicos
- Pasarelas de pago
- Integración con sistemas clínicos externos

---

## 6. Stakeholders del sistema

### Stakeholders principales

- **Equipo de Tecnología (TI):** usuario principal del sistema
- **Personal administrativo:** consulta y seguimiento de reportes
- **Médicos:** validación de necesidades funcionales
- **Gerentes:** supervisión y toma de decisiones
- **Analistas de sistemas:** documentación, análisis y priorización

### Traducción a roles del sistema

Se recomienda implementar los siguientes roles:

1. **Administrador**
  - Gestiona usuarios, roles, catálogos y parámetros del sistema.
2. **Analista TI**
  - Registra, actualiza, prioriza y da seguimiento a requisitos.
3. **Stakeholder validador**
  - Revisa, comenta, valida o rechaza requisitos.
4. **Gerencia**
  - Consulta métricas, reportes y estado general de proyectos.
5. **Consulta**
  - Acceso limitado a visualización según permisos.

---

## 7. Requisitos clave del sistema

### Requisitos funcionales principales

- Crear, editar, consultar y dar seguimiento a requisitos.
- Asociar requisitos a proyectos.
- Clasificar requisitos por tipo, categoría y estado.
- Priorizar requisitos por impacto, urgencia y esfuerzo.
- Gestionar versiones e historial de cambios.
- Validar requisitos con stakeholders.
- Generar reportes y métricas.
- Gestionar usuarios, roles y permisos.
- Registrar auditoría de eventos clave.

### Requisitos no funcionales sugeridos

- Interfaz responsiva y fácil de usar.
- Seguridad basada en autenticación y autorización por roles.
- Buen rendimiento en listados y reportes.
- Trazabilidad completa de cambios.
- Escalabilidad modular.
- Despliegue mediante contenedores Docker.
- API documentada y mantenible.

---

## 8. Arquitectura recomendada

## 8.1 Frontend

**Tecnología:** Next.js + TailwindCSS + TypeScript

### Recomendaciones

- Usar **App Router**.
- Usar **TypeScript** desde el inicio.
- Formularios con **React Hook Form + Zod**.
- Gestión de datos con **TanStack Query**.
- Componentes reutilizables y diseño responsive.
- Layout administrativo con sidebar, topbar y vistas de detalle.

### Vistas principales

- Login
- Dashboard
- Lista de requisitos
- Detalle de requisito
- Priorización
- Validación
- Reportes
- Configuración
- Gestión de usuarios
- Gestión de proyectos

## 8.2 Backend

**Tecnología:** NestJS

### Recomendaciones

- Arquitectura modular por dominio.
- Autenticación con JWT.
- Guards para control de acceso.
- DTOs con validaciones.
- Swagger para documentación.
- Manejo centralizado de errores.
- Logs y auditoría.

### Módulos sugeridos

- Auth
- Users
- Roles / Permissions
- Projects
- Requirements
- Prioritization
- Versions
- Validation
- Reports
- Audit
- Settings

## 8.3 Base de datos

**Tecnología:** SQL Server

### Recomendaciones

- Modelo relacional normalizado.
- Índices para filtros frecuentes.
- Soft delete donde aplique.
- Campos de auditoría estándar en tablas críticas.
- Scripts versionados o migraciones controladas.

---

## 9. Modelo funcional propuesto

## 9.1 Flujo de vida del requisito

Se recomienda definir un flujo estándar como el siguiente:

**Borrador -> En revisión -> Validado -> Aprobado -> Implementado -> Cerrado**

Estados alternos:

- Rechazado
- Cancelado
- Requiere ajuste

## 9.2 Estructura mínima del requisito

Cada requisito debería contener como mínimo:

- Código único
- Título
- Descripción
- Tipo (funcional / no funcional)
- Categoría
- Proyecto asociado
- Prioridad
- Estado
- Solicitante / stakeholder origen
- Responsable TI
- Criterios de aceptación
- Versión actual
- Fecha de creación
- Fecha de actualización
- Comentarios
- Historial de cambios

## 9.3 Gestión de versiones

Se recomienda distinguir dos tipos de modificación:

- **Cambio menor:** actualiza metadatos sin crear nueva versión.
- **Cambio mayor:** altera definición, alcance o criterios y crea nueva versión.

Cada nueva versión debe guardar:

- número de versión
- descripción del cambio
- usuario que lo realizó
- fecha
- motivo del cambio

---

## 10. Módulos funcionales del MVP

## 10.1 Autenticación y usuarios

- Inicio de sesión
- Cierre de sesión
- Gestión de usuarios
- Roles y permisos
- Recuperación de contraseña

## 10.2 Gestión de proyectos

- Crear proyecto
- Editar proyecto
- Asignar responsables
- Consultar avance
- Asociar requisitos

## 10.3 Gestión de requisitos

- Crear requisito
- Editar requisito
- Ver detalle
- Filtrar por proyecto, estado, prioridad y tipo
- Eliminar lógico

## 10.4 Priorización

- Priorización manual
- Impacto
- Urgencia
- Esfuerzo
- Valor para negocio

## 10.5 Cambios y versiones

- Crear nueva versión
- Ver historial
- Consultar trazabilidad

## 10.6 Validación

- Solicitar validación
- Aprobar
- Rechazar
- Comentar observaciones

## 10.7 Dashboard y reportes

- Totales por estado
- Requisitos pendientes
- Requisitos aprobados
- Requisitos en revisión
- Requisitos por proyecto
- Requisitos por prioridad
- Requisitos con más cambios

## 10.8 Auditoría

- Registro de acciones del usuario
- Cambios de estado
- Cambios de prioridad
- Validaciones realizadas
- Ediciones y versionado

---

## 11. Diseño de base de datos propuesto

Tablas principales sugeridas:

- `users`
- `roles`
- `permissions`
- `user_roles`
- `projects`
- `stakeholders`
- `requirements`
- `requirement_types`
- `requirement_statuses`
- `requirement_priorities`
- `requirement_versions`
- `requirement_change_log`
- `requirement_validations`
- `requirement_comments`
- `attachments`
- `audit_logs`

### Relaciones principales

- Un proyecto tiene muchos requisitos.
- Un requisito tiene muchas versiones.
- Un requisito tiene muchas validaciones.
- Un requisito puede tener muchos comentarios.
- Un requisito pertenece a un proyecto y a un stakeholder origen.
- Un usuario puede ser responsable de múltiples requisitos.

---

## 12. API propuesta

## Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`

## Users

- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `GET /users/:id`

## Projects

- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id`
- `GET /projects/:id`

## Requirements

- `GET /requirements`
- `POST /requirements`
- `GET /requirements/:id`
- `PATCH /requirements/:id`
- `DELETE /requirements/:id`

## Versions / History

- `GET /requirements/:id/versions`
- `POST /requirements/:id/versions`
- `GET /requirements/:id/history`

## Validation

- `POST /requirements/:id/validate`
- `POST /requirements/:id/reject`
- `GET /requirements/:id/validations`

## Reports

- `GET /reports/dashboard`
- `GET /reports/requirements-summary`
- `GET /reports/by-project`
- `GET /reports/by-status`

---

## 13. Roadmap de desarrollo

## Fase 0. Descubrimiento y definición

**Duración estimada:** 3 a 5 días

### Entregables

- Requisitos refinados
- Casos de uso
- Roles y permisos
- Flujo de estados
- Definición del MVP
- Backlog inicial

## Fase 1. Setup técnico y arquitectura

**Duración estimada:** 4 a 6 días

### Entregables

- Estructura de frontend y backend
- Configuración base de NestJS y Next.js
- TailwindCSS
- Docker
- SQL Server en contenedor
- Variables de entorno
- Linters y formateo

## Fase 2. Base de datos y backend core

**Duración estimada:** 1 a 2 semanas

### Entregables

- Modelo relacional
- Scripts/migraciones
- Auth
- Users
- Roles
- Projects
- Requirements
- Auditoría base

## Fase 3. Frontend core

**Duración estimada:** 1 a 2 semanas

### Entregables

- Login
- Dashboard inicial
- CRUD de requisitos
- Gestión de proyectos
- Navegación general
- Componentes reutilizables

## Fase 4. Versionado y validación

**Duración estimada:** 1 semana

### Entregables

- Historial de cambios
- Versiones
- Validación de requisitos
- Comentarios y observaciones

## Fase 5. Reportes y estabilización

**Duración estimada:** 4 a 6 días

### Entregables

- Reportes principales
- Dashboard completo
- Filtros avanzados
- Corrección de errores
- Pruebas funcionales

## Fase 6. Despliegue y documentación

**Duración estimada:** 3 a 5 días

### Entregables

- Docker Compose final
- Guía de despliegue
- Manual técnico
- Manual de usuario
- Respaldo inicial de base de datos

---

## 14. Dockerización propuesta

## Servicios recomendados

- `frontend`
- `backend`
- `sqlserver`
- `nginx` opcional

## Variables de entorno sugeridas

### Frontend

- `NEXT_PUBLIC_API_URL`

### Backend

- `PORT`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`

### Base de datos

- `ACCEPT_EULA=Y`
- `SA_PASSWORD=...`

## Beneficios de dockerizar desde el inicio

- Entorno uniforme para desarrollo y pruebas
- Reducción de errores de configuración
- Despliegue más controlado
- Facilidad para presentar el proyecto

---

## 15. Riesgos del proyecto y mitigación

### Riesgo 1. Ambigüedad en reglas del negocio

**Mitigación:** bajar requisitos a historias de usuario y criterios de aceptación.

### Riesgo 2. Cambios frecuentes de alcance

**Mitigación:** definir y congelar el MVP antes del desarrollo completo.

### Riesgo 3. Modelo de permisos insuficiente

**Mitigación:** diseñar matriz de permisos desde la fase inicial.

### Riesgo 4. Sobrecarga funcional desde el inicio

**Mitigación:** priorizar primero trazabilidad, validación y reportes.

### Riesgo 5. Baja adopción del sistema

**Mitigación:** interfaz simple, capacitación breve y enfoque en necesidades reales.

---

## 16. Historias de usuario iniciales

- Como analista TI, quiero registrar un requisito para documentar necesidades del proyecto.
- Como analista TI, quiero clasificar un requisito para organizarlo correctamente.
- Como gerente, quiero consultar reportes para apoyar la toma de decisiones.
- Como stakeholder, quiero validar requisitos para confirmar que representan mis necesidades.
- Como administrador, quiero gestionar usuarios y permisos para controlar accesos.
- Como analista, quiero consultar el historial de cambios para tener trazabilidad.
- Como usuario interno, quiero filtrar requisitos por estado, prioridad y proyecto para encontrar información rápidamente.

---

## 17. Prioridad recomendada de construcción

Orden sugerido de implementación:

1. Autenticación y roles
2. Gestión de proyectos
3. CRUD de requisitos
4. Estados y prioridades
5. Historial de cambios
6. Validación
7. Dashboard
8. Reportes
9. Adjuntos
10. Mejoras UX

---

## 18. Conclusión

El Sistema de Gestión de Requisitos para HealthPlus Clínica Integral es un proyecto bien encaminado, con un alcance adecuado y una necesidad real claramente identificada. La combinación de **Next.js, TailwindCSS, NestJS, SQL Server y Docker** es apropiada para construir una solución moderna, escalable y mantenible.

La recomendación principal es desarrollar primero un **MVP enfocado en el control, la trazabilidad y la validación**, asegurando valor funcional desde las primeras iteraciones. A partir de esa base, el sistema podrá evolucionar con nuevas capacidades sin comprometer la calidad técnica ni el cumplimiento del alcance definido.