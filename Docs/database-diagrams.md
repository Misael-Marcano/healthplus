# Diagramas de base de datos — HealthPlus

Fuente: entidades TypeORM en `backend/src/**/*.entity.ts`. Motor objetivo: **MSSQL** (tipos equivalentes en el diagrama lógico).

## Cómo visualizar


| Formato     | Uso                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **DBML**    | Abre [dbdiagram.io](https://dbdiagram.io), *Import* → pega o sube `[database.dbml](./database.dbml)`. Exporta a PNG/PDF/SQL desde el editor. |
| **Mermaid** | Vista previa en GitHub, VS Code (extensión Mermaid), o [mermaid.live](https://mermaid.live).                                                 |


---

## 1. Vista general (dominio principal)

```mermaid
erDiagram
  roles ||--o{ users : "role_id"
  users ||--o{ projects : "responsable_id"
  users ||--o{ requirements : "solicitante_id"
  users ||--o{ requirements : "responsable_id"
  users ||--o{ requirements : "created_by_user_id"
  projects ||--o{ requirements : "project_id"
  projects ||--o{ requirement_category_defs : "project_id"
  projects ||--o{ requirement_status_defs : "project_id"
  requirement_category_defs ||--o{ requirements : "category_def_id"
  requirement_status_defs ||--o{ requirements : "status_def_id"

  roles {
    int id PK
    string nombre UK
    string descripcion
    text permisos
  }

  users {
    int id PK
    string nombre
    string email UK
    bool activo
    int role_id FK
  }

  projects {
    int id PK
    string nombre
    string estado
    int responsable_id FK
    date fecha_inicio
    date fecha_fin
    bool deleted
  }

  requirement_category_defs {
    int id PK
    string nombre
    string slug
    int project_id FK
    int orden
    string color
    bool activo
    bool es_sistema
  }

  requirement_status_defs {
    int id PK
    string nombre
    string slug
    int project_id FK
    int orden
    string color
    bool activo
    bool es_sistema
  }

  requirements {
    int id PK
    string codigo UK
    string titulo
    text descripcion
    string tipo
    string categoria
    json categorias
    int category_def_id FK
    string prioridad
    int impacto
    int urgencia
    int esfuerzo
    int valor
    string estado
    int status_def_id FK
    text criterios_aceptacion
    int version
    bool deleted
    int project_id FK
    int solicitante_id FK
    int responsable_id FK
    int created_by_user_id FK
  }
```



---

## 2. Requisito: versiones, validaciones, comentarios y adjuntos

```mermaid
erDiagram
  requirements ||--o{ requirement_versions : "requirement_id"
  requirements ||--o{ requirement_validations : "requirement_id"
  requirements ||--o{ requirement_comments : "requirement_id"
  requirements ||--o{ requirement_attachments : "requirement_id"
  users ||--o{ requirement_versions : "creado_por_id"
  users ||--o{ requirement_validations : "validador_id"
  users ||--o{ requirement_validations : "solicitado_por_id"
  users ||--o{ requirement_comments : "user_id"
  users ||--o{ requirement_attachments : "subido_por_id"

  requirements {
    int id PK
  }

  requirement_versions {
    int id PK
    int requirement_id FK
    int version
    string titulo
    text descripcion
    text criterios_aceptacion
    string motivo_cambio
    int creado_por_id FK
  }

  requirement_validations {
    int id PK
    int requirement_id FK
    int validador_id FK
    int solicitado_por_id FK
    string estado
    text comentario
  }

  requirement_comments {
    int id PK
    int requirement_id FK
    int user_id FK
    text texto
    text menciones
  }

  requirement_attachments {
    int id PK
    int requirement_id FK
    string nombre_original
    string ruta_almacenamiento
    string mime_type
    int tamano_bytes
    int subido_por_id FK
  }
```



---

## 3. Auditoría, autenticación, configuración y notificaciones

```mermaid
erDiagram
  users ||--o{ audit_logs : "user_id"
  users ||--o{ notification_reads : "user_id"

  users {
    int id PK
  }

  audit_logs {
    int id PK
    string accion
    string entidad
    int entidad_id
    text detalle
    int user_id FK
    string ip_address
  }

  password_resets {
    int id PK
    string email
    string token
    datetime expires_at
  }

  system_settings {
    int id PK
    text data_json
    datetime updated_at
  }

  notification_reads {
    int id PK
    int user_id FK
    string kind
    int ref_id
    datetime read_at
  }
```



---

## Tablas (resumen)


| Tabla                       | Descripción breve                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `roles`                     | Catálogo de roles; incluye `permisos` (JSON) para matriz UI/cliente.               |
| `users`                     | Usuarios; FK a `roles`.                                                            |
| `projects`                  | Proyectos; responsable opcional (`users`).                                         |
| `requirement_category_defs` | Categorías de requisito (por proyecto o globales); único `(slug, project_id)`.     |
| `requirement_status_defs`   | Estados configurables; único `(slug, project_id)`.                                 |
| `requirements`              | Requisitos; núcleo del dominio. Incluye `created_by_user_id` (creador) y `categorias` (JSON, slugs múltiples). |
| `requirement_versions`      | Historial de versiones de contenido.                                                 |
| `requirement_validations`   | Validaciones por validador; opcional `solicitado_por_id` (quien pidió la validación). |
| `requirement_comments`      | Comentarios; columna `menciones` (JSON array de IDs de usuarios).                  |
| `requirement_attachments`   | Metadatos de archivos subidos.                                                     |
| `audit_logs`                | Trazabilidad de acciones.                                                          |
| `password_resets`           | Tokens de recuperación de contraseña.                                              |
| `system_settings`           | Configuración global (`data` JSON); clave primaria fija (no identity), típ. `id=1`. |
| `notification_reads`        | Marca de lectura por usuario (`kind` + `ref_id`); único `(user_id, kind, ref_id)`. |


---

## Mantenimiento

Tras añadir o cambiar entidades TypeORM, actualiza `database.dbml` y los bloques Mermaid de este archivo para que sigan alineados con el código.
