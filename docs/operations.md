# Operación y despliegue

## Entornos

Use una rama backend de InsForge para cada cambio de esquema. Aplique `insforge.toml` y las migraciones allí, ejecute pruebas y use `branch merge --dry-run` antes de fusionar. No guarde `INSFORGE_API_KEY` en el repositorio ni la exponga al navegador.

## Google OAuth

Google debe figurar en `auth.oAuthProviders` de InsForge. En Google Cloud, el URI autorizado del proveedor apunta al backend de InsForge: `https://<appkey>.us-east.insforge.app/api/auth/oauth/google/callback`. En `insforge.toml`, `auth.allowed_redirect_urls` debe incluir el callback de cada origen web desplegado: `<origen>/api/auth/callback`. Al cambiar el dominio de Hostinger o publicar `medicerca.com`, añadir primero ese callback al archivo y aplicar la configuración antes de desplegar la web.

### Migración pendiente de InsForge

`docs/pending-migrations/20260813171000_harden-function-access.sql` está pendiente y no debe moverse nuevamente a `migrations/` ni reintentarse automáticamente. InsForge ejecuta la migración como `project_admin`, pero las tablas creadas anteriormente pertenecen a `postgres`; por eso la modificación de políticas falla con `must be owner of relation specialties`. El fallo fue transaccional y no aplicó cambios parciales. Mantenga el archivo local como pendiente hasta que InsForge corrija la propiedad o proporcione un procedimiento oficial compatible.

## Primer administrador

1. Registre una cuenta normal y confirme su correo por OTP.
2. Obtenga su UUID en el panel de InsForge.
3. En una terminal segura, defina `INSFORGE_URL` e `INSFORGE_API_KEY`.
4. Ejecute `pnpm --filter @medicerca/api admin:grant <user-id>`.

El registro público y `complete_registration` rechazan el rol `ADMIN`.

## Producción

- Configure las URLs públicas y claves anónimas en la plataforma de despliegue.
- Configure `INSFORGE_URL`, `INSFORGE_ANON_KEY`, `WEB_URL` y `PORT` para NestJS.
- Agregue los dominios definitivos a `auth.allowed_redirect_urls` en `insforge.toml` antes del despliegue.
- Despliegue `apps/api` y use su URL en `NEXT_PUBLIC_API_URL`.
- Despliegue `apps/web` después de fijar las variables `NEXT_PUBLIC_*`; Next.js las incorpora durante el build.
- Compruebe `/api/v1/health`, `/api/docs`, registro OTP, reserva y cancelación.

El despliegue vigente usa dos Web Apps administradas en Hostinger desde el mismo monorepo:

```bash
# apps/web
pnpm run build
pnpm run start

# apps/api
pnpm run build
pnpm run start
```

Use `apps/web` y `apps/api` como directorios raíz independientes y Node.js 24. La Web App de Next.js usa npm, `npm run build` y salida `.next`; la API conserva pnpm y usa el puerto asignado por Hostinger (o `PORT=3000` si se configura manualmente). Registre las variables de entorno antes de construir y no suba `.env.production`.

Los Dockerfiles y `docker-compose.yml` se conservan únicamente como alternativa futura para un VPS. InsForge permanece como servicio administrado y no se incluye en Compose.
