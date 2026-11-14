# S3 · Reemplazar el CV de una postulación
Mockup propio S3: Estudiante y Después del cambio. Autorizado 2026-11-13; enmienda 5.0.0 para revisión del equipo.

## Aceptación
1. Solo su estudiante cambia la copia del CV mientras siga Enviada. PDF <=5 MB por contenido. Perfil y otros documentos no cambian.
2. Mostrar archivo actual/nuevo, tamaño, progreso y error. Empresa ve versión vigente y fecha. Historial CV reemplazado y notificación a empresa.
3. Revisión, retirada y reemplazo comparten bloqueo. Si gana revisión: 409 y archivo anterior conservado. Sin permiso: 401/403/404.
4. Limpiar versión anterior con reintento durable; no dejar archivos nuevos huérfanos si falla transacción. Enlaces privados cortos.

API: GET /postulaciones/:id (metadatos propios); PUT /postulaciones/:id/cv (multipart archivo); POST /empresa/postulaciones/:id/revisar (idempotente). GET del detalle no cambia estados.
Web: /estudiante/postulaciones/:id/cv y retorno a Mis postulaciones.
Evidencia: cv.service.ts, completo.e2e-spec.ts (carrera) y completo.spec.ts.
