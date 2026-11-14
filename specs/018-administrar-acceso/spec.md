# Administrador · Cuentas y control de acceso
Mockup propio Administrador: lista, detalle, revocar/restaurar y cuenta revocada. Alcance ampliado 2026-11-13; enmienda 5.0.0 para revisión.

## Aceptación
1. Alta operativa por scripts/crear-admin.mts; correo/contraseña desde entorno. Sin registro público ni promoción de cuentas existentes; no imprimir secretos.
2. Lista por rol, búsqueda correo/empresa/NIT, estado y paginación. Detalle solo cuenta: correo, confirmación, registro, razón social/NIT e historial con fecha, motivo y responsable. Nunca perfil/CV/candidaturas.
3. Motivo 10–1000 caracteres, diálogo y cancelación. Revocar cierra sesiones; login informa revocación sin motivo legal. Restaurar exige nuevo login, no revive sesiones.
4. Empresa revocada: vacantes ocultas y sin nuevas candidaturas, sin borrar datos. Restaurar no reabre cerradas/vencidas. No modificar administradores ni restaurar eliminadas.

API: GET /admin/cuentas (rol/acceso/q/pagina), GET /:id, POST /:id/acceso con accion y motivo. Guard ADMIN; 401 sin sesión y 403 otros.
Web: /admin/cuentas y /admin/cuentas/:id, navegación propia.
No aprueba empresas ni modera contenido; no se integra la propuesta divergente origin/samuel-dev.
Evidencia: completo.e2e-spec.ts y completo.spec.ts.
