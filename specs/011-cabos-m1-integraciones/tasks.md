# Tasks: Cabos sueltos de M1 e integraciones listas para producción

**Input**: `specs/011-cabos-m1-integraciones/` (plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md)

**Tests**: incluidas. El límite de intentos y el origen del cliente son reglas de seguridad (principio
XIII): su prueba se escribe y se ve fallar antes del código.

**Formato**: `[ID] [P?] [Story] Descripción`. `[P]` = archivo distinto, sin dependencia pendiente.

## Phase 1: Setup

- [x] T001 Añadir el servicio `minio` (loopback, tmpfs, healthcheck) a `docker-compose.test.yml` y levantarlo con `npm run db:test`
- [x] T002 [P] Añadir `PROXY_SECRETO` y la nota de `S3_ENDPOINT` a `apps/api/.env.example`; añadir los scripts `verificar:proveedores` y `test:scripts` a `package.json`

## Phase 2: Foundational (bloquea US1, US3 y US5)

- [x] T003 Añadir `model Intento` a `apps/api/prisma/schema.prisma` y crear la migración `apps/api/prisma/migrations/<fecha>_intentos/migration.sql`; regenerar el cliente
- [x] T004 Escribir `apps/api/test/intentos.e2e-spec.ts` (Postgres real, dos instancias de `Intentos`): 50 reservas simultáneas → 5; bloqueo visible desde la otra instancia; ventana vencida reinicia; acierto borra `correo:` y devuelve la reserva de `ip:`; registro 10 por hora; segundos restantes; vencidos se borran. **Verla fallar**
- [x] T005 Reescribir `apps/api/src/auth/intentos.ts` sobre Prisma con la sentencia atómica de research R2 (clave `sha256`, reloj de Postgres); `reservar` devuelve segundos (0 = permitido); registrar `Intentos` como provider normal en `apps/api/src/app.module.ts`
- [x] T006 Adaptar `apps/api/src/auth/auth.service.ts` a la API asíncrona y añadir `segundos` y minutos reales a los 429 (contracts/api.md); retirar los casos en memoria de `apps/api/src/auth/intentos.spec.ts` y `apps/api/src/auth/seguridad.spec.ts`; ajustar `limpiar()` en `apps/api/test/*.e2e-spec.ts` y `apps/api/test/servidor.ts`

**Checkpoint**: `npm run test:e2e -w api` en verde con los contadores en la base.

## Phase 3: US1 — Un usuario no bloquea a todos (P1)

**Independent Test**: `apps/api/test/origen.e2e-spec.ts` e `intentos.e2e-spec.ts`; `apps/web/e2e/bloqueo.spec.ts`.

- [x] T007 [US1] Escribir `apps/api/test/origen.e2e-spec.ts`: sin secreto se ignoran `x-praxis-ip` y `X-Forwarded-For`; con secreto correcto dos IP distintas son orígenes distintos; secreto incorrecto o IP inválida se ignoran; producción sin `PROXY_SECRETO` no arranca. **Verla fallar**
- [x] T008 [US1] Crear `apps/api/src/auth/origen.ts` (`origenDe(req)`), usarlo en `apps/api/src/auth/auth.controller.ts`, exigir `PROXY_SECRETO` (≥ 32) en producción en `apps/api/src/seguridad.ts` con su caso en `apps/api/src/configuracion.spec.ts`, y corregir el comentario de `apps/api/src/configurar.ts`
- [x] T009 [US1] Crear `apps/web/src/proxy.ts` (matcher `/api/:path*`): sobrescribe `x-praxis-ip` y `x-praxis-proxy`; pasar `PROXY_SECRETO` a los dos servidores en `apps/web/playwright.config.ts`
- [x] T010 [US1] Añadir a `apps/web/e2e/bloqueo.spec.ts` el caso «una IP declarada por el cliente no da intentos extra a través de la web»

## Phase 4: US2 — Sé si de verdad cerré sesión (P1)

**Independent Test**: `apps/web/src/components/AccountMenu.test.tsx`, `apps/web/src/lib/actions.test.ts`.

