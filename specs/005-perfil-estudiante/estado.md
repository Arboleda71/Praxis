# Estado de M3 · Perfil del estudiante

> 2026-10-23, America/Bogota. Código completo; **falta la verificación con Postgres**. La virtualización del equipo
> está desactivada y Docker Desktop no arranca su motor, así que no se aplicó la migración ni corrieron las pruebas
> de integración ni el E2E. Tarea urgente: `docs/pendientes-mvp.md` PM000.

## Verificado sin base de datos

| Parte | Resultado |
|---|---|
| `npm run test -w @praxis/contracts` | 79 aprobadas (19 nuevas de M3: perfil mínimo, esquemas, tipo por contenido, límites y mensajes). Tras el cambio de programa a texto libre: 78 |
| Prueba primero (XIII) | `perfil.test.ts` se vio fallar (módulo inexistente) antes de escribir `perfil.ts` |
| Build de contracts, `api` y `web` | Aprobados; la web incluye las 5 rutas nuevas |
| Tipos (`tsc --noEmit`) de `api` y `web` | Aprobados |
| Lint de `api`, `web` y contracts | Sin errores; sigue solo la advertencia existente de `nit.ts` |
| `npm run test -w api` (unitarias) y `npm run test -w web` | 5 y 12 aprobadas |

## Pendiente de verificar (necesita Postgres)

1. Aplicar `apps/api/prisma/migrations/20261023120000_perfil` (generada con `prisma migrate diff` desde el esquema
   anterior, sin base): `npm exec --no --workspace api -- prisma migrate dev` y comprobar `migrate status`.
2. `npm run test:e2e -w api`: `test/perfil.e2e-spec.ts` (17 casos: acceso 401/403, perfil mínimo, secciones,
   archivos por contenido y tamaño, enlaces firmados, aval, foto). Escritos antes del código, **nunca ejecutados**.
3. `npm run test:e2e -w web -- --workers=2`: `e2e/perfil.spec.ts` (5 recorridos × 360/1080 px con axe) y los E2E
   de M0/M1, que se ajustaron porque el perfil vacío ahora muestra la guía en lugar del título «Mi perfil».
4. Revisión visual contra los mockups (`docs/praxis-mockups.pen`, frame M3) en 360 y 1080 px.

Hasta entonces las tareas T001 y T006–T022 quedan como `[~]` en `tasks.md`.

## Decisiones tomadas al implementar

- Archivos: disco + enlaces HMAC de 5 min en desarrollo y pruebas; S3/R2 con URL prefirmada si hay `S3_BUCKET`
  (obligatorio en producción). Nuevas dependencias: `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner` (plan,
  Complexity Tracking).
- Tope de lectura de 10 MB en multer; el límite real (5 o 2 MB) lo aplica el servicio para poder decir cuánto pesa.
- La hoja de vida también se sube desde «Mi perfil» (sección Hoja de vida), además de su página propia.
- La barra superior sigue mostrando la inicial aunque haya foto (research §7).

## Cambio 2026-10-23: programa en texto libre (constitución v4.0.0)

- `formacionSchema` valida el programa como texto libre (3 a 150 caracteres); solo el avance debe corresponder al
  nivel. `Estudiante.programa` es `VARCHAR(150)` y el único índice de formación es `@@index([nivelFormacion])`
  (ya en la migración `20261023120000_perfil`, aún sin aplicar: PM000).
- La web usa un `TextField` para el programa (sin `Autocomplete`); cambiar el nivel solo vacía el avance.
- El ejemplo de la portada (`RequisitosEjemplo`) muestra «Programa solicitado: Ingeniería de Sistemas o afines —
  La empresa revisa la afinidad».
- Pruebas de contracts: 78 aprobadas.

## Validación local retomada · 2026-10-23

Docker operativo; instancia efímera praxis-test-postgres-test-1, puerto exclusivo 55432 y base praxis_test. Ambas migraciones aplicadas y verificadas en _prisma_migrations. API: 33/33 pruebas de cuentas y perfil aprobadas contra Postgres real.

Primera ejecución Playwright M3: 8/12 aprobadas; axe detectó contraste en ayudas deshabilitadas y menú, y nombres accesibles que omitían el texto visible Falta. Se corrigieron los tres puntos; repetición pendiente de resultado. No se modificó ninguna base externa, ni se hizo push/merge. S3/R2 real y revisión por PR siguen pendientes.
