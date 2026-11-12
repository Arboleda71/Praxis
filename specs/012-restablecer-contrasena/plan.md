# Implementation Plan: Restablecer la contraseña

**Branch**: `012-restablecer-contrasena` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

Tres endpoints en `auth`, una tabla, dos páginas y un enlace en Iniciar sesión. Todo se apoya en piezas que ya
existen; no hay dependencias nuevas.

| Pieza | Qué se reutiliza |
|---|---|
| Token del enlace | `nuevoToken` / `hashToken` de `auth/sesion.ts` (solo se guarda el hash) |
| Límite por origen | `Intentos.reservar('restablecer:<origen>')`, misma regla que `registro:` (10 por hora) |
| Origen del visitante | `origenDe(req)` (spec 011) |
| Correo | `Correo` gana `enviarRestablecer`; los dos correos comparten un método privado `enviar` |
| Reglas de contraseña | validador `contrasena` de `packages/contracts/src/auth.ts` |
| Rechazo de otros sitios | middleware de `Origin` de `configurar.ts`, sin cambios |
| Pantallas | `paginaCuenta` / `panelCuenta`, `CampoContrasena`, patrón de foco de `ConfirmacionCorreo` |

## Technical Context

**Language/Version**: TypeScript, Node.js 24 (ESM). **Dependencias nuevas**: ninguna.

**Storage**: PostgreSQL, tabla nueva `EnlaceRestablecer`, migración `20261111120000_restablecer`.

**Testing**: Jest con Postgres real (`apps/api/test/restablecer.e2e-spec.ts`), Vitest + Testing Library
(`FormularioOlvide.test.tsx`, `FormularioRestablecer.test.tsx`, `packages/contracts/src/auth.test.ts`) y
Playwright con axe (`apps/web/e2e/restablecer.spec.ts`).

## Constitution Check

| Principio | Estado | Nota |
|---|---|---|
| VIII. Protección de datos | Cumple | No se pide ningún dato nuevo. El enlace guarda un hash y se borra al usarse. |
| IX. Honestidad | Cumple | La pantalla dice «si el correo está registrado»; no afirma que se envió. |
| X. Accesible | Cumple | El resultado recibe el foco; errores por campo; axe en E2E a 360 y 1080 px. |
| XI. MVP primero | Cumple | Sin «cambiar contraseña» desde el perfil ni correo de aviso. |
| XII. Simplicidad | Cumple | Sin proyectos ni dependencias nuevas. Una fila es un enlace vigente: no hay columna `usadoEn`. |
| XIII. Pruebas primero en lo crítico | **Parcial** | Las pruebas se escribieron junto al código y no se vieron fallar antes de implementarlo. Pasan todas (ver «Resultado local»). |
| XIV. Seguridad por defecto | Cumple | Zod en la API, argon2, token solo como hash, límite por origen y por cuenta, cierre de sesiones, logs sin datos. |
| Stack / Reglas de producto | Cumple con v4.1.0 | Segundo correo de cuenta admitido por la enmienda, **pendiente de aprobación**. |

## Diseño

**Modelo.** `EnlaceRestablecer { id (sha256 del token), cuentaId, expiraEn, creadoEn }`, con borrado en cascada.

**API** (`apps/api/src/auth`)

| Método y ruta | Respuesta | Reglas |
|---|---|---|
| `POST /auth/olvide-contrasena` `{ correo }` | 204 siempre; 429 con `segundos` por origen; 400 si no es un correo | Reserva `restablecer:<origen>`. En una transacción bloquea la cuenta (`FOR UPDATE`), omite el envío si el último enlace tiene menos de un minuto, borra los anteriores y crea el nuevo. El envío se espera y sus fallos se callan. |
| `GET /auth/restablecer-contrasena?token=` | `{ valido }` | Solo consulta; la usa la página del servidor. |
| `POST /auth/restablecer-contrasena` `{ token, contrasena, confirmarContrasena }` | 204; 410 «Este enlace ya no sirve.»; 400 con `errores` | Comprueba la vigencia antes de argon2. En una transacción borra el enlace (el borrado decide entre dos usos simultáneos), guarda el hash nuevo, borra las sesiones y los demás enlaces. Después levanta el bloqueo `correo:`. |

**Web** (`apps/web/src`)

- `components/FormularioIngreso.tsx`: enlace «¿Olvidaste tu contraseña?».
- `app/olvide-contrasena/page.tsx` + `components/FormularioOlvide.tsx`.
- `app/restablecer-contrasena/page.tsx` (consulta la vigencia en el servidor, como `confirmar-correo`) +
  `components/FormularioRestablecer.tsx`: tres resultados — cambiada, enlace que ya no sirve, fallo de conexión.

## Fuera de alcance

Cambiar la contraseña con la sesión abierta, correo de aviso «tu contraseña cambió», confirmar el correo al
restablecer.

## Resultado local · 2026-11-11

Con la demo apagada y `npm run db:test`:

| Comando | Resultado |
|---|---|
| `npm run test -w @praxis/contracts` | 87/87 |
| `npm run test:e2e -w api` | 96/96, incluidos los 11 casos de `restablecer.e2e-spec.ts` |
| `npm run test -w web` | 51/51 |
| `npm run test:e2e -w web -- --workers=1` | 73/73 (axe a 360 y 1080 px) |
| Tipos (`tsc --noEmit`) y lint de api y web | Sin errores |

Incidencias:
- Primera corrida de `test:e2e -w api`: 5 fallos en `origen.e2e-spec.ts` (el 31.º intento esperaba 429 y recibió
  401). Se corrió justo después de apagar la demo, que usaba la misma base. Pasa solo y en dos corridas completas
  seguidas; no se reprodujo y la causa no quedó identificada. Se descartaron: suites en paralelo, reinicio de
  Postgres, salto de reloj y temporizadores de la app. Medidas (2026-11-11, verificadas en T023):
  una base por uso (`praxis_test`, `praxis_e2e`, `praxis_demo`; antes las tres compartían `praxis_test`), la
  integración se niega a arrancar si hay otras conexiones a su base (`test/seguridad/base-libre.ts`) y, si el
  fallo vuelve, `origen.e2e-spec.ts` imprime los contadores y las conexiones abiertas.
- `e2e/restablecer.spec.ts` falló en las dos resoluciones: `getByRole("alert")` también encontraba el anunciador de
  rutas de Next (`#__next-route-announcer__`). Se filtró por texto; error de la prueba, no de la feature.

## Pendiente

- Aplicar la migración en cada base (`npm run demo:db` para la demo; `prisma migrate deploy` en despliegue).
- Aprobación de la enmienda v4.1.0 y revisión por PR.
- Envío real con Resend: depende de PM018.
