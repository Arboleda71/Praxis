# Praxis · MVP local

Actualizado el 23 de octubre de 2026, America/Bogota. Constitución 4.0.0.

El recorrido funcional está implementado y probado localmente: cuenta → perfil → vacante → búsqueda → elegibilidad → postulación → seguimiento → notificaciones. Los planes y Wompi sandbox tienen implementación y pruebas con Postgres real y respuesta externa ficticia. La conexión real con Wompi/Resend/S3, CI remoto y revisión humana siguen pendientes; no se declara cerrado el MVP según la definición formal de terminado.

## Abrir la demostración

En esta sesión se inició la web en **http://localhost:3200**, con API en localhost:3201. Se eligieron esos puertos porque 3000 estaba ocupado. No se interrumpió el servicio existente.

Requisitos: Docker operativo y Node 24.22.1 (mínimo 24.15, dentro de Node 24). El Node del sistema es 24.14.1 y no se modificó. En este equipo se usó el Node 24.22.1 incluido con Codex; para usarlo temporalmente en PowerShell:

```powershell
$env:PATH = "C:\Users\HP\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;$env:PATH"
node --version
cd C:\Users\HP\Documents\Praxis\Praxis
```

Preparación desde una instalación limpia:

```powershell
npm ci
npm exec --no --workspace api -- prisma generate
npm run demo:db
```

En dos terminales, usando los mismos puertos:

```powershell
$env:PRAXIS_DEMO_WEB_PORT = '3200'
$env:PRAXIS_DEMO_API_PORT = '3201'
npm run demo:api
```

```powershell
$env:PRAXIS_DEMO_WEB_PORT = '3200'
$env:PRAXIS_DEMO_API_PORT = '3201'
npm run demo:web
```

Abre http://localhost:3200. Sin esas variables, los puertos predeterminados son 3000/3001. La API de demostración usa la entrada real `main`, sin endpoints de control de pruebas. Los dos servidores de demo escuchan solo en loopback.

Los lanzadores fijan el Postgres aislado en 127.0.0.1:55432/praxis_test y la API local; no heredan destinos de bases ni API externas. Por defecto deshabilitan Wompi, Resend y S3. Los documentos permanecen privados con firmas temporales. La base usa tmpfs: sus datos son ficticios y efímeros. No ejecutes pruebas y demo a la vez: comparten esta base. No uses `npm run db` ni una URL de desarrollo/Neon para las pruebas.

## Probar el recorrido

1. Registra una empresa ficticia con un NIT de formato y dígito correctos, acepta la política y confirma su correo.
2. En demo, el correo se guarda como HTML local en `%TEMP%\praxis-correos-e2e`. Abre el archivo más reciente, sigue el enlace y pulsa **Confirmar mi correo**. Abrir el enlace solo consulta su vigencia; no confirma.
3. Completa la ficha declarada de empresa. Crea una vacante en tres pasos, guárdala como borrador y publícala. Los requisitos quedan fijos; el cierre no se revierte.
4. En otra sesión de navegador, crea un estudiante ficticio, completa nivel y programa y sube un CV ficticio en PDF. Foto, aval, idiomas y demás datos no son parte del perfil mínimo.
5. Busca la práctica, revisa cada requisito y postúlate. Solo un nivel no aceptado excluye; el programa no se compara automáticamente y los otros requisitos son deseables.
6. La empresa abre la candidatura y cambia su estado; el estudiante consulta historial y notificaciones. Cerrar una vacante no cancela las candidaturas. Retirarse conserva el historial e impide volver a postularse.
7. Visita **Planes y pagos**: dos publicaciones gratis cada seis meses, Básico COP 29.900 con cuatro adicionales e Ilimitado COP 59.000. Ambos seis meses y renovación manual al vencer. Sin llaves, los pagos se muestran como no conectados y no se activan planes ficticiamente.

No hay cuentas reales ni credenciales de acceso preconfiguradas para personas. Usa datos exclusivamente ficticios.

## Wompi sandbox

Faltan `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET`, además de una URL pública HTTPS autorizada para el webhook. El lanzador de integración admite las llaves de `apps/api/.env` o del entorno, pero solo con `WOMPI_ENV=sandbox` y prefijos `pub_test_`, `test_integrity_`, `test_events_`:

```powershell
npm run demo:api:wompi
```

Este comando conserva la base aislada y las restricciones locales; únicamente habilita Wompi sandbox. Producción se rechaza antes de arrancar. El webhook termina en `/pagos/eventos` en la API, o `/api/pagos/eventos` a través de la web. No se creó un túnel ni se desplegó una URL pública. Volver del checkout nunca activa el plan: hacen falta evento autenticado y consulta verificada al proveedor.

