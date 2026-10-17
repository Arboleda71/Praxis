# Estado de M1 · Cuentas y acceso

> Actualizado el 2026-10-17. El código está escrito y compila; falta verificarlo contra Postgres.

## Bloqueo actual

Docker Desktop está instalado pero su motor no arranca: WSL2 no tiene ninguna distribución
(`wsl -l -v` → «no installed distributions»). Suele ser porque Docker Desktop espera que se acepten sus
términos o pide actualizar WSL. Sin Docker no hay Postgres, y sin Postgres no se puede crear la migración
ni correr las pruebas de integración y E2E.

## Hecho y verificado (no necesita base de datos)

| Parte | Verificación |
|---|---|
| `packages/contracts`: NIT (dígito DIAN) y esquemas Zod de registro e inicio de sesión | 15 pruebas Vitest en verde; compila a `dist/` |
| API: límite de intentos (5 → 15 min) | 5 pruebas Jest en verde |
| API: registro, login, logout, sesión, confirmar correo, reenviar enlace | Tipos en verde (`tsc`) |
| Web: 14 pantallas aprobadas, formularios, aviso «Confirma tu correo», reenvío con espera | Tipos y lint en verde; 12 pruebas Vitest en verde |
| Prisma 7: esquema (`Cuenta`, `Estudiante`, `Empresa`, `Sesion`, `EnlaceConfirmacion`) | `prisma validate` y `prisma generate` en verde |

## Falta (en orden)

1. **Arrancar Docker** y levantar Postgres: `npm run db` (desde la raíz). La primera vez crea las bases
   `praxis`, `praxis_test` y `praxis_e2e` (`docker/postgres-init/`).
2. **Crear la primera migración**: `cd apps/api && npx prisma migrate dev --name cuentas` y subirla
   (`apps/api/prisma/migrations/`). Hoy no existe ninguna migración.
3. **Pruebas de integración de la API** contra Postgres real: `npm run test:e2e -w api`
   (14 casos en `apps/api/test/auth.e2e-spec.ts`). Nunca se han ejecutado.
4. **Pruebas E2E con Playwright + axe**: `npm run test:e2e -w web` (M0 adaptado a cuentas reales + 13 casos de
   M1 + la prueba de bloqueo, que corre al final). Nunca se han ejecutado con la API real.
5. **Probar a mano** el recorrido completo en `http://localhost:3000` con `npm run dev:api` y `npm run dev`.
   Los correos de confirmación quedan como archivos en `apps/api/.correos/`.
6. Marcar las tareas pendientes de `tasks.md` y quitar el borrador del PR.

## Cambios que afectan a otros módulos

- **La sesión simulada de M0 ya no existe.** `getSession()` consulta `GET /auth/sesion` en la API; para
  desarrollar cualquier página con sesión hay que tener la API y Postgres corriendo.
- `@praxis/contracts` se compila al instalar (`postinstall` de la raíz). Si cambian los esquemas:
  `npm run build -w @praxis/contracts`.
- Pruebas: Jest en la API (constitución v1.2.0, pendiente de aprobación en el PR), Vitest en la web y en contracts.

## Pendientes de producto que siguen abiertos

- Restablecer la contraseña: feature pendiente, exige enmendar la constitución (ver `docs/modulos.md`).
- El límite de intentos vive en memoria: sirve con una sola instancia de la API.
- `RESEND_API_KEY` y el dominio remitente para producción.
