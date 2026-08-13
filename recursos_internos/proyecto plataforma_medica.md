# Proyecto plataforma_medica — Especificación técnica del MVP

> Archivo de contexto y ejecución para Codex.
>  
> Objetivo: construir un MVP profesional, mantenible y seguro de una plataforma tipo marketplace que conecte pacientes con médicos, empezando por una aplicación web y dejando una arquitectura preparada para una futura aplicación móvil.

---

## 1. Visión del producto

Construir una plataforma digital de intermediación entre pacientes y médicos.

La idea central es similar al modelo de marketplace de Uber:

```text
Paciente  ->  Plataforma  ->  Médico
```

La plataforma no debe asumir desde el MVP que es una clínica, hospital o prestador directo de atención médica. Su primera función es conectar oferta y demanda, facilitar descubrimiento, confianza, disponibilidad y reserva de citas.

### Propuesta de valor para pacientes

- Buscar médicos.
- Filtrar por especialidad.
- Ver perfiles profesionales.
- Ver disponibilidad.
- Reservar una cita.
- Gestionar citas.
- Recibir confirmaciones y recordatorios.
- En una fase posterior: pagar, realizar teleconsulta y acceder a otros servicios.

### Propuesta de valor para médicos

- Crear y administrar un perfil profesional.
- Indicar especialidades.
- Definir disponibilidad.
- Recibir nuevas solicitudes de pacientes.
- Gestionar citas.
- Generar un ingreso adicional.
- En fases posteriores: gestionar pagos, teleconsultas, reputación e ingresos.

---

# 2. Principios técnicos del proyecto

Codex debe seguir estos principios durante toda la implementación.

## 2.1 Construir un MVP, no el producto final

El MVP debe ser pequeño pero estar bien diseñado.

No implementar características futuras solo porque podrían ser necesarias algún día.

Sí dejar límites arquitectónicos claros para incorporarlas después sin reescribir todo el sistema.

Prioridad:

```text
simplicidad
+
mantenibilidad
+
seguridad
+
buena arquitectura
+
capacidad de evolución
```

Evitar:

```text
microservicios prematuros
Kubernetes prematuro
event sourcing prematuro
Kafka sin necesidad real
abstracciones innecesarias
arquitectura excesivamente compleja
```

---

## 2.2 Arquitectura inicial: monolito modular

El backend será un **monolito modular con NestJS**.

No crear microservicios durante el MVP.

Cada área del negocio debe estar claramente separada por módulos.

Ejemplo:

```text
AuthModule
UsersModule
DoctorsModule
PatientsModule
SpecialtiesModule
AvailabilityModule
AppointmentsModule
NotificationsModule
AdminModule
AuditModule
```

La separación interna debe permitir extraer un módulo como servicio independiente en el futuro si aparece una necesidad real.

---

## 2.3 Frontend y backend deben ser aplicaciones independientes

No implementar toda la lógica del negocio dentro de Next.js.

Responsabilidades:

```text
Next.js
    =
interfaz
renderizado
navegación
formularios
experiencia de usuario
consumo de API

NestJS
    =
autenticación
autorización
reglas de negocio
validaciones
persistencia
reservas
disponibilidad
seguridad
auditoría
integraciones
```

Next.js puede utilizar Server Components, Server Actions o Route Handlers cuando aporten valor al frontend, pero **la fuente de verdad del dominio debe permanecer en NestJS**.

---

# 3. Stack tecnológico

## Monorepo

```text
pnpm workspaces
Turborepo
```

## Frontend

```text
Next.js
App Router
React
TypeScript
Tailwind CSS
shadcn/ui
```

## Backend

```text
NestJS
TypeScript
REST API
OpenAPI / Swagger
```

## Datos

```text
PostgreSQL
Prisma ORM
```

## Infraestructura futura

No es obligatorio incorporar todo en la primera iteración.

```text
Redis
BullMQ
S3-compatible object storage
LiveKit / WebRTC
servicio de email
servicio de SMS / WhatsApp
pasarela de pagos
```

## Testing

```text
Vitest o Jest según integración natural del framework
Supertest para API
Playwright para flujos E2E web críticos
```

## Calidad

```text
ESLint
Prettier
TypeScript strict
Husky opcional
lint-staged opcional
```

