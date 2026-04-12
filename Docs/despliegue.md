# Despliegue — HealthPlus (backend + frontend)

## Variables de entorno — API (NestJS)

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `PORT` | No | Puerto HTTP (por defecto 3001). |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Sí | SQL Server. |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Sí prod | Firmar access/refresh tokens. |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN_REMEMBER` | No | Duraciones (ej. `8h`, `7d`, `30d`). |
| `FRONTEND_URL` | Sí prod | URL base del front (CORS + enlaces en correos: recuperación de contraseña, **notificación al validador** al solicitar validación). Sin barra final. Ej. `https://requisitos.clinica.com`. |
| `NODE_ENV` | No | `production` desactiva `synchronize` de TypeORM en el `app.module` actual. |
| `UPLOAD_DIR` | No | Carpeta de adjuntos de requisitos (por defecto relativa al proceso). |
| **SMTP (opcional)** | No | Ver abajo. |

### Correo (recuperación de contraseña y validación)

1. **Variables `SMTP_*` en el servidor** (recomendado en Docker/K8s con secretos):  
   `SMTP_HOST`, `SMTP_PORT` (587 típico), `SMTP_SECURE=false` salvo puerto 465, `SMTP_USER`, `SMTP_PASSWORD`, opcional `SMTP_FROM`, opcional `SMTP_TLS_REJECT_UNAUTHORIZED=false`.

2. **Sin variables de entorno:** se usa el SMTP configurado en **Configuración del sistema** en la aplicación (host, puerto, usuario y contraseña persistidos en `system_settings`).

Si no hay SMTP por ninguno de los dos medios, el flujo “Olvidé contraseña” sigue respondiendo el mensaje genérico; en **desarrollo** (`NODE_ENV=development`) la API puede devolver `resetUrl` y `debugToken` cuando el envío no se realiza.

**Solicitud de validación:** al asignar un validador a un requisito (`POST /validation/request/:id`), si SMTP está configurado se envía un correo al validador con enlaces a `/validacion` y al detalle del requisito. Si no hay SMTP, la solicitud se registra igual (sin correo).

Ejemplo en `.env`: copiar desde `backend/.env.example`.

## Frontend (Next.js)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL base de la API (ej. `https://api.clinica.com/api` o `http://localhost:3001/api`). |

Build producción: `npm run build` → `npm run start` o imagen Docker según `frontend/Dockerfile`.

## Datos y archivos

- **Base de datos:** backups periódicos de la BD SQL Server (restauración probada en un entorno de prueba).
- **Adjuntos:** carpeta física configurada con `UPLOAD_DIR` (o valor por defecto); incluir en copias de seguridad junto a la BD.
- **Secretos (cumplimiento proceso de equipo):**
  - No incluir `.env` con contraseñas de BD, JWT ni SMTP en el repositorio (mantener en `.gitignore`).
  - En producción: variables o secretos del orquestador (Kubernetes Secrets, Azure Key Vault, AWS Secrets Manager, etc.); rotar `JWT_SECRET` / `JWT_REFRESH_SECRET` respecto a desarrollo.
  - Documentar quién renueva credenciales y con qué frecuencia; el código no sustituye una política interna de secretos.

## Alta disponibilidad y continuidad (orientación)

Referencia RNF 2.2 (disponibilidad en jornada laboral). El cumplimiento depende de **infraestructura y proceso**, no solo del código.

- **SLA:** acordar con negocio/operaciones el objetivo de disponibilidad (p. ej. 99 % en horario laboral) y cómo se mide.
- **Salud de la API:** usar `GET /api` (público) para comprobaciones de balanceador, Kubernetes liveness/readiness o monitor externo (latencia, ratio 5xx).
- **Escalado:** varias réplicas de la API detrás de balanceador; sesión **stateless** (JWT) para no depender de sticky sessions.
- **Base de datos:** alta disponibilidad según edición de SQL Server (p. ej. Always On); pruebas de conmutación documentadas.
- **Despliegues:** ventanas de mantenimiento comunicadas; migraciones (`npm run migration:run` o `RUN_MIGRATIONS_ON_BOOT`) coordinadas con **backup previo**.
- **Backups:** copias periódicas de BD y de la carpeta de adjuntos (`UPLOAD_DIR`); **restauración probada** en entorno no productivo.

## Migraciones TypeORM

- Archivos en `backend/src/database/migrations/`. Script: `npm run migration:run` (desde `backend/`, con `.env` y SQL Server accesible). Usa `src/database/run-migrations.ts` y `data-source.ts`.
- En arranque de la API, **`RUN_MIGRATIONS_ON_BOOT=true`** ejecuta migraciones al iniciar (opcional; útil en contenedores si no hay otro paso).
- En desarrollo suele usarse `synchronize: true` (no sustituye migraciones en producción).

## Pruebas e2e (API)

- `npm run test:e2e` — por defecto **omite** la suite que necesita BD (no falla en CI sin SQL Server).
- Con base de datos disponible: `E2E_INTEGRATION=1 npm run test:e2e` (PowerShell: `$env:E2E_INTEGRATION='1'; npm run test:e2e`).
- La suite valida salud pública, login, ausencia de token en rutas protegidas, **`GET /api/settings`** y **`GET /api/notifications/inbox`** (401 sin token), **`GET /api/audit`** (200 admin / 403 stakeholder), **adjuntos** (`GET .../attachments`: 401 sin token, 404 admin si el requisito no existe, 403 stakeholder/consulta), **POST multipart** PDF válido y **POST** con `.txt` → **400** (MIME no permitido), y usuarios sembrados (`SeedService`): **administrador** `admin@healthplus.com` / `Admin@1234`, **stakeholder** `stakeholder@healthplus.com` / `Stake@1234`, **gerencia** `gerencia@healthplus.com` / `Gerencia@1234`, **consulta** `consulta@healthplus.com` / `Consulta@1234`. **Gerencia** y **consulta**: **200** en reportes, **403** en listados de requisitos/adjuntos/usuarios según matriz.

## Checklist go-live (resumen)

- [ ] `FRONTEND_URL` y `NEXT_PUBLIC_API_URL` apuntan a URLs públicas HTTPS.
- [ ] JWT y BD con credenciales fuertes, distintas de desarrollo.
- [ ] SMTP operativo (env o pantalla de configuración) si se requiere correo real de recuperación y/o avisos de validación.
- [ ] Probar flujo: login, CRUD requisito, adjunto, reporte CSV.
- [ ] Plan de backup BD + carpeta de uploads documentado para operaciones.
