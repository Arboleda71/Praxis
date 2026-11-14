# S2 · Aviso de vencimiento del plan
Mockup propio S2: Planes y pagos, Mis vacantes y notificación. Entrega conjunta en 013-cierre-mvp por solicitud integral del usuario. Fecha: 2026-11-13.

## Aceptación
- Empresa Básico/Ilimitado ve fecha de Bogotá, uso real y aviso durante los últimos siete días (168 horas).
- Una notificación por cuenta y periodo incluso con consultas concurrentes o tras marcarla leída; también aviso en Mis vacantes.
- Al vencer, otro aviso: renovación manual disponible, retorno al cupo gratis y vacantes abiertas conservadas.
- Sin correo, cobro automático, cuenta regresiva ni activación ficticia.
- Comprobar al iniciar, cada hora y al consultar; recuperar tras reinicio. Cuentas revocadas/suprimidas no generan avisos; renovar origina otro periodo.

API: GET /empresa/planes; /empresa/vacantes incluye estadoPlan; /notificaciones. Notificacion.clave tiene índice único.
Evidencia: avisos-planes.service.ts, pagos.e2e-spec.ts y completo.spec.ts.
