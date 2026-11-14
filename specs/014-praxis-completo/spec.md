# Praxis de punta a punta

Rama de entrega: `013-cierre-mvp`, continuación explícita solicitada por el usuario
el 2026-11-13. Contiene el commit de spec 013 y los módulos de esta especificación.

## Alcance y decisiones

Implementar los mockups S2, S3, S4 y Administrador, completar las diferencias
funcionales y visuales documentadas de M0–M9 y validar el recorrido completo.
La instrucción del usuario amplía el alcance previo; la enmienda de constitución
se entrega para revisión humana, sin inventar aprobación del resto del equipo.

- S2: siete días antes y al vencer; aviso en Planes y Mis vacantes. Renovación
  manual al vencer; las vacantes abiertas no se cierran por perder el plan.
- S3: PDF <=5 MB, solo por su estudiante y mientras la candidatura siga Enviada.
  El bloqueo de fila serializa reemplazo, revisión y retirada. Abrir el detalle
  de la empresa inicia En revisión. No cambia el CV del perfil. Historial y aviso
  a la empresa, fecha visible, archivo anterior eliminado con reintentos durables.
- S4: contraseña y consentimiento explícito, confirmación final, cancelación segura.
  Eliminación inmediata sin periodo de gracia. Cerrar sesiones y enlaces, borrar
  perfil y copias de archivos, anonimizar candidaturas conservando estados/fechas.
  Retirar candidaturas en curso, cerrar vacantes abiertas y avisar a contrapartes.
  Conservar una huella SHA-256 del NIT normalizado para impedir cuentas duplicadas;
  no se conserva NIT en texto tras supresión. Los archivos pendientes de borrado
  quedan inaccesibles por API; se reintenta su eliminación física si falla S3.
- Administrador: sin registro público; alta operativa por CLI con contraseña desde
  entrada segura. Solo cuentas y control de acceso; nunca perfiles, CV, vacantes ni
  candidaturas. Motivo obligatorio e historial con responsable. Revocar cierra
  sesiones, oculta vacantes sin borrarlas y bloquea nuevas postulaciones; restaurar
  no reabre vacantes vencidas ni recupera sesiones. No revocar administradores ni
  restaurar cuentas eliminadas. No publicar el motivo legal al usuario revocado.

## Calidad

Pruebas de permisos, concurrencia e integración con Postgres real antes de las
reglas críticas. Playwright para cada flujo, axe y teclado móvil/escritorio.
Mismas tres aplicaciones, sin colas ni dependencias nuevas. Pendientes externos
se registran con causa y paso exacto. Commit, push, PR y espera de CI autorizados.