---

# 4. Estructura del repositorio

Crear un monorepo similar a:

```text
plataforma_medica/
│
├── apps/
│   │
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── public/
│   │
│   └── api/
│       └── src/
│           ├── modules/
│           ├── common/
│           ├── config/
│           ├── database/
│           └── main.ts
│
├── packages/
│   │
│   ├── ui/
│   ├── eslint-config/
│   ├── tsconfig/
│   └── api-client/
│
├── docs/
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

No crear paquetes compartidos sin una necesidad concreta.

---

# 5. Alcance funcional del MVP

## 5.1 Roles

El sistema tendrá inicialmente tres roles:

```text
PATIENT
DOCTOR
ADMIN
```

Un usuario debe tener una identidad base común.

Los perfiles específicos de paciente o médico deben estar separados de la entidad principal `User`.

---

# 6. MVP — funcionalidades obligatorias

## 6.1 Autenticación

Implementar:

- registro;
- inicio de sesión;
- cierre de sesión;
- recuperación de contraseña;
- verificación de correo;
- sesiones seguras;
- autorización por roles;
- protección de rutas privadas.

No almacenar contraseñas en texto plano.

Utilizar hashing seguro.

Diseñar autenticación de manera que pueda ser consumida en el futuro por:

```text
Next.js web
React Native / Expo
```

Evitar acoplar la identidad exclusivamente al navegador.

---

## 6.2 Registro de paciente

El paciente debe poder:

- crear una cuenta;
- completar datos básicos;
- editar su perfil;
- ver sus citas;
- cancelar una cita según reglas del MVP.

No solicitar información clínica que no sea necesaria.

---

## 6.3 Registro de médico

El médico debe poder:

- crear cuenta;
- completar perfil profesional;
- indicar número CMP;
- seleccionar especialidad;
- indicar biografía profesional;
- indicar modalidad de consulta;
- configurar disponibilidad;
- quedar inicialmente con estado de verificación pendiente.

Estados sugeridos:

```text
PENDING
VERIFIED
REJECTED
SUSPENDED
```

La verificación automática contra fuentes externas no es obligatoria en la primera versión.

Para el MVP, un administrador puede realizar la aprobación manual.

---

## 6.4 Especialidades

Debe existir un catálogo administrable de especialidades médicas.

Ejemplos:

```text
Medicina General
Pediatría
Dermatología
Cardiología
Ginecología
Traumatología
Psicología
```

No hardcodear especialidades en componentes del frontend.

Persistirlas en base de datos.

---

## 6.5 Buscador de médicos

El paciente debe poder buscar médicos por:

- nombre;
- especialidad;
- modalidad;
- disponibilidad básica.

Preparar la arquitectura para filtros futuros por:

- distrito;
- distancia;
- precio;
- rating;
- fecha;
- idioma;
- atención inmediata.

No implementar búsqueda geoespacial compleja en el MVP si no es necesaria.

---

## 6.6 Perfil público del médico

Debe mostrar como mínimo:

- nombre;
- foto opcional;
- especialidad;
- número CMP;
- biografía;
- modalidad de atención;
- estado de verificación;
- disponibilidad;
- botón para reservar.

No mostrar información privada.

---

## 6.7 Disponibilidad del médico

El médico debe poder definir bloques de disponibilidad.

Ejemplo:

```text
lunes
09:00 - 12:00
15:00 - 18:00

