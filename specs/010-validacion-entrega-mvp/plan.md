# Validación y entrega local del MVP

Constitución 4.0.0. Las fases son implementación y verificación local; la definición de terminado también requiere CI remoto y revisión por otra persona, que permanecen pendientes porque no se autorizó push.

## Evidencia comprobada

- Postgres 17 efímero exclusivo, 127.0.0.1:55432/praxis_test. Cinco migraciones aplicadas desde una base vacía.
- Guardas rechazan remoto/Neon, puerto de desarrollo, otra base, query y fragmento antes de migrar y limpiar.
- 17 pruebas unitarias de API; contratos 83; web 12. Integración final en curso, incluidos 10.000 estudiantes ficticios, 500 empresas y 1.000 vacantes.
- Primera batería completa con Next corregido: 65/65 Playwright en 360 y 1080 px, incluido publicar/buscar/comprobar/postular/seguir/notificar/retirar, sin violaciones axe en pantallas analizadas.
- Medición local secuencial de API: p95 36,3 ms, 30 solicitudes de búsqueda, volumen anterior. No equivale a una prueba de carga concurrente en producción.
- Navegador con caché vacía y red emulada de 1,6 Mbps/150 ms: LCP móvil 632/648/648 ms; escritorio 636 ms. Son mediciones locales de laboratorio, sin afirmar resultados de usuarios reales.
- Capturas de inicio a 360 y 1080 px revisadas visualmente. Pruebas de Tab inicial, Escape del menú y navegación protegida. Axe no sustituye una auditoría manual completa con lector de pantalla.
- Auditoría npm completa y de producción: 0 vulnerabilidades después de actualizar Next/eslint-config-next a 16.4.3. Avisos verificados en GHSA-2464-fhr4-w9xw y GHSA-673q-mjm6-r5xr. Se conserva Next 16 según la constitución.
- Node usado para la validación final: 24.22.1 disponible localmente. La instalación del sistema es 24.14.1; no se modificó. .nvmrc fija 24.22.1 y engines exige Node 24 >=24.15.

## Correcciones encontradas con pruebas

Contraste de ayuda deshabilitada y nombres accesibles del perfil; espera del desmontaje de menús antes de axe; fixture PNG válido para navegador; selectores por nombre accesible de campos requeridos; confirmación explícita de correo; falta de secreto local impide arrancar; periodos del día 31 conservan su ancla después de febrero. Una prueba antigua podía dejar la firma intacta al reemplazar su primer carácter por X si ya era X: se corrige para cambiarlo siempre.

## Límites de entrega

Wompi: implementación y pruebas de firma/referencia/importe/moneda/idempotencia/activación/cupos, con respuesta externa sustituida por fixture y Postgres real. Faltan llaves sandbox y URL pública HTTPS de eventos; no se afirma pago realizado en el proveedor. Resend y S3/R2 carecen de credenciales; correo local y archivos privados con firma fueron probados. Logo opcional de empresa aplazado. Configuración de IP del proxy de producción, privacidad internacional, revisión completa con lector de pantalla, CI remoto y aprobación del PR siguen pendientes antes de publicar con datos reales.

No hubo push, merge, despliegue ni acceso a Neon/producción. Los comandos demo fijan tanto API local como base aislada y deshabilitan conexiones externas. No ejecutar pruebas y demo simultáneamente: usan la misma base efímera.

## Resultado final local · 2026-10-23

67/67 Playwright (incluye cabeceras web), 55/55 integración API, 17/17 unitarias API, 12/12 web, 83/83 contratos y 10/10 guardas: 244 casos. Tipos/lint/builds aprobados. Auditoría total npm 0 vulnerabilidades. Demo real en localhost:3200 y API 3201, sin endpoint de control de pruebas. El puerto 3000 se conservó sin interrumpir su servicio existente. Los detalles de ejecución y límites están en docs/mvp-entrega.md. La definición formal de terminado sigue esperando CI remoto y revisión humana; integraciones externas carecen de credenciales.
