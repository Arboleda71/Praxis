# Plan de seguridad 003

Constitución 4.0.0. Sin nuevos proyectos ni dependencias.

Implementar reservas síncronas previas a argon2 (5 cuenta, 30 origen), ventana de registro (10/hora), limpieza de ventanas, origen HTTP estricto y proxy no confiable por defecto. Mantener cookie Secure en todo entorno; las pruebas HTTP transportan explícitamente la cookie y comprueban sus atributos, sin rebajar la configuración del producto.

Confirmación explícita desde botón; consumo de enlace y reenvío mediante transacción y bloqueo por cuenta en Postgres. Crear cuenta y enlace en la misma transacción. Envío posterior: error genérico sin datos ni mensajes del proveedor. Archivo de correo identificado por hash del destinatario; pruebas adaptadas al mismo identificador.

Producción: HTTPS público, remitente, Resend, base y S3 obligatorios al arrancar. Cabeceras de seguridad; parámetros y contraseñas limitados en contratos. CI Node 24.15 o superior, Postgres aislado en 55432, guardas, lint, tipos, unitarias, integración, build y Playwright/axe secuenciales.

Pruebas primero: seguridad.spec.ts (4 fallos observados) y seguridad.e2e-spec.ts (3 fallos observados). Revisar los casos de M1 cuyo comportamiento cambia expresamente por spec 003. La IP de pruebas no se falsifica con X-Forwarded-For: comprobar que se ignora; aislar pruebas de navegador reiniciando el proceso API entre grupos si alcanzan límites reales.

Pendiente: resultados de aceptación y revisión por PR. No se da esta fase por completa hasta registrar evidencia.

## Evidencia local parcial

API 003: 36 pruebas de integración aprobadas tras la implementación (más pruebas de confirmación concurrente y sesión vencida añadidas para la siguiente corrida). 9 unitarias API aprobadas. Web: 12 unitarias aprobadas, incluidas más de 20 variantes maliciosas de redirección. Contratos: 79 casos aprobados antes de añadir las pruebas de la siguiente spec M4. CI definido, sin ejecutar en GitHub porque no se autorizó push.

El servidor E2E se compila una vez y tiene una entrada exclusiva fuera de src/main.ts para reiniciar límites entre casos; exige NODE_ENV=test, base aislada validada, enlace loopback y secreto aleatorio. No agrega endpoints al producto ni confía en X-Forwarded-For. Suites secuenciales, un worker.

Pendiente: verificación final de navegador/axe; envío real Resend con credenciales y proxy de producción deben validarse antes de despliegue. No se declara la fase cerrada ni CI remoto aprobado.

## Resultado final local · 2026-10-23

La batería final suma 55/55 integración API (incluye reenvíos paralelos y rollback por fallo real de Postgres) y 67/67 Playwright (incluye cabeceras web y flujo completo). Lint/tipos/builds aprobados; npm audit 0 vulnerabilidades. No se ejecutó CI remoto ni se publicó PR. Proxy de producción y proveedores externos siguen pendientes; ver docs/mvp-entrega.md.