miércoles
18:00 - 21:00
```

El sistema debe impedir:

- intervalos inválidos;
- reservas duplicadas;
- dos citas para el mismo médico en el mismo horario.

La protección contra doble reserva debe existir también a nivel transaccional/base de datos, no únicamente en el frontend.

---

## 6.8 Reservas / citas

El paciente debe poder:

1. seleccionar médico;
2. seleccionar fecha;
3. seleccionar horario disponible;
4. confirmar reserva;
5. recibir confirmación;
6. visualizar la cita en su panel.

Estados iniciales:

```text
PENDING
CONFIRMED
CANCELLED
COMPLETED
NO_SHOW
```

El backend es la única fuente de verdad del estado de una cita.

---

## 6.9 Dashboard del paciente

Incluir:

- próxima cita;
- citas futuras;
- historial de citas;
- estado;
- opción de cancelar cuando corresponda;
- acceso al perfil del médico.

---

## 6.10 Dashboard del médico

Incluir:

- próximas citas;
- agenda del día;
- disponibilidad;
- edición de perfil;
- estado de verificación;
- historial básico.

No implementar aún contabilidad compleja ni reportes avanzados.

---

## 6.11 Administración

Crear un panel administrativo mínimo.

Funciones:

- listar médicos pendientes;
- revisar datos;
- aprobar;
- rechazar;
- suspender;
- administrar especialidades;
- consultar usuarios;
- consultar citas.

Toda acción administrativa sensible debe quedar auditada.

---

# 7. Funcionalidades EXCLUIDAS del MVP

No implementar todavía:

- videollamadas;
- pagos online;
- comisiones;
- recetas electrónicas;
- historia clínica completa;
- diagnóstico mediante IA;
- recomendaciones médicas automatizadas;
- farmacia;
- laboratorio;
- seguros;
- atención domiciliaria;
- geolocalización en tiempo real;
- chat en tiempo real;
- ratings complejos;
- microservicios;
- Kafka;
- Kubernetes.

Estas funciones pertenecen a fases posteriores.

---

# 8. Modelo de datos inicial

Diseñar el esquema aproximadamente alrededor de estas entidades:

```text
User
PatientProfile
DoctorProfile
Specialty
DoctorSpecialty
DoctorAvailability
Appointment
AdminAuditLog
EmailVerificationToken
PasswordResetToken
RefreshSession
```

Modelo conceptual:

```text
User
 │
 ├── PatientProfile
 │
 └── DoctorProfile
          │
          ├── DoctorSpecialty
          │        │
          │        └── Specialty
          │
          └── DoctorAvailability


PatientProfile
       │
       └──────── Appointment ─────── DoctorProfile
```

---

# 9. Reglas importantes del dominio

## Usuarios

- Email único.
- Roles controlados por backend.
- No confiar en roles enviados por el frontend.

## Médicos

- CMP debe poder validarse.
- El perfil público solo debe mostrarse como verificado cuando el estado sea `VERIFIED`.
- Un médico suspendido no puede recibir nuevas reservas.

## Citas

- Una cita pertenece a un paciente y un médico.
- El horario debe existir dentro de la disponibilidad del médico.
- No permitir reservas en el pasado.
- No permitir solapamientos.
- La operación de reserva debe ser atómica.
- El frontend nunca decide por sí solo que un horario sigue disponible.

---

# 10. Diseño de API

Versionar desde el inicio:

```text
/api/v1
```

Ejemplos:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh

GET    /api/v1/doctors
GET    /api/v1/doctors/:id
GET    /api/v1/doctors/:id/availability

GET    /api/v1/specialties

GET    /api/v1/patients/me
PATCH  /api/v1/patients/me

GET    /api/v1/doctors/me
PATCH  /api/v1/doctors/me
PUT    /api/v1/doctors/me/availability

POST   /api/v1/appointments
GET    /api/v1/appointments/:id
GET    /api/v1/appointments/me
PATCH  /api/v1/appointments/:id/cancel

GET    /api/v1/admin/doctors/pending
PATCH  /api/v1/admin/doctors/:id/verify
PATCH  /api/v1/admin/doctors/:id/reject
```

Documentar API con OpenAPI.

Mantener DTOs explícitos.

Nunca retornar directamente entidades ORM completas.

Utilizar DTOs de respuesta o serializers para evitar fugas accidentales de información.

---

# 11. Cliente de API compartido

La API debe ser independiente de Next.js.

Generar o mantener un cliente tipado basado en OpenAPI dentro de:

```text
packages/api-client
```

El objetivo es que en el futuro:

```text
apps/web
apps/mobile
```

puedan consumir la misma API.

La futura aplicación móvil no debe obligar a reescribir reglas del backend.

---

# 12. Preparación para aplicación móvil

La futura aplicación móvil probablemente utilizará:

```text
React Native
Expo
TypeScript
```

No implementarla durante el MVP.

Pero todas las decisiones actuales deben considerar que aparecerá.

Por eso:

