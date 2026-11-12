# Pendientes del MVP anteriores a M2

> Creado el 2026-10-23. Cabos sueltos de M0/M1 que se aplazan para avanzar con M2, pero siguen siendo parte del
> MVP. Fuentes: `specs/002-cuentas-acceso/estado.md` (hallazgos C, S, P, R), `specs/003-endurecer-seguridad-acceso/spec.md`
> y `docs/pendientes-constitucion.md`. Al cerrar una tarea, márcala y deja el commit o PR.

## Entorno de pruebas · verificado localmente

Estado vigente y evidencia: `docs/mvp-entrega.md`. Las secciones siguientes conservan tareas históricas; la definición formal de terminado sigue pendiente de CI remoto y revisión por otra persona.

- [x] PM000 Docker operativo y Postgres 17 efímero exclusivo en 127.0.0.1:55432/praxis_test; las guardas rechazan Neon, remoto y base de desarrollo.
- [x] PM000b Cinco migraciones comprobadas desde una base vacía; 55 pruebas de integración API y 67 de navegador aprobadas. No usar migrate dev con una URL heredada del entorno.
## A. Seguridad de cuentas (spec 003, ya especificada)

La spec 003 cubre C2 (cookie `Secure`), C3 (datos personales en logs), S1/S5 (intentos y proxies), S2
(confirmaciones simultáneas) y el fallo al crear el enlace (parte de S4).

- [ ] PM001 Crear la rama `003-endurecer-seguridad-acceso` desde `main`
- [ ] PM002 `/speckit-plan` sobre `specs/003-endurecer-seguridad-acceso`
- [ ] PM003 `/speckit-tasks` y `/speckit-implement` de la spec 003
- [ ] PM004 Al cerrar 003, marcar como resueltos C2, C3, S1, S2 y S5 en `specs/002-cuentas-acceso/estado.md`

## B. Hallazgos de M1 que la spec 003 no cubre

- [x] PM005 [S3] Cerrar sesión cuando la API falla: la web debe avisar y no dejar al usuario creyendo que salió (`apps/web/src/components`, cierre de sesión) — spec 011, 2026-11-10: timeout y pruebas del camino de fallo
- [x] PM006 [S4] Fallo del proveedor de correo al reenviar: mensaje claro y la cuenta sigue usable (`apps/api/src/auth/correo.ts`) — spec 011, 2026-11-10: timeout de 10 s y el reenvío fallido ya no invalida el enlace anterior
- [x] PM007 [P3] Guarda en las pruebas: abortar si `DATABASE_URL` no apunta a `praxis_test`/`praxis_e2e` (`apps/api/test`, configuración de Playwright)
- [x] PM008 [R1] Confirmar el correo sin sesión abierta y distinguir error de red de enlace vencido (`apps/web/src/app/confirmar-correo`) — spec 011, 2026-11-10
- [x] PM009 [R2] Reactivar el formulario de ingreso al terminar los 15 minutos de bloqueo, sin recargar (`apps/web/src/components/FormularioIngreso.tsx`) — spec 011, 2026-11-10: usa el tiempo restante real que informa la API
- [ ] PM010 [P4] Revisión manual de teclado y lector de pantalla de M0 y M1 a 360 y 1080 px; registrar el resultado en `estado.md`
- [ ] PM011 [P5] Medir el registro completo (SC de M1) y la entrega real de un correo en menos de un minuto con Resend — spec 011, 2026-11-10: medido en local (registro y correo disponibles en 159–289 ms); **falta el dato con Resend real**: `npm run verificar:proveedores -- --correo`

## C. Calidad y entrega

- [x] PM012 [C4] Crear `.github/workflows/ci.yml`: lint, tipos, pruebas (con Postgres de servicio) y build en cada PR (constitución, «CI»)
- [ ] PM013 Proteger `main` en GitHub: PR obligatorio con revisión y CI en verde
- [ ] PM014 Alinear Node a ≥ 24.15 (lo piden dependencias) y fijarlo en `engines` del `package.json` raíz y en el CI
- [x] PM015 Revisar las 24 vulnerabilidades de `npm audit` (5 altas); actualizar solo lo que no rompa, sin `audit fix --force`

## D. Gobernanza

- [ ] PM016 [C1] Aprobación por otro integrante de las enmiendas v1.2.0 (Jest), v2.0.0 (principio IV), v3.0.0 (foto de perfil) y v4.0.0 (programa en texto libre) de la constitución
- [ ] PM017 Validación del equipo de las reglas de `docs/pendientes-constitucion.md` §1 y §2

## E. Producción (antes de salir del piloto)

- [ ] PM018 `RESEND_API_KEY` y dominio remitente verificado — código y verificación listos (spec 011, 2026-11-10); **faltan las credenciales**. Ver `docs/produccion.md` §1 y §4
- [x] PM019 Límite de intentos fuera de memoria si la API corre en más de una instancia (`ponytail:` en el plan de M1) — spec 011, 2026-11-10: tabla `Intento` en Postgres
- [ ] PM020 Residencia de datos y Ley 1581, documento fuente faltante y Wompi en producción: ver `docs/pendientes-constitucion.md` §4 — spec 011, 2026-11-10: documentado en `docs/produccion.md` §5 y §6; **falta la validación humana** y siguen fuera el documento fuente y el comercio de Wompi

## F. Features aplazadas

- [ ] PM021 Restablecer la contraseña: enmendar la constitución y crear su spec (ver `docs/modulos.md`, «Feature pendiente») — en `docs/backlog-specs.md` como S1. 2026-11-11: constitución v4.1.0 y
  `specs/012-restablecer-contrasena` escritas e implementadas en la rama `012-restablecer-contrasena`; pruebas en verde en local; **faltan la
  aprobación de la enmienda y el PR**

## Orden sugerido

A (seguridad) y PM012–PM013 (CI) primero: protegen todo lo que venga después. Luego B. D en paralelo, porque
depende de otra persona. E y F antes de salir del piloto.

## Actualización de entrega local · 2026-10-23

Seguridad implementada y verificada localmente en la rama 003; planes manuales y evidencia en specs/003. M4, M5, búsqueda, elegibilidad, postulación, seguimiento, notificaciones y Wompi sandbox implementados en ramas 007–010. PM012 corresponde a definir/validar el workflow; su ejecución en GitHub sigue pendiente. PM015: npm audit completo 0 vulnerabilidades tras Next 16.4.3. PM014: .nvmrc fija 24.22.1, usado en validación; el Node del sistema 24.14.1 no se cambió. Proxy de producción, proveedores externos, auditoría manual completa de accesibilidad, CI remoto y revisión por PR siguen pendientes. Ver docs/mvp-entrega.md.

## Actualización · 2026-11-10 (spec 011)

Rama `011-cabos-m1-integraciones`, sin fusionar ni publicar. Cerrados en código y pruebas: PM005, PM006, PM008,
PM009 y PM019. Además se corrigió el origen del visitante detrás del proxy de despliegue (`PROXY_SECRETO`), que
habría hecho que un bloqueo dejara fuera a todos los usuarios en producción, y los archivos en S3/R2 quedaron
probados contra un almacenamiento compatible real en Docker.

Siguen abiertos porque dependen de credenciales o de personas: PM011 (dato con Resend real), PM018 (llaves de
Resend), S3/R2 y Wompi sandbox reales, la validación del origen en el primer despliegue y la validación legal de
`docs/produccion.md` §5. El comando `npm run verificar:proveedores` cierra los tres primeros en minutos cuando
existan las llaves.
