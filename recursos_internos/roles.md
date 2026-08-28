# Roles y administración — Proyecto Medicina Uber

> Documento de referencia para Codex.
>
> Objetivo: definir los tipos de usuarios, sus responsabilidades, permisos iniciales y la evolución futura del sistema de autorización para la plataforma médica.

---

# 1. Principio general

La plataforma tendrá inicialmente tres roles:

```text
PATIENT
DOCTOR
ADMIN
```

Sin embargo, no deben tratarse conceptualmente como tres tipos de usuario equivalentes.

La separación correcta es:

```text
                 PLATAFORMA

        USUARIOS DEL MARKETPLACE
                 │
         ┌───────┴───────┐
         │               │
      PATIENT          DOCTOR

         USUARIOS INTERNOS
                 │
                 ▼
               ADMIN
```

`PATIENT` y `DOCTOR` son usuarios externos del marketplace.

`ADMIN` representa personal interno autorizado para operar, supervisar y administrar la plataforma.

---

# 2. Modelo de identidad

No crear tres sistemas de autenticación separados.

Debe existir una única entidad base:

```text
User
```

La identidad, autenticación y credenciales pertenecen a `User`.

Los roles determinan qué puede hacer cada usuario.

La identidad admite dos entradas públicas: correo y contraseña con verificación OTP, o Google OAuth con PKCE procesado en el servidor. Google autentica a la persona, pero nunca decide su rol: una cuenta nueva todavía debe elegir exclusivamente `PATIENT` o `DOCTOR` y `ADMIN` continúa fuera del registro público.

Modelo conceptual:

```text
User
│
├── roles
│
├── PatientProfile
│
└── DoctorProfile
```

---

# 3. Roles múltiples

El sistema debe permitir que un mismo usuario tenga más de un rol cuando el dominio lo requiera.

Ejemplo: un médico también puede utilizar la plataforma como paciente.

```text
User
│
├── PATIENT
└── DOCTOR
```

Ese usuario puede tener simultáneamente:

```text
PatientProfile
DoctorProfile
```

Por tanto, no diseñar `User.role` de forma rígida si eso impide múltiples roles.

Para el MVP puede usarse una implementación simple, siempre que no bloquee una evolución futura hacia:

```text
User
UserRole
Role
```

---

# 4. PATIENT

`PATIENT` representa al paciente que utiliza la plataforma para encontrar y reservar médicos.

## Funciones principales

El paciente puede:

- crear una cuenta;
- iniciar y cerrar sesión;
- verificar su correo;
- recuperar contraseña;
- completar y editar su perfil;
- buscar médicos;
- filtrar médicos;
- ver perfiles públicos;
- consultar disponibilidad;
- reservar citas;
- consultar sus propias citas;
- cancelar una cita cuando las reglas lo permitan;
- acceder a su historial básico de citas.

## Autorización

Toda comprobación debe realizarse en backend.

No basta con validar:

```text
role == PATIENT
```

También debe comprobarse que el recurso pertenece al paciente cuando corresponda.

Ejemplo:

```text
appointment.patientId == authenticatedUser.patientProfile.id
```

---

# 5. DOCTOR

`DOCTOR` representa al profesional médico que ofrece sus servicios dentro del marketplace.

## Funciones principales

El médico puede:

- registrarse;
- iniciar sesión;
- completar su perfil profesional;
- indicar número CMP;
- seleccionar especialidades;
- agregar biografía profesional;
- configurar modalidad de atención;
- definir disponibilidad;
- registrar varios destinos de desembolso en soles mediante Yape o cuenta bancaria;
- elegir un destino de desembolso principal;
- consultar sus propias citas;
- administrar su agenda;
- editar información permitida de su perfil;
- consultar su estado de verificación.

## Estado de verificación

El médico debe tener un estado operativo independiente de su rol.

Estados sugeridos:

```text
PENDING
VERIFIED
REJECTED
SUSPENDED
```

Ejemplo válido:

```text
role = DOCTOR
verificationStatus = PENDING
```

El usuario tiene rol médico, pero todavía no está autorizado para operar plenamente dentro del marketplace.

### PENDING

Puede completar su perfil, pero no debe mostrarse como médico verificado ni recibir nuevas reservas si la plataforma exige aprobación previa.

### VERIFIED

