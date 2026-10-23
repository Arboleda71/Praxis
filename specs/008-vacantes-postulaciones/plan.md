# Vacantes y postulaciones · Constitución 4.0.0

Una cuenta empresa administra solo sus vacantes. Formulario en tres pasos, publicación irreversible con correo/NIT/cupos validados en transacción bloqueando la cuenta. Dos publicaciones gratis por periodo calendario de seis meses anclado a la creación de cuenta. Borrador editable/eliminable; abierta solo descripción; cierre irreversible; vencimiento revisado cada minuto y antes de consultas. Visitante: cinco ofertas básicas; estudiante: búsqueda paginada y comparación explícita de cada requisito; empresa: sin búsqueda ajena.

Elegibilidad compartida: solo nivel excluyente; mínimo nivel/programa/CV; programa libre para revisión humana. Postulación bajo bloqueo de vacante y estudiante; restricción única estudiante/vacante; copia independiente de los archivos y del perfil/evaluación. Un fallo de copia revierte la transacción y limpia solo archivos nuevos. Historial inicial y notificaciones en la misma transacción.

Índices por dueño/estado, vigencia, niveles GIN y título trigram. Sin dependencias ni proyectos nuevos. Migración generada comparando esquemas sin acceso a DB; un primer SQL incompleto falló exclusivamente en praxis_test, se regeneró completo y se recuperó la migración solo tras validar la URL. No se modificaron bases externas.

Pruebas primero: vacantes.test.ts falló por módulo inexistente; integración falló por endpoints inexistentes. Después: dos casos de contratos y tres de integración críticos aprobados (cupos concurrentes, perfil mínimo/nivel, unicidad concurrente y preservación del CV). Se añadieron pruebas de inmutabilidad/roles aprobadas y una de seguimiento pendiente de implementación (siguiente fase).

Pendientes: seguimiento, notificaciones, Wompi sandbox, controles finales de navegador/axe y CI remoto. Revisión por PR pendiente. No se declara MVP completo.

## Resultado final local · 2026-10-23

El recorrido completo de 008 está incluido en 67/67 Playwright y 55/55 integración API aprobados. Roles/propiedad, inmutabilidad, cierre, vencimiento, dos cupos concurrentes, elegibilidad sin programa automático, unicidad y copia de CV fueron verificados. Seguimiento y pagos se implementaron en 009. La aprobación formal espera CI remoto y revisión por PR; ver docs/mvp-entrega.md.
