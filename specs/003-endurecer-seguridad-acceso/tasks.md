# Tareas de seguridad 003
Estado actualizado 2026-11-13; código ya integrado en main, no trabajo pendiente de implementar.

- [x] Sesiones con cookie Secure/httpOnly/SameSite y argon2.
- [x] Entrada Zod, origen verificado y proxy autenticado.
- [x] Intentos persistentes en Postgres y tiempos de bloqueo reales (spec 011).
- [x] Confirmación/reenvío concurrentes y errores sin secretos.
- [x] Guardas de base, cabeceras, tipos y pruebas de integración.
- [ ] Validar proxy en alojamiento real y credenciales de proveedores.
- [ ] CI remoto y revisión humana.

Evidencia actual: docs/cierre-mvp.md; auth, seguridad, origen e intentos e2e.