- no depender exclusivamente de cookies de navegador como única estrategia posible;
- mantener API REST independiente;
- usar autenticación reutilizable;
- versionar API;
- no poner reglas críticas solo en Next.js;
- no devolver HTML desde la API;
- mantener contratos claros;
- utilizar OpenAPI;
- evitar rutas diseñadas únicamente para una pantalla web específica.

Arquitectura futura:

```text
                   Next.js Web
                       │
                       │
                       ▼
                  NestJS API
                       ▲
                       │
                       │
               React Native App
```

---

# 13. Seguridad

Este proyecto manejará información sensible relacionada con salud, incluso si el MVP almacena una cantidad limitada.

Aplicar desde el comienzo:

- HTTPS en producción;
- TypeScript strict;
- validación de todas las entradas;
- sanitización cuando corresponda;
- protección contra SQL injection mediante ORM y consultas seguras;
- rate limiting en autenticación;
- CORS explícito;
- Helmet / headers de seguridad;
- secretos solo en variables de entorno;
- separación entre configuración de desarrollo y producción;
- logs sin contraseñas ni tokens;
- no registrar datos sensibles innecesariamente;
- expiración de sesiones;
- rotación segura de refresh tokens;
- control de acceso basado en roles;
- autorización a nivel de recurso;
- auditoría administrativa.

Nunca asumir que ocultar un botón en el frontend constituye autorización.

Toda autorización importante debe comprobarse en el backend.

---

# 14. Privacidad y minimización de datos

Principio:

> recolectar únicamente los datos necesarios para la funcionalidad actual.

Durante el MVP evitar almacenar:

- historias clínicas;
- diagnósticos;
- recetas;
- resultados de laboratorio;
- archivos médicos;
- información clínica detallada.

Si una característica no necesita un dato sensible, no solicitarlo.

Diseñar futuras funciones clínicas como módulos separados y sujetos a revisión legal, de seguridad y privacidad antes de implementarlas.

---

# 15. Auditoría

Crear `AdminAuditLog`.

Registrar al menos:

- administrador;
- acción;
- entidad afectada;
- identificador;
- fecha;
- metadata limitada y no sensible.

Ejemplo:

```text
ADMIN_VERIFY_DOCTOR
ADMIN_REJECT_DOCTOR
ADMIN_SUSPEND_DOCTOR
SPECIALTY_CREATE
SPECIALTY_UPDATE
```

---

# 16. Manejo de errores

Definir formato consistente de errores.

Ejemplo:

```json
{
  "statusCode": 409,
  "code": "APPOINTMENT_SLOT_UNAVAILABLE",
  "message": "El horario seleccionado ya no está disponible"
}
```

No enviar stack traces en producción.

No exponer detalles internos de PostgreSQL, Prisma o infraestructura.

---

# 17. Observabilidad

Desde el MVP implementar al menos:

- logs estructurados;
- correlation/request ID;
- health endpoint;
- manejo global de excepciones;
- logging de errores;
- métricas básicas cuando el hosting lo permita.

Endpoint:

```text
GET /health
```

Preparar integración futura con una plataforma de error tracking y observabilidad.

---

# 18. Base de datos y migraciones

Utilizar PostgreSQL.

Utilizar Prisma migrations.

Reglas:

- nunca hacer cambios manuales de producción que no estén representados por migraciones;
- usar índices donde las consultas lo necesiten;
- declarar constraints en base de datos cuando la integridad sea importante;
- no confiar únicamente en validaciones de aplicación;
- utilizar transacciones en operaciones críticas.

Especial atención a la creación de citas y prevención de doble reserva.

---

# 19. Seeds

Crear seeds para desarrollo con:

- especialidades;
- un administrador;
- varios médicos;
- varios pacientes;
- disponibilidad;
- citas de ejemplo.

Nunca incluir credenciales reales.

Las credenciales de desarrollo deben estar documentadas únicamente como valores ficticios/locales.

---

# 20. UX inicial

Priorizar experiencia clara y profesional.

## Páginas públicas

```text
/
 /medicos
 /medicos/[id]
 /especialidades
 /login
 /registro
```

## Paciente

```text
/paciente
/paciente/citas
/paciente/perfil
```

## Médico

```text
/medico
/medico/agenda
/medico/disponibilidad
/medico/perfil
```

