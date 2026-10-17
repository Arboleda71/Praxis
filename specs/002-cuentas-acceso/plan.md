# Implementation Plan: Cuentas y acceso

**Branch**: `002-cuentas-acceso` | **Date**: 2026-10-17 | **Spec**: [spec.md](spec.md)
**Mockups**: `docs/praxis-mockups.pen`, sección «M1 · Cuentas y acceso» (aprobado el 2026-10-17; escritorio a 1080 px)

## Summary

Registro de estudiante y empresa, confirmación de correo, inicio y cierre de sesión. Primer módulo con backend:
NestJS + Prisma + Postgres, contraseñas con argon2, sesión en cookie `httpOnly`, esquemas Zod compartidos. La web
reemplaza la sesión simulada de M0 por la real; la navegación de M0 no cambia.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 24, ESM
**Primary Dependencies**: NestJS 12, Prisma 7 (`prisma-client` + `@prisma/adapter-pg`), `@node-rs/argon2`, Zod 4, Next.js 16, MUI 9.4
**Storage**: PostgreSQL 17 en Docker (`docker-compose.yml`): base `praxis` y base `praxis_test`
**Testing**: Vitest (`packages/contracts`, web), Jest en modo ESM (API, integración contra Postgres real), Playwright + axe (E2E)
**Constraints**: WCAG 2.1 AA, solo español, mobile-first (360 px / 1080 px), datos ficticios

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| VI. Mínimo acceso | La sesión expone solo rol, nombre, correo y si está confirmado |
| VIII. Protección de datos | Casilla sin marcar; se guarda la fecha de autorización; esquemas estrictos que rechazan campos no pedidos |
| IX. Honestidad | NIT validado solo por formato y dígito; nada de «verificada» |
| X. Accesible | Errores junto al campo con `aria-describedby`, resumen que recibe el foco, axe en E2E |
| XII. Simplicidad | Nest y Prisma directos; un pipe de Zod de pocas líneas; sin colas ni cachés |
| XIII. Pruebas primero | NIT, esquemas, límite de intentos y flujo de cuentas con la prueba antes del código |
| XIV. Seguridad | Zod en la API, argon2, cookie `httpOnly`+`SameSite=Lax`+`Secure` en producción, 5 intentos → 15 min, tokens guardados como hash SHA-256, sin tokens ni datos personales en logs |

## Decisiones

- **Contratos** (`packages/contracts`): se compila con `tsc` a `dist/` (ESM + tipos). La API valida y la web
  valida formularios con los mismos esquemas.
- **Sesión**: token aleatorio de 32 bytes en la cookie `praxis_sesion`; en la base solo su hash. 30 días de vida.
  Cerrar sesión borra la fila.
- **Web ↔ API**: Next reescribe `/api/*` hacia la API, así la cookie es del mismo origen. Los Server Components
  leen la sesión con `GET /auth/sesion` reenviando la cookie.
- **Límite de intentos**: en memoria, por correo y por IP.
  `ponytail:` una sola instancia de la API; si se escala a varias, mover a Postgres.
- **Correo**: Resend por HTTP si hay `RESEND_API_KEY`; en desarrollo y pruebas los correos se escriben como
  archivos en `apps/api/.correos/` (ignorado por git), nunca en los logs.
- **Login sin filtrar existencia**: con un correo inexistente se verifica contra un hash ficticio para igualar
  el tiempo de respuesta.

## Project Structure

```text
packages/contracts/src/        # nit.ts, auth.ts (+ pruebas)
apps/api/
├── prisma/schema.prisma       # Cuenta, Estudiante, Empresa, Sesion, EnlaceConfirmacion
├── prisma.config.ts
├── src/prisma.service.ts
├── src/auth/                  # controller, service, intentos, correo, zod.pipe, sesion.guard
└── test/auth.e2e-spec.ts      # integración contra praxis_test
apps/web/src/
├── app/registro/{,estudiante,empresa}/  app/ingresar  app/revisa-tu-correo
├── app/confirmar-correo  app/politica-de-datos
├── components/{FormularioRegistro,FormularioIngreso,ReenviarEnlace,AvisoConfirmar}.tsx
└── lib/session.ts             # sesión real desde la API
docker-compose.yml             # Postgres 17
```

## Complexity Tracking

| Adición | Por qué | Alternativa descartada |
|---|---|---|
| `packages/contracts` con build | Lo exige la constitución; tsc evita problemas de TS fuera de `rootDir` | Importar TS fuente: rompe `nest build` |
| `@node-rs/argon2` | argon2 con binarios precompilados; npm bloquea los scripts de instalación del paquete `argon2` | `argon2`: requiere node-gyp |
| Límite de intentos en memoria | Una sola instancia en el piloto | Tabla en Postgres: más código sin necesidad medida |
