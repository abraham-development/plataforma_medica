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

## Destinos de pago a médicos

El médico puede registrar varios destinos de desembolso en soles —Yape o cuenta bancaria— y marcar uno como principal. Los datos se almacenan en `doctor_payout_methods`: RLS limita la lectura al médico propietario y las escrituras pasan por RPC transaccionales. El administrador obtiene primero un resumen enmascarado; revelar los valores completos exige una acción explícita que crea un registro en `admin_audit_logs`.

Esta configuración no procesa dinero. El cobro al paciente, las comisiones, la conciliación y la transferencia efectiva al médico siguen fuera del MVP y se incorporarán como un módulo separado.

## Decisiones de alcance

- La confirmación y recuperación usan códigos OTP nativos de InsForge.
- La videollamada del MVP usa un enlace HTTPS externo configurado por el médico.
- La aprobación del médico es manual desde el panel administrativo.
- El procesamiento de pagos, las historias clínicas, las recetas y la videollamada propia quedan fuera del MVP.
