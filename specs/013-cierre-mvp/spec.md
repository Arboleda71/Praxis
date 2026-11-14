# Cierre funcional del MVP

Fecha: 2026-11-13. Rama: `013-cierre-mvp`.

## Alcance

Completar el aviso de vencimiento de los planes y corregir la discrepancia de M0.
Completar también el aviso al estudiante cuando se cierra su vacante, tanto manualmente
como por vencimiento. El cierre y sus avisos son atómicos, sin duplicados concurrentes,
y conservan el estado de cada postulación.
Se mantiene la constitución 4.1.0: sin administración, sin cobros reales, sin cambios
a la elegibilidad ni a la copia de documentos de una postulación.

## Criterios de aceptación

- Avisar dentro de la web durante las últimas 168 horas del plan Básico o Ilimitado.
  Se adopta una antelación de siete días para concretar el pendiente S2.
- Mostrar la fecha en America/Bogota y explicar cómo renovar manualmente al vencer.
- Crear una sola notificación por cuenta y fecha de vencimiento, aun con varias
  instancias o consultas concurrentes. Marcarla leída no la vuelve a crear.
- No avisar para planes gratuitos, vencidos o que vencen en más de siete días.
- Comprobar cada hora mientras la API está activa, al iniciar y al consultar planes
  o notificaciones; recuperar avisos tras un reinicio si el plan sigue en la ventana.
- No enviar correo ni activar, extender o cobrar planes desde el aviso.
- El inicio cumple FR-001 de spec 001 retirando «Empieza gratis».

## Plan y constitución

Extender la notificación existente con una clave única opcional y permitir avisos
sin postulación. Migración aditiva. Servicio Nest con temporizador y consultas Prisma,
sin dependencias nuevas. Mantener permisos por cuenta. Pruebas de integración contra
Postgres real antes de implementar; comprobar idempotencia y exclusiones.

La aprobación humana de PR y enmiendas, el CI remoto y las validaciones de proveedores
reales se registran aparte: las pruebas locales no sustituyen esa evidencia.
