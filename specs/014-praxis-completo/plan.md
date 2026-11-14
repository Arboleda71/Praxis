# Plan de entrega integral
Esta rama de entrega continúa el trabajo 013 ya validado y reúne las specs propias
015–018 por la petición explícita de completar todo en un único PR. No se mezclan
ramas ajenas ni se incorporan decisiones incompatibles de origin/samuel-dev.

## Implementación
Mantener apps/api, apps/web y packages/contracts. Dos migraciones aditivas respecto
de main: avisos y cuentas/CV/admin. Prisma directo, contratos Zod y guardas de rol.
Servicio de limpieza durable sin colas, porque un fallo S3 no debe revertir una
supresión de datos. Alta admin solo operativa con entorno; sin nuevas dependencias.

## Verificación
Pruebas fallidas antes de reglas críticas, Postgres real, condiciones concurrentes,
persistencia y privacidad. Playwright/axe móvil y escritorio; revisión manual por
separado. No modificar secretos ni destinos de desarrollo. Datos ficticios.

## Cierre
Actualizar docs, guardar commits, intentar push/PR usando credencial existente.
Consultar Actions y corregir CI si se logra publicar. Sin credencial: conservar
commits y cuerpo de PR, detallar paso de autenticación; no simular CI aprobado.