## Administración

```text
/admin
/admin/medicos
/admin/especialidades
/admin/citas
```

---

# 21. Renderizado con Next.js

Utilizar Server Components por defecto.

Usar Client Components únicamente cuando exista una razón concreta, por ejemplo:

- interacción compleja;
- estado local;
- hooks del navegador;
- calendario interactivo;
- formularios con comportamiento cliente;
- componentes que dependen de APIs del navegador.

No marcar árboles completos con `"use client"` sin necesidad.

---

# 22. Gestión de estado frontend

No incorporar Redux por defecto.

Preferir:

```text
Server Components
URL state
estado local de React
formularios
cache del cliente de API cuando sea necesario
```

Incorporar una solución de estado global únicamente cuando exista un caso concreto que lo justifique.

---

# 23. Diseño responsive

Todo el frontend debe diseñarse desde el comienzo de forma responsive.

Prioridad:

```text
móvil
tablet
desktop
```

Aunque la primera entrega sea web, muchos pacientes accederán desde teléfonos.

El diseño responsive también permitirá validar UX antes de construir la futura app móvil nativa.

---

# 24. Accesibilidad

Aplicar como mínimo:

- HTML semántico;
- labels correctos;
- navegación con teclado;
- estados de focus visibles;
- contraste adecuado;
- textos alternativos;
- mensajes de error accesibles;
- botones y enlaces correctamente diferenciados.

---

# 25. Tests mínimos del MVP

## Backend

Crear pruebas para:

- registro;
- login;
- autorización;
- permisos por roles;
- creación de disponibilidad;
- reserva válida;
- reserva en horario no disponible;
- doble reserva;
- cancelación;
- verificación de médico;
- acceso indebido a recursos ajenos.

## E2E web

Como mínimo:

### Flujo paciente

```text
registro
-> login
-> buscar médico
-> abrir perfil
-> seleccionar horario
-> reservar
-> ver cita en dashboard
```

### Flujo médico

```text
login
-> editar perfil
-> configurar disponibilidad
-> revisar citas
```

### Flujo administrador

```text
login
-> abrir médicos pendientes
-> verificar médico
```

---

# 26. Definition of Done

Una funcionalidad no está terminada solo porque "funciona en mi máquina".

Debe cumplir, cuando aplique:

- TypeScript sin errores;
- lint sin errores;
- pruebas relevantes aprobadas;
- validación backend;
- autorización backend;
- manejo de errores;
- estados loading;
- estados empty;
- estados error;
- responsive;
- accesibilidad básica;
- migración de base de datos;
- documentación de variables de entorno;
- OpenAPI actualizado;
- sin secretos hardcodeados;
- sin logs sensibles.

---

# 27. Variables de entorno

Mantener `.env.example`.

Ejemplo conceptual:

