# AGENTS.md — MediCerca API

## Alcance

Esta carpeta contiene `@medicerca/api`, la API NestJS 11 de MediCerca. Es un backend modular único, no un conjunto de microservicios. InsForge proporciona autenticación y Postgres; NestJS concentra validación HTTP, autorización por roles y reglas de negocio.

La API tiene:

- Prefijo global: `/api/v1`.
- Health check: `/api/v1/health`.
- Swagger: `/api/docs`.
- `helmet`, CORS, request ID, rate limiting y filtro global de errores.
- `ValidationPipe` con `whitelist`, `forbidNonWhitelisted` y `transform`.
- `AuthGuard` y `RolesGuard` registrados globalmente.

## Organización

- `src/common`: guards, decoradores, tipos de solicitud y manejo de errores.
- `src/modules`: controladores e integración de aplicación.
- `src/modules/insforge.service.ts`: única construcción centralizada de clientes InsForge.
- `scripts/grant-admin.mjs`: concesión administrativa puntual y segura.
- El esquema, RPC y RLS viven en `/migrations` y `insforge.toml`, no dentro de esta carpeta.

## InsForge y seguridad

- Usar `@insforge/sdk`; no construir manualmente URLs internas de InsForge.
- Cliente público: `createClient({ baseUrl, anonKey })`.
- Cliente autenticado: reenviar el JWT recibido con `accessToken`; las consultas deben seguir sujetas a RLS.
- No reemplazar autorización normal con una API key administrativa.
- `createAdminClient({ apiKey })` solo se permite en operaciones explícitamente privilegiadas, server-only y auditables.
- Todos los métodos del SDK devuelven `{ data, error }`; manejar ambos y no asumir éxito.
- Los inserts reciben arrays: `insert([{ ... }])`.
- Nombrar las columnas consultadas y añadir límites razonables a listados.
- Las migraciones deben incluir políticas RLS compatibles con `auth.uid()` y referencias a `auth.users(id)`.
- Para cambios de esquema, RPC, RLS o configuración de autenticación, usar primero una rama backend de InsForge y revisar `branch merge --dry-run`.

## Autenticación y roles

- `@Public()` es la única forma de excluir un endpoint del guard global de autenticación.
- Un endpoint protegido recibe un `AuthenticatedRequest` con `accessToken` y usuario validado por InsForge.
- Aplicar `@Roles('PATIENT')`, `@Roles('DOCTOR')` o `@Roles('ADMIN')` a operaciones restringidas.
- Nunca confiar en un rol enviado por el cliente. Los roles efectivos salen de `user_roles`.
- El registro público solo admite `PATIENT` y `DOCTOR`; `ADMIN` se concede por un proceso administrativo separado.
- Mantener respuestas de autenticación y errores libres de tokens, claves y detalles internos.

## Reglas de disponibilidad y citas

- Modalidades válidas: `VIRTUAL` y `HOME_VISIT`.
- La disponibilidad usa fechas `YYYY-MM-DD` y bloques alineados a `:00` o `:30`.
- La zona funcional es `America/Lima`; evitar cálculos que dependan de UTC implícito o del huso del servidor.
- Un médico solo puede publicar modalidades habilitadas en su perfil.
- `PUT /api/v1/doctors/me/availability` reemplaza la disponibilidad mediante la RPC `replace_doctor_availability_dates`.
- Conservar el límite de 600 elementos y la validación DTO.
- La reserva debe ser atómica y rechazar bloques ocupados o no disponibles; preferir RPC transaccionales para estas reglas.

## Variables y puertos

Variables server-only:

```text
NODE_ENV
PORT
WEB_URL
INSFORGE_URL
INSFORGE_ANON_KEY
```

- Local: la raíz carga `.env.local`; API en `4000`.
- CORS: `WEB_URL` acepta orígenes separados por comas.
- Hostinger Deploy Web App: registrar variables en el panel y usar el puerto asignado; si debe definirse manualmente, `PORT=3000`.
- `INSFORGE_API_KEY` no es necesaria para el funcionamiento normal de la API y nunca se expone al navegador.

## Build y despliegue

Conservar en `nest-cli.json`:

- `deleteOutDir: true`, para impedir que Nest ejecute artefactos antiguos de `dist/src`.
- Builder Webpack y `webpack.config.cjs`, necesarios para empaquetar correctamente las dependencias ESM actuales de InsForge dentro de la salida CommonJS de Nest.

Despliegue administrado actual en Hostinger, separado de Next.js:

```bash
corepack pnpm --filter @medicerca/api build
corepack pnpm --filter @medicerca/api start
```

No usar Docker Compose en Deploy Web App. `Dockerfile` y el Compose de la raíz son una alternativa futura para VPS.

## Validación

Desde la raíz:

```bash
corepack pnpm --filter @medicerca/api typecheck
corepack pnpm --filter @medicerca/api test
corepack pnpm --filter @medicerca/api build
```

Agregar o actualizar pruebas cuando cambien permisos, estados de citas, validaciones, disponibilidad, RPC o contratos HTTP. No editar `dist` manualmente.
