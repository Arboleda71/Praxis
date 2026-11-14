# M7/M8/M9 · Seguimiento, notificaciones y planes
Mockups M7, M8 y M9. Spec documental completada 2026-11-13.

## Aceptación
- Estados Enviada, En revisión, Entrevista, Seleccionada, Rechazada y Retirada. Permisos y transiciones compartidos; finales no reabren. Cada cambio tiene historial y notificación.
- Empresa ve solo candidatos propios en orden de recepción. Abrir para revisar usa POST explícito y bloquea reemplazo del CV (spec 016).
- Notificaciones privadas paginadas, contador y lectura solo por dueño; avisos de cierre, CV y planes dentro de la web.
- Básico COP 29.900, cuatro publicaciones adicionales; Ilimitado COP 59.000. Seis meses y renovación manual al vencer.
- Checkout sandbox y webhook autenticado: consultar proveedor y validar referencia, importe, moneda, transacción y entorno antes de activar.
- Pago aprobado idempotente; volver del checkout no activa. Sin llaves, no simular pagos ni activación.

Evidencia: seguimiento.service.ts, notificaciones.controller.ts, pagos.service.ts, pagos.e2e-spec.ts, wompi.spec.ts y mvp.spec.ts.
Wompi externo aplazado expresamente por el usuario hasta registrar el proyecto. S2 tiene spec propia 015. No se afirma una prueba real del proveedor.