```text
DATABASE_URL=

APP_URL=
API_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

EMAIL_FROM=
EMAIL_PROVIDER_API_KEY=

STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

No subir `.env` real al repositorio.

---

# 28. Docker

Crear Dockerfile para el backend.

Para desarrollo local puede existir Docker Compose con:

```text
PostgreSQL
API
```

Redis se agregará cuando exista una necesidad real.

No introducir infraestructura adicional sin requerimiento funcional.

---

# 29. CI/CD

Configurar GitHub Actions con al menos:

```text
install
lint
typecheck
test
build
```

Toda Pull Request debe pasar estas verificaciones antes de considerarse integrable.

---

# 30. Convenciones de código

## TypeScript

- `strict: true`.
- Evitar `any`.
- Preferir tipos explícitos en límites del sistema.
- Validar datos externos.
- No confiar en tipos de TypeScript como validación runtime.

## Nombres

Usar inglés para:

```text
código
variables
funciones
clases
tablas
endpoints
commits
```

La interfaz para usuarios puede estar inicialmente en español.

Ejemplo:

```typescript
createAppointment()
doctorAvailability
patientProfile
```

No:

```typescript
crearCita()
disponibilidadMedico
```

## Funciones

- pequeñas;
- con una responsabilidad clara;
- evitar lógica de negocio en controllers;
- evitar lógica compleja dentro de componentes React.

---

# 31. Convenciones NestJS

Controller:

```text
HTTP
validación de entrada
delegación
respuesta
```

Service/Application layer:

```text
casos de uso
orquestación
reglas de negocio
```

Repository/Data access:

```text
persistencia
queries
transacciones
```

No colocar reglas de dominio importantes dentro de Prisma queries dispersas.

---

# 32. Convenciones Git

Utilizar ramas cortas.

Commits pequeños y coherentes.

Ejemplos:

```text
feat(auth): add patient registration
feat(doctors): add doctor availability
feat(appointments): prevent overlapping bookings
fix(auth): rotate refresh tokens correctly
test(appointments): cover concurrent booking
```

No mezclar refactors grandes con nuevas funcionalidades si puede evitarse.

---

# 33. Documentación

Mantener:

```text
README.md
docs/architecture.md
docs/api.md
docs/decisions/
```

Para decisiones importantes utilizar ADRs simples.

Ejemplo:

```text
docs/decisions/0001-use-modular-monolith.md
docs/decisions/0002-use-postgresql.md
docs/decisions/0003-separate-web-and-api.md
```

No documentar cada detalle trivial.

Sí documentar decisiones difíciles de revertir.

---

# 34. Fases posteriores

## Fase 2 — Pagos

Agregar:

```text
PaymentModule
CommissionModule
webhooks
reconciliación
idempotencia
```

La pasarela concreta se decidirá en esa fase.

No mezclar lógica de pagos directamente dentro de `AppointmentsModule`.

Una cita puede existir independientemente del proveedor de pagos.

---

## Fase 3 — Notificaciones avanzadas

Agregar:

```text
Redis
BullMQ
workers
email
SMS
WhatsApp
recordatorios programados
```

Ejemplo:

```text
AppointmentCreated
        │
        ▼
      Queue
        │
        ├── email paciente
        ├── email médico
        └── recordatorio
```

No bloquear la petición HTTP esperando tareas secundarias.

---

## Fase 4 — Videollamadas

Utilizar una infraestructura WebRTC administrada, inicialmente evaluando LiveKit.

Arquitectura deseada:

```text
Paciente ───────┐
                │
                ▼
             LiveKit
                ▲
                │
Médico ─────────┘

       NestJS
          │
          ├── valida cita
          ├── valida usuario
          ├── valida horario
          └── emite token temporal
```

El audio y video NO deben atravesar el servidor NestJS.

NestJS controla autorización y creación de sesión, no transporta directamente los streams multimedia.

Crear en ese momento:

```text
VideoModule
VideoSession
```

---

## Fase 5 — Aplicación móvil

Crear:

```text
apps/mobile
```

Stack probable:

```text
React Native
Expo
TypeScript
```

Debe consumir la misma API NestJS.

No duplicar reglas de negocio.

---

## Fase 6 — Realtime

Agregar WebSockets cuando exista una función concreta:

- presencia;
- sala de espera;
- notificaciones en tiempo real;
- chat;
- estado de consulta.

No confundir:

```text
WebSocket = eventos, chat, presencia

