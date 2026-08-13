# Arquitectura del MVP

MediCerca es un monorepo con dos aplicaciones independientes y un backend administrado en InsForge.

```text
Navegador → Next.js → NestJS REST → InsForge PostgreSQL
                 └──────────────→ InsForge Auth (OTP/sesión)
```

- `apps/web`: interfaz Next.js App Router. Los layouts protegen `/paciente`, `/medico` y `/admin` según la sesión y los roles.
- `apps/api`: monolito modular NestJS. Valida JWT, roles y DTO; expone Swagger en `/api/docs`.
- `packages/api-client`: tipos y cliente REST compartido.
- `migrations`: esquema, restricciones, RLS, funciones transaccionales y auditoría.

## Identidad y autorización

Una cuenta vive en `auth.users` y tiene su espejo operativo en `public.users`. `user_roles` permite varios roles por cuenta. Los perfiles de paciente y médico están separados. `ADMIN` no se ofrece en el registro público.

La defensa se aplica en dos capas: guards de NestJS y RLS/funciones `SECURITY DEFINER` en PostgreSQL. Las operaciones críticas (`book_appointment`, cancelación, cierre y acciones administrativas) vuelven a validar identidad, rol, propiedad y estado dentro de la transacción.

## Citas

Solo existen `VIRTUAL` y `HOME_VISIT`. Todas duran 30 minutos y se guardan en UTC; la disponibilidad se interpreta en `America/Lima`. Índices únicos parciales impiden doble reserva activa para médico o paciente. La atención a domicilio exige un distrito cubierto, dirección y referencia.

## Decisiones de alcance

- La confirmación y recuperación usan códigos OTP nativos de InsForge.
- La videollamada del MVP usa un enlace HTTPS externo configurado por el médico.
- La aprobación del médico es manual desde el panel administrativo.
- Pagos, historias clínicas, recetas y videollamada propia quedan fuera del MVP.
