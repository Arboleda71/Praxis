# Plan y tareas Administración
Enum ADMIN, Cuenta.accesoRevocadoEn e HistorialAcceso con FK de cuenta y responsable. Proyección explícita de campos. Guardas por rol; sesiones verifican estado en cada consulta. Cambios de acceso/cierre de sesiones atómicos; NO KEY UPDATE en orden estable.

- [x] Pruebas primero: permisos, minimización, revocar/restaurar y ofertas.
- [x] Contratos Zod, controlador, servicio, migración y CLI de alta.
- [x] Lista, detalle, filtros, diálogos y navegación.
- [x] Corrida final y nombres accesibles verificados en ambos tamaños.
- [ ] Alta del administrador por responsable del despliegue; revisión del PR.

Sin proyectos/dependencias nuevos; administración limita su acceso conforme a VI.
