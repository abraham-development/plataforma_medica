# Operación y despliegue

## Entornos

Use una rama backend de InsForge para cada cambio de esquema. Aplique `insforge.toml` y las migraciones allí, ejecute pruebas y use `branch merge --dry-run` antes de fusionar. No guarde `INSFORGE_API_KEY` en el repositorio ni la exponga al navegador.

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

Los Dockerfiles y `docker-compose.yml` permiten construir ambos servicios. InsForge permanece como servicio administrado y no se incluye en Compose.
