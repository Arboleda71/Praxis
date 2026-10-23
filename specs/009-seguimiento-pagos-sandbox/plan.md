# Seguimiento, avisos y Wompi sandbox

Constitución 4.0.0. La prueba de seguimiento se observó fallar antes de añadir endpoints. Transacciones serializan cambios; historial y notificación al estudiante y a la empresa se guardan juntos. Enviada → En revisión → Entrevista → Seleccionada; rechazo desde estados activos; retirada solo por estudiante en estados activos. Los finales no se reabren; cerrar una vacante no cancela sus candidaturas.

Archivos congelados en la postulación, tanto para la empresa dueña como para el estudiante. Nunca aparecen fotos antes de abrir una candidatura. Notificaciones paginadas propias, con marca de lectura por propietario. Sin correo adicional al de confirmación.

Pagos: Checkout Web oficial con firma SHA-256 en servidor, importe fijo en COP, referencia UUID y llaves sandbox obligatorias. Eventos autenticados mediante signature.properties/timestamp/secreto y comparación constante. Se consulta la transacción en el endpoint fijo sandbox antes de confiar en referencia, importe, moneda y estado; no se activa por redirección del navegador. Transacción de DB y wompiId único garantizan idempotencia; se bloquea la cuenta al activar y al publicar.

Dos gratis por semestre de cuenta; Básico cuatro adicionales, Ilimitado sin tope. Ambos seis meses desde aprobación, renovación manual disponible al vencer. Un pago pendiente por empresa; el checkout se puede retomar sin crear órdenes duplicadas. Sin dependencias ni proyectos nuevos.

Fuentes primarias:
- https://docs.wompi.co/docs/colombia/widget-checkout-web/
- https://docs.wompi.co/docs/colombia/eventos/
- https://docs.wompi.co/docs/colombia/ambientes-y-llaves/

Pruebas de firma/bloqueo de producción y pagos se ejecutaron fallando por módulos aún inexistentes. Resultado después: 52 pruebas de integración API, incluidas idempotencia, importe/firma alterados, pago rechazado, cupos Básico, Ilimitado y vencimiento, permisos entre empresas y preservación del CV. Las pruebas de cupos pagados adicionales se añadieron después de implementar esa extensión; no se afirma TDD estricto de esa parte. Wompi externo sustituido por fixture; ORM nunca simulado.

Bloqueos comprobados: faltan las tres llaves sandbox de Wompi, Resend y S3/R2. Ninguna transacción enviada a Wompi ni pago real. Pendiente verificación externa con llaves y URL pública HTTPS de webhook autorizada, CI remoto y revisión por otro integrante. No se declara esa integración externa completa.

## Verificación de navegador

65/65 casos aprobados en una corrida completa con Next 16.4.3 y Node 24.22.1; cubre el recorrido completo en móvil/escritorio y los controles axe. Se añadieron dos casos de cabeceras web para la entrega final. Los reenvíos simultáneos y el rollback por fallo real controlado de Postgres también aprobaron. La integración externa sigue pendiente.
