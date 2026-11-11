# Implementation Plan: Cabos sueltos de M1 e integraciones listas para producción

**Branch**: `011-cabos-m1-integraciones` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-cabos-m1-integraciones/spec.md`

## Summary

Cierra PM005, PM006, PM008, PM009, PM011 (hallazgos de M1) y PM018–PM020 (producción) sin pantallas ni
correos nuevos. Tres cambios de fondo y varios pequeños:

1. **Límite de intentos en Postgres** (PM019): `Intentos` deja el `Map` en memoria y usa una tabla `Intento`
   con una sola sentencia atómica por reserva. Devuelve los segundos restantes, que la API expone en el 429.
2. **Origen real del cliente** (proxy/IP): la web añade en `proxy.ts` la IP del visitante y un secreto
   compartido; la API solo cree esa IP si el secreto coincide. `trust proxy` sigue en `false`.
3. **Proveedores verificables sin credenciales**: timeout en Resend, `forcePathStyle` para S3 con endpoint
   propio, pruebas de archivos contra MinIO y `npm run verificar:proveedores`.

Lo pequeño: el reenvío ya no invalida el enlace anterior si el envío falla; la confirmación distingue enlace
vencido de fallo de conexión; el ingreso muestra y respeta el tiempo real de bloqueo; el cierre de sesión
tiene timeout y pruebas de su camino de fallo; `docs/produccion.md` reúne variables, residencia de datos y
requisitos de cobro real.

## Technical Context

**Language/Version**: TypeScript, Node.js 24 (ESM)

**Primary Dependencies**: NestJS 12, Prisma 7, Next.js 16 (App Router, `proxy.ts`), MUI 9, Zod
(`packages/contracts`), `@aws-sdk/client-s3` (ya instalado). **Ninguna dependencia nueva.**

**Storage**: PostgreSQL (tabla nueva `Intento`, una migración). Archivos: S3/R2; en pruebas, MinIO en Docker.

**Testing**: Jest (API, integración con Postgres real y MinIO), Vitest + Testing Library (web), Playwright
con axe (E2E), `node --test` (scripts).

**Target Platform**: Vercel (web) y Railway (API + Postgres).

**Project Type**: aplicación web (monorepo `apps/web`, `apps/api`, `packages/contracts`).

**Performance Goals**: API < 500 ms p95 (constitución). El ingreso suma una sentencia SQL por petición.

**Constraints**: sin credenciales reales; pagos solo sandbox; sin servicios nuevos (XII); sin datos
personales en logs ni en la salida de la verificación (XIV).

**Scale/Scope**: piloto de 10.000 estudiantes y 500 empresas. ~15 archivos de código tocados, 1 migración.

## Constitution Check

*GATE: aprobado antes de Phase 0 y revisado tras Phase 1.*

| Principio | Estado | Nota |
|---|---|---|
| VIII. Protección de datos | Cumple | Pagos siguen solo en sandbox (FR-020). La clave del contador guarda un hash, no el correo. `docs/produccion.md` atiende `TODO(DATA_RESIDENCY)` como documento pendiente de validación humana. |
| IX. Honestidad | Cumple | La medición real de correo se declara pendiente de credenciales; no se simula. |
| X. Accesible | Cumple | Avisos de cierre de sesión y de fin de bloqueo con `role="alert"` / `aria-live`; E2E con axe. |
| XI. MVP primero | Cumple | Sin pantallas ni correos nuevos; restablecer contraseña sigue fuera. |
| XII. Simplicidad | Cumple | Sin Redis ni dependencias nuevas; Prisma directo con una sentencia SQL cruda donde hace falta atomicidad. Los scripts viven en `scripts/` (ya existente), no en un proyecto nuevo. |
| XIII. Pruebas primero en lo crítico | Cumple | Límite de intentos y origen del cliente son reglas de seguridad: su prueba de integración se escribe y se ve fallar antes del código, contra Postgres real. |
| XIV. Seguridad por defecto | Cumple | Origen no falsificable, secreto en variable de entorno comparado en tiempo constante, timeout de proveedor, archivos solo con URL firmada (verificado en MinIO), verificación sin secretos en la salida. |
| Stack | Cumple | No cambia ninguna fila. MinIO es solo sustituto de pruebas del «almacenamiento compatible con S3». |
| Reglas de producto | Cumple | El único correo sigue siendo la confirmación (FR-017). |

Sin violaciones: no hay *Complexity Tracking*.

## Project Structure

### Documentation (this feature)

```text
specs/011-cabos-m1-integraciones/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/api.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
apps/api/
├── prisma/schema.prisma                      # + model Intento
├── prisma/migrations/<fecha>_intentos/       # migración nueva
├── src/auth/intentos.ts                      # Map → Postgres, devuelve segundos
├── src/auth/origen.ts                        # NUEVO: IP del cliente con secreto compartido
├── src/auth/auth.service.ts                  # await intentos, segundos en 429, reenvío sin invalidar si falla
├── src/auth/auth.controller.ts               # origenDe(req) en vez de req.ip
├── src/auth/correo.ts                        # timeout
├── src/perfil/archivos.ts                    # forcePathStyle con S3_ENDPOINT
├── src/seguridad.ts                          # PROXY_SECRETO obligatorio en producción
├── src/app.module.ts                         # Intentos como provider normal
├── src/auth/intentos.spec.ts, seguridad.spec.ts   # se retiran los casos en memoria
└── test/
    ├── intentos.e2e-spec.ts                  # NUEVO (Postgres real, dos instancias)
    ├── origen.e2e-spec.ts                    # NUEVO
    ├── archivos-s3.e2e-spec.ts               # NUEVO (MinIO)
    └── auth.e2e-spec.ts, seguridad.e2e-spec.ts    # casos de correo caído, segundos, reenvío

