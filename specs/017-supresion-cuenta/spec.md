# S4 · Supresión de la cuenta
Mockup propio S4: pedir, confirmar y después de eliminar. Fecha 2026-11-13. Decisiones: inmediata sin gracia; conservar huella SHA-256 del NIT normalizado, nunca NIT en texto tras supresión.

## Aceptación
- Entrada desde perfil vacío/completo y menú. Explicar borrado e historial anonimizado; contraseña, casilla sin marcar y diálogo final. Cancelar no modifica. Limitar intentos.
- Estudiante: anonimizar perfil y snapshots, retirar candidaturas en curso con motivo y aviso; conservar estados finales y fechas.
- Empresa: quitar ficha/contactos/logo, borrar borradores, cerrar abiertas con motivo cuenta eliminada y avisar; conservar publicadas e historial.
- Cerrar sesiones y enlaces. Cuenta eliminada no inicia sesión ni se restaura por administración. Sin correo de despedida.
- Borrar documentos y copias; si falla proveedor, tarea durable y mensaje honesto. API niega pendientes; URLs S3 previas pueden durar hasta cinco minutos si el proveedor falla.
- Serializar escrituras con supresión para no repoblar el perfil.

API: POST /cuenta/supresion con contrasena y entiende=true; elimina cookie y responde eliminada/archivosPendientes. Web: /cuenta/eliminar y /cuenta-eliminada.
No hay supresión pública de administradores.
Evidencia: cuenta.service.ts, limpieza.service.ts y completo.e2e-spec.ts/completo.spec.ts.
