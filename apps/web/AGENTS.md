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
- El descubrimiento público se concentra en `Buscar médicos` (`/medicos`): primero se elige la especialidad, después se comparan profesionales y finalmente se abre el perfil con disponibilidad. `/especialidades` solo redirige a ese recorrido y no debe aparecer como opción independiente.
- Los perfiles locales de muestra deben identificarse claramente como ficticios; sus fotos, reseñas, registros y horarios nunca se presentan como datos médicos reales.
- Médico: navegación exclusiva con este orden: `Resumen`, `Perfil profesional`, `Agenda`, `Disponibilidad`, `Método de pago`. El rótulo superior es `Panel médico`.
- No mostrar al médico autenticado el menú público de búsqueda, especialidades o funcionamiento, ni agregarle flujos para reservar con otro médico.
- Paciente y administrador conservan layouts y permisos separados.
- `Método de pago` administra destinos de desembolso de MediCerca en PEN (`Yape` o cuenta bancaria), admite varios y uno principal. Enmascarar los valores guardados; los números completos solo se revelan al administrador mediante el endpoint auditado y nunca deben persistirse en almacenamiento del navegador.
- Los layouts de rol deben validar sesión y rol en el servidor antes de renderizar el panel.
- El encabezado resuelve la sesión con el cliente SSR del navegador para no bloquear ni volver dinámicas las páginas públicas. La cookie `medicerca_role` es solo una pista de navegación; nunca reemplaza la validación autoritativa de los layouts protegidos.

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

En Hostinger mantener el tipo `Next.js`, la raíz `apps/web`, Node 24, el gestor `npm`, el comando `npm run build` y la salida `.next`. Aunque el monorepo usa pnpm, la Web App se instala con npm para que `next` quede físicamente dentro de `apps/web/node_modules` y el runtime administrado pueda resolverlo. El modo standalone queda separado en `build:standalone` y se usa únicamente desde el Dockerfile.

No usar Docker Compose para el despliegue administrado actual.

## Validación

Desde la raíz:

```bash
corepack pnpm --filter @medicerca/web typecheck
corepack pnpm --filter @medicerca/web test
corepack pnpm --filter @medicerca/web build
```

Usar Playwright para cambios de flujos críticos como autenticación, paneles, disponibilidad o reserva.
Mantener una experiencia mobile-first desde 320 px, controles táctiles de al menos 44 px y tablas administrativas dentro de contenedores con desplazamiento horizontal.
