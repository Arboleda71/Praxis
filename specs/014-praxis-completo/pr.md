Praxis tenía código para el recorrido principal, pero faltaban los flujos de los
mockups S3, S4 y Administración, y partes de los avisos de planes. Esta entrega
completa esos flujos y conserva el trabajo validado de la spec 013.

- El estudiante reemplaza solo el CV de una postulación Enviada. Iniciar revisión
  bloquea el cambio con un bloqueo de fila; quedan fecha, historial y notificación.
- Estudiante y empresa pueden suprimir su cuenta con contraseña y confirmación.
  Se anonimizan los datos y snapshots, se conserva el historial, se cierran sesiones
  y enlaces, se retiran/cerran procesos pertinentes y se borran archivos con
  reintentos durables. Se conserva una huella del NIT para evitar duplicados.
- Administración tiene acceso únicamente a datos mínimos de cuentas y puede
  revocar/restaurar con motivo e historial. No hay registro público, acceso a CV ni
  gestión de contenido. Las vacantes de empresas revocadas quedan ocultas.
- Los avisos de planes aparecen antes y después del vencimiento, también en Mis
  vacantes. Se agrega el logo de empresa y se completan estados de los mockups.

Dos migraciones aditivas, sin dependencias nuevas. La enmienda v5.0.0 refleja la
ampliación de alcance solicitada por el usuario y requiere revisión del equipo.

## Validación

450 pruebas locales aprobadas: 129 integración API, 10 unitarias API, 111 web,
88 contratos, 17 guardas, 8 scripts y 87 casos únicos Playwright (80 en corrida
conjunta y 7 afectados/de bloqueo revalidados). Tipos, lint y builds aprobados.
Auditoría de producción 0 vulnerabilidades; 25 avisos bajos/moderados de desarrollo.

Detalle reproducible y resultados finales: `docs/cierre-mvp.md`.
Pruebas de integración con Postgres real, almacenamiento compatible S3 local,
unitarias, contratos, guardas y Playwright con axe móvil/escritorio. Wompi se
mantiene sandbox sin conexión externa por decisión explícita del usuario.

## Pendientes externos

Validación de Resend/S3 remotos con credenciales, revisión manual con lector de
pantalla y aprobación humana de la enmienda. No se afirma validación de proveedores
externos ni cumplimiento manual completo a partir de pruebas automáticas.