WebRTC = audio y video
```

---

## Fase 7 — Servicios clínicos

Antes de almacenar información médica clínica realizar revisión específica de:

- modelo regulatorio;
- privacidad;
- consentimiento;
- seguridad;
- auditoría;
- retención;
- permisos;
- cifrado;
- responsabilidades legales.

No incorporar historia clínica simplemente agregando nuevas columnas a las tablas existentes.

Debe tratarse como una expansión arquitectónica y regulatoria importante.

---

# 35. Preparación para extracción futura de servicios

No crear microservicios ahora.

Pero mantener módulos con límites claros.

Posibles candidatos futuros:

```text
Notifications
Payments
Video
Search
Analytics
AI
```

Solo extraerlos cuando exista una causa real, como:

- necesidades de escalado independientes;
- ciclos de despliegue diferentes;
- equipos independientes;
- requisitos de disponibilidad distintos;
- carga computacional especializada.

---

# 36. IA futura

No permitir que la primera versión de IA:

- diagnostique;
- prescriba;
- sustituya decisiones médicas;
- presente afirmaciones clínicas como certezas.

Posibles usos iniciales más seguros:

- búsqueda semántica de médicos;
- clasificación administrativa;
- ayuda para completar perfiles;
- resumen administrativo;
- soporte interno;
- automatización operativa.

La IA debe ser un módulo desacoplado del núcleo transaccional.

---

# 37. Roadmap recomendado del MVP

Implementar en este orden.

## Milestone 0 — Base

- monorepo;
- Next.js;
- NestJS;
- PostgreSQL;
- Prisma;
- Docker local;
- lint;
- typecheck;
- tests;
- CI.

## Milestone 1 — Auth

- usuarios;
- registro;
- login;
- sesiones;
- roles;
- recuperación;
- verificación email.

## Milestone 2 — Médicos

- perfiles;
- especialidades;
- verificación manual;
- página pública.

## Milestone 3 — Disponibilidad

- agenda;
- bloques horarios;
- validaciones;
- endpoints.

## Milestone 4 — Búsqueda

- listado;
- filtros iniciales;
- perfil público;
- SEO básico.

## Milestone 5 — Citas

- selección de horario;
- reserva;
- transacción;
- prevención de doble booking;
- cancelación;
- dashboards.

## Milestone 6 — Administración

- médicos pendientes;
- aprobación/rechazo;
- especialidades;
- auditoría.

## Milestone 7 — Calidad

- E2E;
- seguridad;
- errores;
- observabilidad;
- accesibilidad;
- responsive;
- documentación.

Al terminar Milestone 7 existe el MVP.

---

# 38. Criterios de éxito del MVP

El MVP se considera exitoso técnicamente cuando:

1. Un paciente puede registrarse.
2. Un médico puede registrarse.
3. Un administrador puede verificar al médico.
4. El médico puede publicar disponibilidad.
5. El paciente puede buscar al médico.
6. El paciente puede visualizar horarios.
7. El paciente puede reservar.
8. No pueden producirse dos reservas válidas para el mismo médico y horario.
9. Paciente y médico pueden visualizar la cita.
10. El sistema funciona correctamente en móvil y escritorio.
11. La API está documentada.
12. Existe cobertura de tests para los flujos críticos.
13. El proyecto puede desplegarse de forma reproducible.
14. La arquitectura permite incorporar una app móvil sin reescribir el backend.

---

# 39. Instrucciones específicas para Codex

Al trabajar en este repositorio:

1. Leer este archivo antes de realizar cambios arquitectónicos.
2. No incorporar nuevas dependencias sin una razón concreta.
3. Antes de agregar una librería, comprobar si el framework o una dependencia existente ya cubre la necesidad.
4. No implementar funciones fuera del MVP salvo que se solicite explícitamente.
5. Mantener separadas UI, reglas de negocio y persistencia.
6. Toda regla crítica debe implementarse en backend.
7. No confiar en datos enviados por cliente.
8. Escribir migraciones para cambios de esquema.
9. Agregar o actualizar tests cuando se modifica comportamiento.
10. Actualizar OpenAPI cuando cambia un endpoint.
11. Actualizar `.env.example` cuando aparece una nueva variable.
12. No introducir secretos.
13. No almacenar información médica sensible innecesaria.
14. Mantener compatibilidad futura con cliente móvil.
15. Preferir soluciones simples y explícitas.
16. Ante una decisión difícil de revertir, documentarla mediante ADR.
17. No crear microservicios durante el MVP.
18. No introducir Redis, colas, WebSockets o infraestructura de video hasta que exista una característica que realmente los necesite.
19. Si una implementación compromete seguridad o integridad de datos, priorizar corrección sobre velocidad.
20. Si los requisitos funcionales son ambiguos, elegir la opción más pequeña compatible con esta arquitectura y documentar la decisión.

---

# 40. Regla principal

El objetivo no es demostrar cuántas tecnologías se pueden utilizar.

El objetivo es construir una base profesional que pueda evolucionar:

```text
MVP web
   ↓
marketplace funcional
   ↓
pagos
   ↓
notificaciones
   ↓
videoconsulta
   ↓
aplicación móvil
   ↓
servicios médicos adicionales
   ↓
plataforma de salud digital
```

Cada fase debe poder añadirse sin destruir la anterior.

**Primero construir correctamente el núcleo: usuarios, médicos, disponibilidad y citas.**