Puede aparecer en resultados públicos, publicar disponibilidad y recibir reservas.

### REJECTED

No puede recibir reservas.

### SUSPENDED

No puede recibir nuevas reservas.

---

# 6. ADMIN

`ADMIN` es un usuario interno de la plataforma.

No representa un cliente del marketplace.

Su función es operar el negocio sin requerir acceso directo a la base de datos o modificaciones manuales por parte del programador.

---

# 7. Por qué debe existir ADMIN

No administrar la plataforma mediante:

```text
SQL manual
cambios directos en PostgreSQL
scripts improvisados
modificaciones de código
```

El flujo correcto es:

```text
Personal interno
      │
      ▼
Admin Dashboard
      │
      ▼
NestJS API
      │
      ▼
Authorization
      │
      ▼
Business Rules
      │
      ▼
Audit Log
      │
      ▼
PostgreSQL
```

Esto permite:

- seguridad;
- trazabilidad;
- delegación;
- auditoría;
- escalabilidad operativa;
- reducir errores humanos;
- evitar acceso innecesario a infraestructura crítica.

---

# 8. Registro de administradores

Nunca permitir registro público de administradores.

No debe existir una opción como:

```text
Registrarse como:

- Paciente
- Médico
- Administrador
```

Las cuentas administrativas deben crearse mediante un proceso interno controlado.

El backend debe impedir que un usuario pueda asignarse a sí mismo el rol `ADMIN`.

---

# 9. Panel administrativo del MVP

Crear un panel protegido:

```text
/admin
```

Estructura sugerida:

```text
/admin
│
├── dashboard
├── doctors
│   ├── pending
│   ├── verified
│   └── suspended
│
├── users
├── specialties
├── appointments
└── audit
```

No construir un backoffice excesivamente complejo durante el MVP.

---

# 10. Funciones administrativas del MVP

## Dashboard

Mostrar métricas operativas básicas:

```text
médicos pendientes
médicos verificados
médicos suspendidos
pacientes registrados
citas del día
citas futuras
citas canceladas
```

## Gestión de médicos

El administrador puede:

- listar médicos;
- filtrar por estado;
- abrir un perfil;
- revisar información declarada;
- revisar CMP;
- revisar especialidad;
- aprobar médico;
- rechazar médico;
- suspender médico;
- reactivar médico cuando corresponda.

Acciones sugeridas:

```text
VERIFY_DOCTOR
REJECT_DOCTOR
SUSPEND_DOCTOR
REACTIVATE_DOCTOR
```

## Gestión de usuarios

El administrador puede:

- buscar usuarios;
- consultar información operativa;
- bloquear o suspender cuentas cuando exista una razón válida;
- revisar estado de cuenta.

No mostrar información sensible innecesaria.

## Gestión de especialidades

El administrador puede:

- crear especialidad;
- editar especialidad;
- activar o desactivar especialidad.

No hardcodear especialidades en frontend.

## Gestión de citas

El administrador puede consultar citas para resolver incidencias operativas.

Información útil:

```text
appointmentId
patient
doctor
date
time
status
createdAt
cancelledAt
```

---

# 11. Flujo de verificación del médico

```text
Registro del médico
        │
        ▼
     PENDING
        │
        ▼
Administrador revisa
        │
        ├─────────────┐
        ▼             ▼
    VERIFIED       REJECTED
```

Solo un médico con:

```text
verificationStatus = VERIFIED
```

debe mostrarse como verificado.

La verificación inicial puede ser manual durante el MVP.

---

# 12. Auditoría

Toda acción administrativa sensible debe generar un registro.

Crear:

```text
AdminAuditLog
```

Campos conceptuales:

```text
id
adminUserId
action
entityType
entityId
createdAt
metadata
```

Ejemplos:

```text
ADMIN_VERIFY_DOCTOR
ADMIN_REJECT_DOCTOR
ADMIN_SUSPEND_DOCTOR
ADMIN_REACTIVATE_DOCTOR
ADMIN_SUSPEND_USER
SPECIALTY_CREATE
SPECIALTY_UPDATE
```

No guardar en auditoría:

- contraseñas;
- tokens;
- secretos;
- información clínica completa;
- datos sensibles innecesarios.

---

# 13. ADMIN no necesita AdminProfile inicialmente

No crear:

```text
AdminProfile
```

durante el MVP salvo que exista un requisito real.

Inicialmente basta con:

```text
User
roles = [ADMIN]
```

---

# 14. Autorización

Toda autorización se implementa en backend.

Nunca confiar únicamente en:

- rutas ocultas;
- botones ocultos;
- navegación del frontend;
- datos enviados por cliente.

Ocultar un botón no es un mecanismo de seguridad.

NestJS debe validar permisos antes de ejecutar una acción.

---

# 15. RBAC inicial

Para el MVP es suficiente:

```text
PATIENT
DOCTOR
ADMIN
```

Esto es Role-Based Access Control.

Ejemplo:

```text
PATIENT
    -> funciones de paciente

DOCTOR
    -> funciones de médico

ADMIN
    -> funciones del backoffice
```

---

# 16. Evolución futura hacia permisos

Cuando el equipo interno crezca, evolucionar desde un `ADMIN` general hacia permisos granulares.

Ejemplos:

```text
doctor.read
doctor.verify
doctor.suspend

user.read
user.suspend

appointment.read
appointment.manage

specialty.read
specialty.manage

payment.read
payment.refund

audit.read
```

---

# 17. Roles internos futuros

No implementar durante el MVP.

Posibles roles futuros:

```text
SUPER_ADMIN
SUPPORT_AGENT
DOCTOR_VERIFICATION_AGENT
FINANCE_AGENT
OPERATIONS_AGENT
COMPLIANCE_AGENT
```

Ejemplo:

## SUPPORT_AGENT

Puede:

```text
appointments.read
users.read
```

No puede:

```text
doctor.verify
payment.refund
admin.manage
```

## DOCTOR_VERIFICATION_AGENT

Puede:

```text
doctor.read
doctor.verify
doctor.reject
```

No puede:

```text
payment.refund
admin.manage
```

## FINANCE_AGENT

Puede:

```text
payment.read
payment.refund
dispute.read
```

No puede:

```text
doctor.verify
doctor.edit
```

---

# 18. Principio de mínimo privilegio

Cada usuario debe tener únicamente los permisos necesarios para realizar su función.

Durante el MVP puede mantenerse un `ADMIN` amplio por simplicidad.

La arquitectura debe permitir evolucionar después.

---

# 19. Futuro: procesamiento de pagos

El MVP solo conserva las instrucciones de desembolso indicadas por el médico. MediCerca cobra al paciente y esos destinos no deben mostrarse como canales de pago directo. El administrador ve valores enmascarados y toda revelación de números completos queda auditada.

Cuando se agregue el procesamiento de pagos, el backoffice deberá gestionar incidencias como:

```text
pago rechazado
pago duplicado
refund
disputa
chargeback
médico no asistió
paciente no asistió
comisión
transferencia
```

No implementar todavía el cobro, la conciliación ni la ejecución del desembolso.

---

# 20. Futuro: videollamadas

Cuando se implemente teleconsulta, el administrador puede necesitar consultar metadata operativa:

```text
appointmentId
videoSessionId
patientJoinedAt
doctorJoinedAt
sessionCreatedAt
sessionEndedAt
```

No debe tener acceso innecesario al contenido clínico de la consulta.

Separar:

```text
metadata operativa
```

de:

```text
información clínica
```

---

# 21. Futuro: aplicación móvil

La futura aplicación móvil estará enfocada principalmente en:

```text
PATIENT
DOCTOR
```

Arquitectura:

```text
                  NestJS API
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
   Next.js Web    Mobile App    Admin Web
                  React Native

   pacientes      pacientes      internos
   médicos        médicos
```

No construir una aplicación móvil administrativa durante las primeras fases salvo que exista una necesidad real.

---

# 22. Modelo conceptual recomendado

```text
User
│
├── UserRole
│
├── PatientProfile
│
└── DoctorProfile
        │
        └── verificationStatus
```

Roles:

```text
PATIENT
DOCTOR
ADMIN
```

Estados de médico:

```text
PENDING
VERIFIED
REJECTED
SUSPENDED
```

No confundir rol con estado.

---

# 23. Role != Profile

`DOCTOR` representa un rol o conjunto de permisos.

`DoctorProfile` contiene información profesional.

`PATIENT` representa un rol.

`PatientProfile` contiene información específica del paciente.