apps/web/src/
├── proxy.ts                                  # NUEVO: cabeceras de origen hacia /api
├── lib/actions.ts                            # timeout en logout
├── components/FormularioIngreso.tsx          # cuenta regresiva real
├── components/ConfirmacionCorreo.tsx         # estado «vencido» frente a «sin conexión»
└── components/*.test.tsx                     # NUEVOS: AccountMenu, FormularioIngreso, ConfirmacionCorreo
apps/web/e2e/bloqueo.spec.ts                  # origen falsificado por la web + tiempo restante

scripts/
├── verificar-proveedores.mts                 # NUEVO
└── verificar-proveedores.test.mts            # NUEVO (node --test, fetch sustituto)

docker-compose.test.yml                       # + servicio minio
.github/workflows/ci.yml                      # levanta MinIO, corre la prueba del script
docs/produccion.md                            # NUEVO: variables, proxy, residencia de datos, cobro real
docs/pendientes-mvp.md, mvp-entrega.md, specs/002-cuentas-acceso/estado.md, apps/api/.env.example
```

**Structure Decision**: se mantiene la estructura de tres proyectos. `scripts/` ya existe en la raíz con su
`tsconfig.json`; el comando de verificación vive allí junto a los lanzadores de demo.

## Decisiones de diseño (detalle en research.md)

- **D1 Reserva atómica**: una sentencia `INSERT … ON CONFLICT DO UPDATE … WHERE` por petición, con todas las
  claves; si no devuelve una fila por clave, la petición está bloqueada. El reloj es el de Postgres.
- **D2 Clave**: `sha256(clave)`; no se guardan correos de quien no tiene cuenta.
- **D3 Origen**: cabeceras `x-praxis-ip` y `x-praxis-proxy` puestas por `apps/web/src/proxy.ts`; la API las
  acepta solo con el secreto correcto y si la IP es válida. Sin secreto usa `req.ip` (la del salto anterior).
- **D4 Reenvío**: crear enlace nuevo → enviar → si sale, invalidar los anteriores; si falla, anular solo el
  nuevo. El límite de un reenvío por minuto se conserva en ambos casos.
- **D5 Sustitutos**: MinIO real para S3; `fetch` inyectado para Resend y Wompi, de modo que el código de
  producción no gana ninguna variable para redirigir proveedores.
