# MediCerca

MVP de marketplace médico para Lima y Callao. Conecta pacientes con médicos mediante dos alternativas: **consulta virtual** y **atención a domicilio**.

## Incluye

- encabezado de dos niveles, búsqueda pública y perfiles médicos;
- registro de paciente o médico con contraseña segura y verificación OTP por correo;
- roles múltiples `PATIENT`, `DOCTOR` y `ADMIN`, sin registro público administrativo;
- perfil y disponibilidad del médico, cobertura de los 50 distritos de Lima y Callao;
- reservas instantáneas de 30 minutos, protección transaccional contra doble reserva y cancelación hasta 2 horas antes para pacientes;
- paneles por rol, verificación de médicos y auditoría administrativa;
- NestJS REST con Swagger, PostgreSQL/RLS de InsForge, Next.js y Tailwind.

## Requisitos

- Node.js 22 (mínimo 20.9)
- pnpm 10.15.1 mediante Corepack
- acceso al proyecto InsForge

## Inicio local

```bash
corepack pnpm install
cp .env.example .env.local
```

Complete las URLs y claves anónimas en `.env.local`. El comando de desarrollo carga este archivo
desde la raíz y comparte las variables con Next.js y NestJS. La clave administrativa solo se usa
en procesos internos y nunca debe empezar por `NEXT_PUBLIC_`.

`.env.example` es la plantilla versionada; `.env.local` y `.env.production` contienen valores reales
y permanecen fuera de Git. En producción, es preferible registrar estos valores como variables
protegidas del proveedor. El archivo `.env.production` se usa al desplegar con Docker Compose.

```bash
npx -y @insforge/cli login
npx -y @insforge/cli link --project-id 93502576-1f61-487a-986b-70e0a4bc88f8
npx -y @insforge/cli config apply
npx -y @insforge/cli db migrations up --all
corepack pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/api/docs

## Verificación

```bash
corepack pnpm --filter @medicerca/api-client typecheck
corepack pnpm --filter @medicerca/api typecheck
corepack pnpm --filter @medicerca/web typecheck
corepack pnpm --filter @medicerca/api test
corepack pnpm --filter @medicerca/web build
```

Para E2E: `corepack pnpm exec playwright install chromium` y luego `corepack pnpm --filter @medicerca/web test:e2e`.

Consulte [arquitectura](docs/architecture.md) y [operación/despliegue](docs/operations.md).
