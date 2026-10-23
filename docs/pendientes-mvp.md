# Pendientes del MVP anteriores a M2

> Creado el 2026-10-23. Cabos sueltos de M0/M1 que se aplazan para avanzar con M2, pero siguen siendo parte del
> MVP. Fuentes: `specs/002-cuentas-acceso/estado.md` (hallazgos C, S, P, R), `specs/003-endurecer-seguridad-acceso/spec.md`
> y `docs/pendientes-constitucion.md`. Al cerrar una tarea, márcala y deja el commit o PR.

## 🚨 Urgente: entorno con Postgres (bloquea cerrar M3)

La virtualización del equipo está desactivada (2026-10-23): Docker Desktop no arranca su motor y no hay Postgres.
M3 quedó escrito y compilado, pero sin migración aplicada ni pruebas contra la base (`specs/005-perfil-estudiante/estado.md`).

- [ ] PM000 Activar la virtualización (BIOS/UEFI: Intel VT-x o AMD-V; en Windows, «Plataforma de máquina virtual» y WSL 2), arrancar Docker Desktop y `docker compose up -d` (alternativa sin Docker: instalar PostgreSQL 17 para Windows con usuario `praxis` y las bases `praxis`, `praxis_test` y `praxis_e2e`)
- [ ] PM000b Aplicar la migración `20261023120000_perfil` (`npm exec --no --workspace api -- prisma migrate dev`) y correr `npm run test:e2e -w api` y `npm run test:e2e -w web -- --workers=2`; corregir lo que falle y pasar a `[x]` las tareas `[~]` de `specs/005-perfil-estudiante/tasks.md`

## A. Seguridad de cuentas (spec 003, ya especificada)

La spec 003 cubre C2 (cookie `Secure`), C3 (datos personales en logs), S1/S5 (intentos y proxies), S2
(confirmaciones simultáneas) y el fallo al crear el enlace (parte de S4).

- [ ] PM001 Crear la rama `003-endurecer-seguridad-acceso` desde `main`
- [ ] PM002 `/speckit-plan` sobre `specs/003-endurecer-seguridad-acceso`
- [ ] PM003 `/speckit-tasks` y `/speckit-implement` de la spec 003
- [ ] PM004 Al cerrar 003, marcar como resueltos C2, C3, S1, S2 y S5 en `specs/002-cuentas-acceso/estado.md`

## B. Hallazgos de M1 que la spec 003 no cubre

- [ ] PM005 [S3] Cerrar sesión cuando la API falla: la web debe avisar y no dejar al usuario creyendo que salió (`apps/web/src/components`, cierre de sesión)
- [ ] PM006 [S4] Fallo del proveedor de correo al reenviar: mensaje claro y la cuenta sigue usable (`apps/api/src/auth/correo.ts`)
- [ ] PM007 [P3] Guarda en las pruebas: abortar si `DATABASE_URL` no apunta a `praxis_test`/`praxis_e2e` (`apps/api/test`, configuración de Playwright)
- [ ] PM008 [R1] Confirmar el correo sin sesión abierta y distinguir error de red de enlace vencido (`apps/web/src/app/confirmar-correo`)
- [ ] PM009 [R2] Reactivar el formulario de ingreso al terminar los 15 minutos de bloqueo, sin recargar (`apps/web/src/components/FormularioIngreso.tsx`)
- [ ] PM010 [P4] Revisión manual de teclado y lector de pantalla de M0 y M1 a 360 y 1080 px; registrar el resultado en `estado.md`
- [ ] PM011 [P5] Medir el registro completo (SC de M1) y la entrega real de un correo en menos de un minuto con Resend

## C. Calidad y entrega

- [ ] PM012 [C4] Crear `.github/workflows/ci.yml`: lint, tipos, pruebas (con Postgres de servicio) y build en cada PR (constitución, «CI»)
- [ ] PM013 Proteger `main` en GitHub: PR obligatorio con revisión y CI en verde
- [ ] PM014 Alinear Node a ≥ 24.15 (lo piden dependencias) y fijarlo en `engines` del `package.json` raíz y en el CI
- [ ] PM015 Revisar las 24 vulnerabilidades de `npm audit` (5 altas); actualizar solo lo que no rompa, sin `audit fix --force`

## D. Gobernanza

- [ ] PM016 [C1] Aprobación por otro integrante de las enmiendas v1.2.0 (Jest), v2.0.0 (principio IV), v3.0.0 (foto de perfil) y v4.0.0 (programa en texto libre) de la constitución
- [ ] PM017 Validación del equipo de las reglas de `docs/pendientes-constitucion.md` §1 y §2

## E. Producción (antes de salir del piloto)

- [ ] PM018 `RESEND_API_KEY` y dominio remitente verificado
- [ ] PM019 Límite de intentos fuera de memoria si la API corre en más de una instancia (`ponytail:` en el plan de M1)
- [ ] PM020 Residencia de datos y Ley 1581, documento fuente faltante y Wompi en producción: ver `docs/pendientes-constitucion.md` §4

## F. Features aplazadas

- [ ] PM021 Restablecer la contraseña: enmendar la constitución y crear su spec (ver `docs/modulos.md`, «Feature pendiente»)

## Orden sugerido

A (seguridad) y PM012–PM013 (CI) primero: protegen todo lo que venga después. Luego B. D en paralelo, porque
depende de otra persona. E y F antes de salir del piloto.
