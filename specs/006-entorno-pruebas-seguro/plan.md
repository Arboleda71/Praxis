# Entorno aislado y validación previa de M3

Fecha: 2026-10-23, America/Bogota. Constitución: 4.0.0.
Rama: 006-entorno-pruebas-seguro.

## Alcance y aceptación

Antes de migrar o limpiar pruebas, rechazar conexiones remotas, Neon, el puerto de desarrollo, otras bases y parámetros de conexión. Ejecutar integración exclusivamente en Postgres real aislado. Esta spec habilita la fase 1; no completa M3 ni las fases 2–6.

## Constitution Check

VIII: datos ficticios. XIII: primero prueba fallida por módulo inexistente, luego guarda; integración pendiente con Postgres real. XIV: destinos validados antes de Prisma y nuevamente antes de TRUNCATE. No se modifica la constitución, no se agregan proyectos ni dependencias. Revisión por PR pendiente; sin push ni merge.

## Implementación

- docker-compose.test.yml: Postgres 17 efímero en tmpfs, puerto exclusivo 127.0.0.1:55432, sin volúmenes de desarrollo.
- Guarda compartida por integración API y Playwright: solo base praxis_test en ese destino, sin query ni fragmento. La URL nunca aparece en errores.
- Guarda en globalSetup, configuración del servidor E2E, setup de integración y antes de cada TRUNCATE existente.
- Ejecutar API y web secuencialmente: comparten la base de pruebas. No correr varias suites desde procesos independientes a la vez.
- npm run test:seguridad-db no accede a bases. npm run db:test inicia solo la instancia aislada.

## Bloqueos y evidencia

Docker Desktop 4.73.1 falla al iniciar Inference manager con dockerInference (registro local com.docker.backend.exe.log, 2026-10-23T19:46:14Z). El motor no está disponible. Windows informa VirtualizationFirmwareEnabled=False y SecondLevelAddressTranslationExtensions=False; habilitar virtualización en BIOS/UEFI y volver a comprobar tras reinicio. No se borraron datos de Docker ni se restableció de fábrica.

Node instalado: 24.14.1. Algunas dependencias declaradas advierten que requieren 24.15.0 o superior dentro de Node 24. No se cambió la versión del sistema.

## Reanudación

1. Recuperar Docker y comprobar docker info. No usar Reset, prune ni borrar volúmenes.
2. npm run test:seguridad-db y npm run db:test.
3. npm run test:e2e -w api: globalSetup aplica únicamente migraciones versionadas al destino validado. Revisar migrate status con DATABASE_URL explícitamente igual a la URL local de BASE_PRUEBAS; nunca heredar la de desarrollo.
4. npm run test:e2e -w web, después de terminar API; comprobar axe y móviles/escritorio.
5. Validar la migración M3 y registrar los resultados reales antes de pasar a seguridad 003 y CI.

Las fases 2–6 siguen pendientes en el orden solicitado: seguridad/CI; empresa M4; vacantes M5/búsqueda/elegibilidad/postulación; seguimiento/notificaciones/Wompi sandbox; pruebas completas/accesibilidad/entrega. No marcar ninguna completa sin evidencia y revisión.
