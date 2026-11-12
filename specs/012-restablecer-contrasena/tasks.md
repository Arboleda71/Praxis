# Tasks: Restablecer la contraseña

**Input**: `specs/012-restablecer-contrasena/` (spec.md, plan.md)

**Tests**: incluidas y ejecutadas el 2026-11-11 (fase 4).

## Phase 1: Base

- [x] T001 Enmienda v4.1.0 de `.specify/memory/constitution.md` (segundo correo de cuenta; XIV)
- [x] T002 `model EnlaceRestablecer` en `apps/api/prisma/schema.prisma` y migración `apps/api/prisma/migrations/20261111120000_restablecer/migration.sql`
- [x] T003 `olvideContrasenaSchema` y `restablecerContrasenaSchema` en `packages/contracts/src/auth.ts`, con casos en `auth.test.ts`

## Phase 2: API

- [x] T004 [US2, US5] Regla `restablecer:` (10 por hora por origen) en `apps/api/src/auth/intentos.ts`
- [x] T005 [US1] `enviarRestablecer` en `apps/api/src/auth/correo.ts`, compartiendo el envío con la confirmación
- [x] T006 [US1–US5] `olvideContrasena`, `estadoRestablecer` y `restablecerContrasena` en `apps/api/src/auth/auth.service.ts`
- [x] T007 Rutas `POST /auth/olvide-contrasena` y `GET`/`POST /auth/restablecer-contrasena` en `apps/api/src/auth/auth.controller.ts`
- [x] T008 Pruebas de integración en `apps/api/test/restablecer.e2e-spec.ts` (11 casos)

## Phase 3: Web

- [x] T009 [US1] Enlace «¿Olvidaste tu contraseña?» en `apps/web/src/components/FormularioIngreso.tsx`
- [x] T010 [US1, US2] `apps/web/src/app/olvide-contrasena/page.tsx` y `apps/web/src/components/FormularioOlvide.tsx`, con `FormularioOlvide.test.tsx`
- [x] T011 [US1, US4] `apps/web/src/app/restablecer-contrasena/page.tsx` y `apps/web/src/components/FormularioRestablecer.tsx`, con `FormularioRestablecer.test.tsx`
- [x] T012 Recorrido en navegador con axe en `apps/web/e2e/restablecer.spec.ts`

## Phase 4: Verificación

- [x] T013 `npm run test -w @praxis/contracts` — 87/87
- [x] T014 `npm run db:test` y `npm run test:e2e -w api` (con la demo apagada: comparten la base `praxis_test`) — 96/96
- [x] T015 `npm run test -w web` — 51/51
- [x] T016 `npm run test:e2e -w web -- --workers=1` — 73/73
- [x] T017a Registrar los resultados en `plan.md`
- [ ] T017b Aprobar la enmienda v4.1.0 y abrir el PR

## Phase 5: Incidencias de la verificación

- [x] T018 `e2e/restablecer.spec.ts`: filtrar `getByRole("alert")` por texto (chocaba con el anunciador de rutas de Next)
- [x] T019 Una base por uso en `apps/api/test/seguridad/base-pruebas.ts`: `praxis_test` (Jest), `praxis_e2e` (Playwright: `apps/web/playwright.config.ts`, `apps/web/e2e/migrar.ts`, `apps/api/test/servidor.ts`) y `praxis_demo` (`scripts/demo-api.mts`, `scripts/demo-migrar.mts`)
- [x] T020 `apps/api/test/seguridad/base-libre.ts`: crea la base si falta; `apps/api/test/migrar.ts` rechaza la corrida si hay otras conexiones a `praxis_test`
- [x] T021 Diagnóstico en `apps/api/test/origen.e2e-spec.ts` cuando un intento que debía bloquearse no se bloquea
- [x] T022 Casos nuevos en `apps/api/test/seguridad/base-pruebas.test.ts`
- [x] T023 Regresión (2026-11-11): `npm run test:seguridad-db` 17/17; `npm run test:e2e -w api` 96/96 en tres corridas seguidas; con una conexión ajena abierta a `praxis_test`, Jest se niega a arrancar y la nombra; `npm run test:e2e -w web -- --workers=1` 73/73 sobre `praxis_e2e` recién creada; `npm run demo:db` crea y migra `praxis_demo`