- [x] T011 [P] [US2] Escribir `apps/web/src/lib/actions.test.ts`: API caída o 5xx → devuelve error y **no** borra la cookie; 204 → borra y redirige; sin cookie → redirige
- [x] T012 [P] [US2] Escribir `apps/web/src/components/AccountMenu.test.tsx`: el error de `logout` se muestra con `role="alert"` y el menú sigue disponible para reintentar
- [x] T013 [US2] Añadir `AbortSignal.timeout(10_000)` al `fetch` de `apps/web/src/lib/actions.ts`; limpiar el error al reintentar en `apps/web/src/components/AccountMenu.tsx`; caso «sesión desconocida → 204» en `apps/api/test/auth.e2e-spec.ts`

## Phase 5: US3 — El formulario de ingreso vuelve solo (P2)

**Independent Test**: `apps/web/src/components/FormularioIngreso.test.tsx`.

- [x] T014 [US3] Escribir `apps/web/src/components/FormularioIngreso.test.tsx` (relojes simulados): 429 con `segundos: 120` → aviso «2 minutos», botón deshabilitado; al cumplirse se habilita y anuncia; sin `segundos` usa 15 min
- [x] T015 [US3] Implementar la cuenta regresiva por fecha límite en `apps/web/src/components/FormularioIngreso.tsx` (robusta a pestaña en segundo plano) con región `aria-live`
- [x] T016 [US3] Comprobar en `apps/web/e2e/bloqueo.spec.ts` que el aviso muestra los minutos restantes

## Phase 6: US4 — Entiendo por qué no pude confirmar mi correo (P2)

**Independent Test**: `apps/web/src/components/ConfirmacionCorreo.test.tsx`.

- [x] T017 [US4] Escribir `apps/web/src/components/ConfirmacionCorreo.test.tsx`: red caída, 500 y cuerpo no JSON → «No pudimos conectar» y botón disponible; 410 y 400 → «Este enlace ya no sirve» + enlace a ingresar, sin botón de confirmar; 200 → confirmado
- [x] T018 [US4] Ajustar `apps/web/src/components/ConfirmacionCorreo.tsx` a los tres resultados de contracts/api.md

## Phase 7: US5 — Si el correo no sale, sigo usando mi cuenta (P2)

**Independent Test**: casos nuevos de `apps/api/test/auth.e2e-spec.ts` con `fetch` de Resend sustituido.

- [x] T019 [US5] Añadir a `apps/api/test/auth.e2e-spec.ts`: proveedor caído al registrar → 201 y sesión; al reenviar → 503, el enlace anterior confirma, y el siguiente reenvío tras un minuto funciona; el `fetch` lleva `signal`. **Verla fallar**
- [x] T020 [US5] Añadir timeout a `apps/api/src/auth/correo.ts` y reordenar `reenviarConfirmacion` en `apps/api/src/auth/auth.service.ts` (data-model.md, «EnlaceConfirmacion»)

## Phase 8: US6 — Archivos en el almacenamiento real (P2)

**Independent Test**: `apps/api/test/archivos-s3.e2e-spec.ts` contra MinIO.

- [x] T021 [US6] Escribir `apps/api/test/archivos-s3.e2e-spec.ts`: guardar + enlace devuelve el mismo contenido; sin firma → 403; copia conserva el original tras reemplazo; borrado → el enlace no entrega; el enlace vence en 5 min
- [x] T022 [US6] `forcePathStyle` con `S3_ENDPOINT` en `apps/api/src/perfil/archivos.ts`

## Phase 9: US7 — Verificar cada proveedor (P3)

**Independent Test**: `scripts/verificar-proveedores.test.mts`.

- [x] T023 [US7] Escribir `scripts/verificar-proveedores.test.mts` (`node --test`, `fetch` sustituto): sin credenciales → tres «sin configurar» y ninguna llamada; llave de pagos de producción → falla sin llamada; 403 de Resend → «falla» con causa; la salida no contiene secretos ni el correo completo
- [x] T024 [US7] Implementar `scripts/verificar-proveedores.mts` (contracts/api.md) y añadir al CI (`.github/workflows/ci.yml`) MinIO y `npm run test:scripts`
- [x] T025 [US7] Medir registro y correo (PM011) en `apps/web/e2e/cuentas.spec.ts` y registrar el resultado en `specs/002-cuentas-acceso/estado.md`

