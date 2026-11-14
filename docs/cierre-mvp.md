# Cierre del MVP · 2026-11-13

Estado del repositorio revisado en `main` (`2d9bb8f`) y cambios locales en
`013-cierre-mvp`. Este documento actualiza las referencias históricas de
`mvp-entrega.md` y `pendientes-mvp.md`: los módulos 003–012 ya están en `main`.
No se han fusionado las decisiones incompatibles de `origin/samuel-dev`.

## Funcionalidad

El MVP incluye navegación, cuentas y recuperación de contraseña, catálogos,
perfiles de estudiante y empresa, vacantes, búsqueda y filtros, elegibilidad,
postulación con copia del perfil y archivos, seguimiento, notificaciones y planes
con pagos sandbox. Administración, reemplazo del CV de una candidatura enviada
y supresión de cuentas siguen fuera del alcance académico. El logo opcional de
empresa permanece aplazado; no bloquea el recorrido del MVP.

Cambios de esta rama:

- Aviso dentro de la web durante los siete días anteriores al vencimiento de
  Básico o Ilimitado; una notificación por cuenta y fecha de vencimiento,
  protegida por índice único incluso con varias instancias. Comprobación al
  iniciar, cada hora y al consultar planes/notificaciones. No envía correo,
  no cobra y no habilita renovaciones antes del vencimiento.
- Mensaje en Planes y pagos con fecha colombiana y renovación manual.
- Cierre de vacantes y avisos a candidatos dentro de la misma transacción,
  tanto manual como por vencimiento, sin cambiar las postulaciones ni duplicar
  avisos en cierres concurrentes.
- Inicio sin «Empieza gratis», conforme a FR-001 de la spec 001.
- Preparación de la base Playwright antes de iniciar la API: el servicio de
  avisos consulta datos al arrancar y no puede esperar al globalSetup posterior.
- ESLint omite informes y trazas generados por Playwright, evitando inspeccionar
  archivos temporales que el navegador elimina al iniciar una corrida.

Migración nueva: `20261113120000_avisos_planes`. Permite notificaciones sin
postulación y agrega clave única de deduplicación e índice de vencimiento.
Aplicada exclusivamente a bases aisladas de pruebas, nunca a desarrollo o producción.

## Evidencia local

Node 24.22.1 temporal, sin cambiar Node del sistema. Postgres real y almacenamiento
compatible con S3 en Docker, con datos ficticios y servicios en loopback.

Las pruebas nuevas fallaron antes de implementar: dos casos de avisos de planes
y dos de cierre de vacante. Después pasaron las 121 pruebas de integración API.
También aprobaron 10 unitarias API, 111 unitarias web, 88 contratos, 17 guardas
de bases y 8 pruebas de scripts. Tipos API/web/scripts y builds de contratos/API
aprobados; lint de API y web aprobados. Auditoría de producción: 0 vulnerabilidades.
La auditoría completa detecta 25 avisos en herramientas de desarrollo (3 bajos y
22 moderados), sin altos ni críticos. No se aplicó `audit fix --force`, que propone
retroceder Jest a una versión incompatible.

Corrida final Playwright: **79 de 79 aprobadas**, móvil a 360 px y escritorio a
1080 px, incluidos axe, navegación por teclado, permisos, recuperación de contraseña,
bloqueo y el recorrido publicar → buscar → comprobar → postular → seguir → notificar
→ retirar. La corrida inicial detectó una expectativa antigua que exigía «Empieza
gratis»; se alineó con FR-001 y la corrida final completa pasó. Build de web aprobado.

Total: **434 pruebas locales aprobadas**. No hay pruebas en ejecución ni resultados
pendientes de esta validación. Los cambios permanecen locales, sin commit ni push,
en `013-cierre-mvp`; `main` conserva `2d9bb8f`.

## Qué impide declarar el cierre formal

- El verificador de proveedores informa `sin configurar` para correo, archivos y
  pagos. Faltan las credenciales de Resend, S3/R2 y Wompi sandbox. El almacenamiento
  compatible local y los fixtures de pagos no acreditan esos proveedores externos.
- La definición de terminado de la constitución exige CI remoto y PR revisado por
  otro integrante. No se han publicado estos cambios ni obtenido esa aprobación.
- Falta registrar la revisión manual completa con teclado y lector de pantalla;
  axe y Playwright cubren solo parte de la accesibilidad.
- Antes de usar datos reales siguen pendientes la validación responsable del
  tratamiento de datos y los requisitos de producción de `docs/produccion.md`.

Las credenciales se configuran en el entorno, nunca en el repositorio ni en el chat.
Con ellas, ejecutar `npm run verificar:proveedores`; la prueba de entrega de correo
requiere un destinatario de prueba expresamente autorizado. Validar además el
webhook público HTTPS de Wompi sandbox. No se declaran cumplidas esas pruebas aún.
