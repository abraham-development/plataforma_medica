<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MediCerca web

## Alcance

Esta carpeta contiene `@medicerca/web`, una aplicación Next.js 16 con App Router, React 19, TypeScript y Tailwind CSS 3.4. Mantener componentes accesibles, responsive y coherentes con las clases y tokens existentes en `app/globals.css`.

Antes de cambiar una API o convención de Next.js, consultar la documentación instalada en `node_modules/next/dist/docs/`, tal como exige el bloque anterior.

## Navegación y mundos por rol

- Sitio público: header con top bar (logotipo a la izquierda; iniciar sesión y crear cuenta a la derecha) y una barra de navegación separada para el menú público.
- Médico: navegación exclusiva con este orden: `Resumen`, `Perfil profesional`, `Agenda`, `Disponibilidad`. El rótulo superior es `Panel médico`.
- No mostrar al médico autenticado el menú público de búsqueda, especialidades o funcionamiento, ni agregarle flujos para reservar con otro médico.
- Paciente y administrador conservan layouts y permisos separados.
- Los layouts de rol deben validar sesión y rol en el servidor antes de renderizar el panel.

## Autenticación

- Usar `@insforge/sdk/ssr` para acciones y clientes SSR.
- Registro público: nombre, correo, contraseña, confirmación, control mostrar/ocultar contraseña y rol `PATIENT` o `DOCTOR`.
- La cuenta se completa únicamente después de verificar el OTP de seis dígitos enviado por correo.
- Mantener access y refresh tokens bajo las convenciones SSR del SDK. No devolver tokens desde Server Actions ni guardarlos en `localStorage`.
- Las cookies sensibles deben ser `httpOnly` cuando el navegador no necesite leerlas y `secure` en producción.

## Acceso a datos

- Usar `NEXT_PUBLIC_API_URL` para mutaciones y reglas de negocio implementadas en NestJS.
- Las solicitudes autenticadas a la API envían `Authorization: Bearer <access-token>`.
- El anon key es público por diseño; una API key administrativa jamás debe aparecer en código web ni en una variable `NEXT_PUBLIC_*`.
- Nombrar columnas y limitar las lecturas de InsForge. No introducir sondeos ilimitados.
- Conservar el cliente compartido `@medicerca/api-client` cuando corresponda, evitando duplicar contratos.

## Disponibilidad médica

- La pantalla `app/medico/disponibilidad` muestra un calendario interactivo a partir del mes actual en Lima.
- Permite seleccionar fechas desde hoy y dentro de la ventana vigente de 60 días.
- Los horarios son bloques de 30 minutos.
- Las únicas modalidades válidas son `VIRTUAL` y `HOME_VISIT`, y solo pueden mostrarse si el médico las habilitó en su perfil.
- Carga y guarda mediante `GET/PUT /doctors/me/availability`; carga el perfil mediante `GET /me/doctor-profile`.
- Los pacientes deben ver únicamente horarios publicados y disponibles al reservar.

## Entorno y despliegue

Variables requeridas:

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_INSFORGE_URL
NEXT_PUBLIC_INSFORGE_ANON_KEY
```

En local, la raíz carga `.env.local` y la web escucha en `3000`. En Hostinger, registrar estas variables en el panel antes del build porque las variables `NEXT_PUBLIC_*` se incorporan al artefacto de Next.js.

La web se despliega como una Web App administrada independiente de NestJS:

```bash
corepack pnpm --filter @medicerca/web build
corepack pnpm --filter @medicerca/web start
```

En Hostinger mantener el tipo `Next.js`, la raíz `apps/web`, el build `build`, la salida `.next/standalone` y el archivo de entrada `server.js`. La web traza el artefacto desde la raíz del monorepo para incluir el almacén virtual de pnpm; `scripts/prepare-standalone.mjs` aplana la aplicación dentro de esa salida, añade `public` y los estáticos, y convierte los enlaces internos en rutas relativas portables.

No usar Docker Compose para el despliegue administrado actual.

## Validación

Desde la raíz:

```bash
corepack pnpm --filter @medicerca/web typecheck
corepack pnpm --filter @medicerca/web test
corepack pnpm --filter @medicerca/web build
```

Usar Playwright para cambios de flujos críticos como autenticación, paneles, disponibilidad o reserva.
