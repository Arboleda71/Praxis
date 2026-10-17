# Tasks: Cuentas y acceso

**Input**: [spec.md](spec.md), [plan.md](plan.md) · **Estado detallado**: [estado.md](estado.md)

Leyenda: `[x]` hecho y verificado localmente con las comprobaciones de `estado.md` · `[~]` escrito, falta verificar · `[ ]` pendiente.

Las verificaciones locales no sustituyen la aprobación constitucional, CI ni revisión de PR. Los hallazgos abiertos se registran en `estado.md`, sin agregar tareas al encargo.

## Fase 1: Base

- [x] T001 Crear `packages/contracts` (Zod 4, build con tsc) y registrarlo en los workspaces
- [x] T002 `docker-compose.yml` con Postgres 17 (bases `praxis`, `praxis_test`, `praxis_e2e`), `.env.example`
- [x] T003 Prisma 7 en `apps/api`: esquema, configuración y migración `20261017040317_cuentas` aplicada y comprobada en las tres bases
- [x] T004 Dependencias API: `@node-rs/argon2`, `cookie-parser`, `pg`, adaptador de Prisma

## Fase 2: Reglas (prueba primero)

- [x] T005 [P] Pruebas y código del dígito de verificación del NIT
- [x] T006 [P] Pruebas y código de los esquemas de registro e inicio de sesión
- [x] T007 [P] Pruebas y código del límite de intentos (5 → 15 min)

## Fase 3: API

- [x] T008 Pruebas de integración de `/auth/*` contra `praxis_test`: 14 casos de autenticación aprobados y el caso básico de la aplicación
- [x] T009 PrismaService, pipe de Zod, guardia de sesión
- [x] T010 Registro de estudiante y empresa, sesión y correo de confirmación
- [x] T011 Inicio y cierre de sesión, `GET /auth/sesion`
- [x] T012 Confirmar correo y reenviar enlace (1 por minuto)

## Fase 4: Web

- [x] T013 Reescritura `/api/*`, sesión real en `lib/session.ts`, cerrar sesión real; sesión simulada eliminada
- [x] T014 Elegir tipo, registro de estudiante y de empresa (errores por campo y resumen)
- [x] T015 Iniciar sesión (error genérico, bloqueo, `next`)
- [x] T016 Revisa tu correo, confirmar correo (válido/vencido), aviso persistente y reenvío
- [x] T017 Política de tratamiento de datos; ajuste del tema (borde de campos)

## Fase 5: Pruebas E2E y cierre

- [x] T018 Playwright: registro, confirmación, inicio de sesión, bloqueo y axe en 360 y 1080 px; recorridos de ambos roles incluidos en los 47 E2E aprobados
- [x] T019 Pruebas de M0 adaptadas a cuentas reales, aprobadas en ambas resoluciones
- [x] T020 Lint, tipos, pruebas y build aprobados localmente con Postgres; advertencias y límites en `estado.md`