## Phase 10: US8 — Dónde vive cada dato (P3)

- [x] T026 [P] [US8] Escribir `docs/produccion.md`: variables y cómo obtener cada credencial, proxy/IP y su validación en el primer despliegue, residencia de datos por proveedor (research R6, con fuentes y «pendiente de validación»), requisitos de cobro real y la enmienda que exigiría

## Phase 11: Polish

- [x] T027 Ejecutar la batería completa de quickstart.md (lint, tipos, unitarias, integración, E2E)
- [x] T028 Revisión independiente por agentes: seguridad del diff, corrección, y trazabilidad spec → pruebas; corregir lo confirmado

## Resultado de la revisión (T028, 2026-11-11)

Dos revisores independientes (API y web/trazabilidad). Corregido, cada caso con su prueba:

| Hallazgo | Corrección | Prueba |
|---|---|---|
| Interbloqueo posible entre `exito` y `reservar` | `exito` en sentencias sueltas; barrido con `SKIP LOCKED` | `intentos.e2e-spec` «aciertos y reservas simultáneos… no se interbloquean» |
| Una reserva que pierde la carrera sumaba en las demás claves | transacción que se deshace si alguna clave no suma | «una reserva que pierde la carrera…» (determinista; falla sin la corrección) |
| Un reenvío con respuesta tardía de Resend dejaba muerto el enlace entregado | al fallar no se anula ningún enlace | `auth.e2e-spec` «si el proveedor aceptó pero respondió tarde…» |
| IPv6: un cubo por dirección | origen por /64; `::ffff:` como IPv4 | `origen.e2e-spec` «una IPv6 cuenta por su /64…» |
| `/API/…` se saltaba `proxy.ts` | matcher en todo menos estáticos | `src/proxy.test.ts` |
| Confirmación: cambio de estado mudo y foco perdido | foco al título tras actuar | `ConfirmacionCorreo.test` |
| Aviso de cierre de sesión dentro de la barra a 360 px y sin repetir el anuncio | `Snackbar` con clave por intento | `AccountMenu.test` «un segundo fallo seguido…» |
| Foco en un contenedor vacío al terminar el bloqueo; `segundos` desmedido | foco al botón; tope de 1 h | `FormularioIngreso.test` |
| Regla de reinicio del quinto fallo sin prueba | — | «el quinto fallo reinicia el bloqueo…» |
| Prueba de axe inestable con avisos que aparecen con fundido | esperar a que terminen las animaciones finitas | `e2e/ayudas.ts` |

Aceptado y documentado, sin cambio de código:

- Clave SHA-256 sin sal (`docs/produccion.md` §3).
- `proxy.ts` confía en las cabeceras de la plataforma, que fuera de Vercel controla el cliente (§2: hay que validarlo en el primer despliegue).
- Si la propia Server Action de cierre de sesión falla por red, la persona ve la página de error y no el aviso; nunca se le dice que salió.
- [x] T029 Actualizar `docs/pendientes-mvp.md`, `docs/mvp-entrega.md`, `docs/pendientes-constitucion.md` y `specs/002-cuentas-acceso/estado.md` con lo cerrado y lo que sigue pendiente de credenciales

## Dependencies

- Phase 2 bloquea US1, US3 (necesita `segundos`) y US5 (toca `auth.service.ts`).
- US2, US4, US6, US8 son independientes entre sí y de Phase 2.
- US7 depende de US6 (reutiliza `Archivos` con `forcePathStyle`).
- T006, T013, T019 y T020 tocan `auth.service.ts` / `auth.e2e-spec.ts`: van en serie.

## Parallel

- T011 y T012; T017 con T014; T026 con cualquier fase.

## Implementation Strategy

MVP = Phase 2 + US1 (el fallo de producción). Luego US2 (P1), después US3–US6, y por último US7–US8.