Mantener estos conceptos separados.

---

# 24. Role != Verification Status

Ejemplo válido:

```text
User
role = DOCTOR

DoctorProfile
verificationStatus = PENDING
```

No usar el rol como sustituto del proceso de verificación profesional.

---

# 25. Seguridad del panel administrativo

Aplicar al menos:

- autenticación obligatoria;
- autorización `ADMIN`;
- sesiones seguras;
- protección CSRF cuando aplique;
- rate limiting;
- auditoría;
- rutas privadas;
- logs estructurados;
- no exposición de información sensible;
- no indexación del panel por buscadores;
- headers de seguridad;
- expiración de sesión;
- revocación de acceso.

En el futuro evaluar MFA obligatorio para cuentas internas.

---

# 26. No usar acceso directo a base de datos como operación normal

Los desarrolladores pueden utilizar herramientas de base de datos durante desarrollo, debugging o mantenimiento autorizado.

Pero las operaciones normales del negocio deben realizarse desde herramientas internas.

No convertir:

```text
Prisma Studio
pgAdmin
psql
```

en el backoffice de producción.

---

# 27. Reglas específicas para Codex

Al trabajar con roles y permisos:

1. Mantener una única identidad `User`.
2. No crear autenticaciones independientes para paciente, médico y admin.
3. Separar roles de perfiles.
4. Separar rol `DOCTOR` del estado de verificación.
5. Nunca permitir autoasignación de `ADMIN`.
6. No ofrecer registro público de administradores.
7. Toda autorización crítica debe implementarse en NestJS.
8. Aplicar autorización a nivel de recurso.
9. No confiar en roles enviados por frontend.
10. No confiar en botones ocultos como mecanismo de seguridad.
11. Registrar acciones administrativas sensibles.
12. Aplicar mínimo privilegio.
13. Mantener el MVP con `PATIENT`, `DOCTOR` y `ADMIN`.
14. No crear roles internos adicionales hasta que exista necesidad.
15. Diseñar de forma que RBAC pueda evolucionar a permisos granulares.
16. No exponer datos sensibles al administrador sin necesidad operativa.
17. No permitir que un admin omita reglas de negocio salvo que exista un caso de uso explícito.
18. Mantener el panel admin separado conceptualmente de la experiencia del marketplace.
19. Preparar la arquitectura para que paciente y médico tengan app móvil en el futuro.
20. Mantener administración principalmente en web durante las primeras fases.

---

# 28. Alcance exacto del MVP

Implementar únicamente:

```text
PATIENT
DOCTOR
ADMIN
```

Funciones admin mínimas:

```text
dashboard
médicos
usuarios
especialidades
citas
auditoría
```

Funciones críticas:

```text
verificar médico
rechazar médico
suspender médico
administrar especialidades
consultar usuarios
consultar citas
registrar auditoría
```

No implementar todavía:

```text
SUPER_ADMIN
SUPPORT_AGENT
FINANCE_AGENT
COMPLIANCE_AGENT
permission builder
custom roles
advanced IAM
mobile admin app
```

---

# 29. Decisión arquitectónica final

El proyecto debe comenzar con tres roles:

```text
PATIENT
DOCTOR
ADMIN
```

pero entendiendo que:

```text
PATIENT + DOCTOR
=
usuarios externos del marketplace

ADMIN
=
usuario interno de operaciones
```

El administrador no existe para configurar productos como en un e-commerce.

Existe para operar un marketplace basado en personas, confianza y servicios.

Sus principales responsabilidades son:

```text
verificación
operación
seguridad
soporte
moderación
control
auditoría
```

El programador no debe convertirse en el operador permanente de la plataforma.

El objetivo del panel administrativo es permitir que el negocio pueda operar sin depender de cambios directos en código o base de datos.

---

# 30. Regla principal

Diseñar la plataforma desde el comienzo para que:

```text
pacientes
+
médicos
+
personal interno
```

puedan utilizar el mismo backend con permisos claramente separados.

El MVP debe mantener esta arquitectura simple:

```text
User
│
├── PATIENT
├── DOCTOR
└── ADMIN
```

y permitir evolucionar en el futuro hacia:

```text
roles
+
permisos
+
equipos internos especializados
```

sin reescribir la autenticación ni el modelo central de identidad.
