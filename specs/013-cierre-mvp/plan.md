# Plan de cierre funcional 013

Reutilizar servicios Nest, Prisma y componentes MUI para avisos de planes y
cierres de vacantes. Migración aditiva: notificación sin postulación y clave única
de deduplicación. Cierre y avisos dentro de la misma transacción. Sin dependencias.

Pruebas de integración rojas antes de implementar concurrencia/exclusiones y
avisos de cierre. Validación original: 434 pruebas locales aprobadas; commit
51b455d. La entrega 014/015–018 amplía y actualiza esta fase; evidencia vigente
en docs/cierre-mvp.md. El alcance externo/humano no se declara aprobado por pruebas.
