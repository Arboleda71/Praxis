# Plan y tareas S3
Reutilizar almacenamiento y contrato PDF. Orden: cuenta activa, estudiante, postulación. NO KEY UPDATE en cuenta evita interbloqueos con FK de notificaciones. cvReemplazadoEn e historial no alteran el estado real; ArchivoPorBorrar recupera limpieza tras reinicio.

- [x] Prueba fallida antes de implementar y carrera contra Postgres real.
- [x] API, permisos, archivos, historial, fecha y notificación.
- [x] Interfaz de selección, validación y progreso.
- [x] Flujo de navegador aprobado en validación inicial móvil/escritorio.
- [x] Corrida final registrada en docs/cierre-mvp.md.
- [ ] Revisión de enmienda/PR.

Sin proyectos ni dependencias nuevos; excepción de VI en constitución 5.0.0.
