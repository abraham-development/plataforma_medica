# AGENTS.md

## Producto y arquitectura actual

MediCerca es un MVP de atención médica para Lima Metropolitana. Conecta pacientes y médicos mediante dos modalidades exactas:

- `VIRTUAL`: consulta virtual.
- `HOME_VISIT`: atención a domicilio.

Es un monorepo administrado con pnpm y Turborepo:

- `apps/web`: Next.js 16, interfaz pública y paneles por rol.
- `apps/api`: NestJS 11, API y reglas de negocio.
- `packages/api-client`: tipos y utilidades compartidas.
- `migrations`: esquema, funciones y políticas de InsForge/Postgres.
- InsForge: autenticación, Postgres y demás servicios administrados; no se despliega en Hostinger.

El producto es uno, pero Next.js y NestJS son dos procesos desplegables. No describir esta arquitectura como microservicios: el backend sigue siendo una API modular única.

## Reglas funcionales que deben conservarse

- El registro permite únicamente `PATIENT` y `DOCTOR`, exige verificación OTP por correo y completa el rol solo después de verificar la cuenta.
- `ADMIN` nunca se puede elegir en el registro público.
- Pacientes: pueden buscar médicos, revisar especialidades y reservar según la disponibilidad publicada.
- Médicos: tienen un espacio propio con `Resumen`, `Perfil profesional`, `Agenda` y `Disponibilidad`. No deben ver el menú público para buscar médicos ni reservar citas.
- La disponibilidad médica usa fechas concretas, bloques de 30 minutos, zona horaria `America/Lima` y únicamente modalidades habilitadas en el perfil profesional.
- Los roles y permisos funcionales se basan en `recursos_internos/roles.md`.

## Desarrollo local

Ejecutar desde la raíz:

```bash
corepack pnpm install
corepack pnpm dev
```

Puertos locales:

- Next.js: `http://localhost:3000`.
- NestJS: `http://localhost:4000`.
- API base: `http://localhost:4000/api/v1`.
- Swagger: `http://localhost:4000/api/docs`.

El script `predev` prepara un shim local de pnpm mediante Corepack cuando Turbo lo necesita en desarrollo. No agregar un `postinstall` que ejecute `corepack enable`: los entornos administrados de Hostinger ya proporcionan pnpm y bloquean la creación manual de ese enlace durante la instalación. No recomendar `npm run dev -- --port 3000` para este monorepo.

## Variables de entorno

- `.env.example`: plantilla versionada sin secretos.
- `.env.local`: desarrollo local; valores reales y fuera de Git.
- `.env.production`: referencia para producción/Docker; valores reales y fuera de Git.
- No crear `.env.desarrollo` ni `.env.produccion`.
- No hardcodear claves ni copiar valores sensibles en documentación, pruebas o mensajes.
- Cualquier variable `NEXT_PUBLIC_*` queda expuesta al navegador; solo puede contener URL pública y anon key.
- `INSFORGE_API_KEY` es administrativa, se usa únicamente en tareas puntuales del servidor y nunca puede llamarse `NEXT_PUBLIC_INSFORGE_API_KEY`.

Turbo separa las variables de cada proceso. En particular, no pasar `PORT=4000` a Next.js: ese valor corresponde exclusivamente a la API local.

## Despliegue vigente en Hostinger

La estrategia actual es **Hostinger Deploy Web App administrado**, sin Docker Compose:

1. Desplegar Next.js como una Web App, por ejemplo en `medicerca.com`.
2. Desplegar NestJS como otra Web App desde el mismo repositorio, por ejemplo en `api.medicerca.com`.
3. Registrar las variables de cada aplicación en el panel de Hostinger; no subir `.env.production`.

Comandos desde la raíz del repositorio:

```bash
# Web
corepack pnpm --filter @medicerca/web build
corepack pnpm --filter @medicerca/web start

# API
corepack pnpm --filter @medicerca/api build
corepack pnpm --filter @medicerca/api start
```

Para la API administrada por Hostinger usar el puerto entregado por la plataforma; si se configura manualmente, Hostinger espera `PORT=3000`. Esto no cambia el puerto local `4000`, porque las dos Web Apps están aisladas.

`Dockerfile` y `docker-compose.yml` se conservan como alternativa futura para un VPS con Docker. No usarlos en el flujo actual de Deploy Web App ni asumir que Docker Compose es necesario por el tamaño del proyecto.

## Verificación antes de entregar

Como mínimo:

```bash
corepack pnpm typecheck
corepack pnpm test
```

Para cambios que afecten producción, ejecutar también `corepack pnpm build`. No modificar archivos generados en `.next`, `dist`, `.turbo` o `node_modules`.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **plataforma_medica** (API base `https://yavcmi5e.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and payments).
  - `insforge-cli`: backend and infrastructure via `npx -y @insforge/cli` (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, schedules, deploys).
  - `insforge-debug`: diagnosing SDK/HTTP errors, RLS denials, auth failures and security or performance issues.
  - `insforge-integrations`: external auth providers and supported external integrations.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from the environment; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- User-scoped server requests forward the access token so RLS remains authoritative.
- For storage uploads, persist both the returned `url` and `key`.
- Use a backend branch for risky schema, RLS or auth configuration changes; inspect merge SQL with a dry run before applying it to production.
- `20260813171000_harden-function-access.sql` permanece pendiente: no reintentarlo hasta que InsForge resuelva la propiedad `postgres` de las tablas o documente un procedimiento oficial. Consulte `docs/operations.md`.
<!-- INSFORGE:END -->