Documentación usada: [Checkout oficial](https://docs.wompi.co/docs/colombia/widget-checkout-web/), [eventos](https://docs.wompi.co/docs/colombia/eventos/), [ambientes y llaves](https://docs.wompi.co/docs/colombia/ambientes-y-llaves/).

## Verificación reproducible

Ejecuta las pruebas cuando la demo esté detenida:

```powershell
npm run test:seguridad-db
npm run db:test
npm run test -w @praxis/contracts
npm run test -w api -- --runInBand
npm run test -w web
npm run test:e2e -w api
npm run test:e2e -w web -- --workers=1
npm run lint -w api
npm run lint -w web
npm exec --no --workspace api -- tsc --noEmit
npm exec --no --workspace api -- tsc -p ../../scripts/tsconfig.json
npm exec --no --workspace web -- next typegen
npm exec --no --workspace web -- tsc --noEmit
npm audit
```

Resultados finales locales: **10** guardas, **83** contratos, **17** unitarias API, **12** unitarias web, **55** integración API y **67** Playwright: **244 pruebas aprobadas**. Tipos y lint sin errores; builds de contracts/API/web aprobados; cinco migraciones verificadas desde Postgres vacío; auditoría npm completa con **0 vulnerabilidades**.

Playwright verifica 360/1080 px, axe, permisos, confirmación explícita, cierre/reingreso y el recorrido publicar → buscar → comprobar → postular → seguir → notificar → retirar. Las pruebas de integración usan Postgres real; solo la consulta externa de Wompi se sustituye por una respuesta de prueba. Se comprueban firma e importe alterados, idempotencia, cupos concurrentes, planes vencidos/rechazados, unicidad de postulación y copia del CV conservada tras reemplazo. Un trigger temporal controlado de Postgres comprobó el rollback de la cuenta si falla la creación del enlace; después se eliminó.

Rendimiento de laboratorio: búsqueda p95 **36,3 ms** en 30 solicitudes con 10.000 estudiantes, 500 empresas y 1.000 vacantes ficticias. Inicio con caché de navegador vacía y 4G emulado (1,6 Mbps/150 ms): móvil **632/648/648 ms** de LCP, escritorio **636 ms**. No son mediciones de tráfico real ni una prueba de carga concurrente. Capturas de inicio a 360 y 1080 px revisadas visualmente. Axe no reemplaza una revisión manual completa con lector de pantalla.

## Estado por fase

| Fase | Estado local | Pendiente externo o de revisión |
|---|---|---|
| 1. Entorno/M3 | Guardas, migración, integración, archivos locales y E2E aprobados | S3/R2 real |
| 2. Seguridad/CI | Seguridad probada; workflow YAML validado con lint/tipos/pruebas/build/auditoría | Ejecución de GitHub Actions y revisión por otra persona |
| 3. Empresa M4 | Ficha, NIT, correo y propiedad probados | Logo opcional aplazado |
| 4. Vacantes/postulación | CRUD por dueño, búsqueda paginada, elegibilidad y copias probadas | Revisión de PR |
| 5. Seguimiento/pagos | Estados, historial, avisos, firmas y reglas de planes probados | Wompi sandbox real, Resend y S3 sin credenciales |
| 6. Entrega | Pruebas locales, builds, auditoría, capturas y comandos de demo | Lector de pantalla completo, CI remoto y aprobación |

Se registraron pruebas fallidas antes de implementar elegibilidad, cupos gratuitos, unicidad, seguimiento, firmas/pagos y varias reglas de seguridad. No se afirma TDD estricto de todas las extensiones: los permisos específicos de M4 y los casos adicionales de cupos pagados se comprobaron después de esas partes del código. Esa evidencia de proceso debe revisarse frente al principio XIII.

## Cambios y límites

Ramas locales encadenadas: `006-entorno-pruebas-seguro` → `003-endurecer-seguridad-acceso` → `007-perfil-empresa` → `008-vacantes-postulaciones` → `009-seguimiento-pagos-sandbox` → `010-validacion-entrega-mvp`. Cada rama conserva el trabajo anterior sin fusionar a main. No hubo push, merge, PR publicado, despliegue, pago real ni migración sobre Neon/producción.

Next y eslint-config-next se actualizaron a **16.4.3**, dentro de Next 16, por los avisos [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) y [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr). Las acciones de CI siguen la versión v7 documentada por sus repositorios oficiales; el workflow aún no se ejecutó en GitHub.

Antes de publicar con datos reales: validar proxy/IP de infraestructura, proveedor de archivos privado, correo, tratamiento internacional de datos y controles operativos; obtener revisión humana y CI verde. La constitución no se modificó.
