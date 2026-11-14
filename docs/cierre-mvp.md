# Cierre del MVP · 2026-11-13

## Estado vigente · alcance completo de los mockups

El usuario amplió el alcance el 2026-11-13 para completar también S3, S4 y
Administración. La entrega permanece en 013-cierre-mvp, sin mezclar ramas ajenas.
El trabajo previo de 013 se guardó en 51b455d. Constitución 5.0.0 preparada para
revisión: no se inventa aprobación del equipo.

Commits de esta entrega: 4a8ff3e (implementación/pruebas) y 0d4d1f5 (specs,
backlog y evidencia), además de 51b455d. El intento real de push de la rama falló
por falta de usuario/credencial de GitHub, con interacción deshabilitada; no hubo
publicación, PR ni ejecución de CI remoto. Se comprobó también GitHub como
integración alternativa: está disponible pero no instalada/conectada. No sustituye
la autenticación pendiente. El cuerpo del PR y el comando de publicación quedan preparados.

| Área | Estado local | Evidencia |
|---|---|---|
| M0–M2: navegación, cuentas, recuperación y catálogos | Implementado | Guardas, contratos, auth y recorridos de navegador |
| M3: perfil estudiante y documentos | Implementado | Postgres real, archivos privados y pruebas S3 compatible local |
| M4: perfil empresa y logo opcional | Implementado | Ficha, NIT, logo JPG/PNG privado, reemplazo y borrado probados |
| M5–M6: vacantes, búsqueda, elegibilidad y postulación | Implementado | Cupos, propiedad, congelación de requisitos y copia del perfil/CV |
| M7–M8: seguimiento, candidatos y notificaciones | Implementado | Estados, revisión explícita, historial, avisos de cierre/CV/planes |
| M9: planes y Wompi sandbox | Implementado en modo local | Firmas, importes, idempotencia y activación con fixture externo; no pagos reales |
| S2: vencimiento de planes | Implementado | Aviso siete días antes y al vencer, en Planes/Mis vacantes/bandeja |
| S3: cambiar CV de candidatura Enviada | Implementado | Carrera con revisión, permiso, copia independiente, fecha e historial |
| S4: supresión de cuenta | Implementado | Contraseña/confirmación, anonimización, retirada/cierre, sesiones y limpieza durable |
| Administrador | Implementado | Lista/filtros/detalle mínimo, revocar/restaurar con motivo, sesiones y permisos |

### Specs y backlog

Specs propias de mockups: 015-aviso-vencimiento-plan, 016-cambiar-cv-postulacion,
017-supresion-cuenta y 018-administrar-acceso. Cada una tiene spec, plan y tareas.
Se completaron las specs ausentes 006–010 y tareas documentales 003/006–010.
No se afirma que estas reconstrucciones documentales precedieron al código.
El plan 014 explica la entrega conjunta. Backlog S1–S5 tiene implementación;
las aprobaciones/credenciales pendientes quedan separadas de las tareas de código.

### Verificación vigente

**450 pruebas locales aprobadas**: 129 integración API, 10 unitarias API, 111 web,
88 contratos, 17 guardas, 8 scripts y 87 casos únicos de navegador. Playwright:
80 aprobados en la corrida conjunta; tras corregir selectores accesibles se
aprobaron los cuatro afectados y tres de bloqueo pendientes. No quedan fallos
conocidos de esta validación. Los últimos cambios de acceso tuvieron además 26
casos afectados de API revalidados.

Postgres real y S3 compatible local en Docker; nueve migraciones aplicadas solo a
bases aisladas. Tipos API/web/scripts, lint y builds aprobados. Auditoría de
producción: 0 vulnerabilidades. Auditoría completa: 25 avisos de desarrollo
(3 bajos, 22 moderados), ninguno alto/crítico; no se hizo downgrade forzado de Jest.
Wompi externo queda **aplazado por decisión explícita del usuario** hasta registrar
el proyecto. Se conserva sandbox deshabilitado sin llaves, sin fingir pagos.

### Bloqueos externos y pasos exactos

| Bloqueo | Responsable y desbloqueo |
|---|---|
| Resend y S3/R2 remotos sin credenciales | Responsable de infraestructura configura variables de docs/produccion.md y ejecuta npm run verificar:proveedores. Para correo, proporcionar destinatario autorizado y usar -- --correo destino; no se enviaron correos externos. |
| Revisión manual con lector sin completar | El control Windows se detuvo automáticamente al no poder determinar la URL del navegador con suficiente confianza. No se continuó la automatización nativa ni se certificó la revisión. Una persona del equipo debe ejecutar la revisión de docs/accesibilidad-2026-11-13.md. Axe y teclado automatizado sí se verificaron. |
| Publicación de rama/PR y CI remoto | Git Credential Manager está instalado pero no tiene una credencial disponible sin interacción. El usuario ejecuta git credential-manager github login; después git push -u origin 013-cierre-mvp. Con acceso, node scripts/github-entrega.mts pr abre el PR usando specs/014-praxis-completo/pr.md y node scripts/github-entrega.mts ci consulta Actions. |
| Revisión del equipo/enmienda 5.0.0 | Otro integrante revisa el PR, las decisiones documentadas y el resultado de CI. No se marca aprobada una revisión ajena. |
| Administrador de despliegue | Tras migrar y compilar la API, responsable configura ADMIN_CORREO y ADMIN_CONTRASENA (>=16 caracteres) en entorno y ejecuta node scripts/crear-admin.mts. No promueve cuentas existentes ni imprime secretos. |

Antes de usar datos reales permanece la revisión responsable de privacidad y
alojamiento descrita en docs/produccion.md. No se hizo despliegue ni migración sobre
Neon/desarrollo/producción. Esta entrega no declara cerrado el producto mientras
las validaciones requeridas sigan pendientes.

## Registro histórico de la fase 013 (superado por el estado vigente)

Estado del repositorio revisado en `main` (`2d9bb8f`) y cambios locales en
`013-cierre-mvp`. Este documento actualiza las referencias históricas de
`mvp-entrega.md` y `pendientes-mvp.md`: los módulos 003–012 ya están en `main`.
No se han fusionado las decisiones incompatibles de `origin/samuel-dev`.

## Funcionalidad

El MVP incluye navegación, cuentas y recuperación de contraseña, catálogos,
perfiles de estudiante y empresa, vacantes, búsqueda y filtros, elegibilidad,
postulación con copia del perfil y archivos, seguimiento, notificaciones y planes
con pagos sandbox. Administración, reemplazo del CV de una candidatura enviada
y supresión de cuentas siguen fuera del alcance académico. El logo opcional de
empresa permanece aplazado; no bloquea el recorrido del MVP.

Cambios de esta rama:

- Aviso dentro de la web durante los siete días anteriores al vencimiento de
  Básico o Ilimitado; una notificación por cuenta y fecha de vencimiento,
  protegida por índice único incluso con varias instancias. Comprobación al
  iniciar, cada hora y al consultar planes/notificaciones. No envía correo,
  no cobra y no habilita renovaciones antes del vencimiento.
- Mensaje en Planes y pagos con fecha colombiana y renovación manual.
- Cierre de vacantes y avisos a candidatos dentro de la misma transacción,
  tanto manual como por vencimiento, sin cambiar las postulaciones ni duplicar
  avisos en cierres concurrentes.
- Inicio sin «Empieza gratis», conforme a FR-001 de la spec 001.
- Preparación de la base Playwright antes de iniciar la API: el servicio de
  avisos consulta datos al arrancar y no puede esperar al globalSetup posterior.
- ESLint omite informes y trazas generados por Playwright, evitando inspeccionar
  archivos temporales que el navegador elimina al iniciar una corrida.

Migración nueva: `20261113120000_avisos_planes`. Permite notificaciones sin
postulación y agrega clave única de deduplicación e índice de vencimiento.
Aplicada exclusivamente a bases aisladas de pruebas, nunca a desarrollo o producción.

## Evidencia local

Node 24.22.1 temporal, sin cambiar Node del sistema. Postgres real y almacenamiento
compatible con S3 en Docker, con datos ficticios y servicios en loopback.

Las pruebas nuevas fallaron antes de implementar: dos casos de avisos de planes
y dos de cierre de vacante. Después pasaron las 121 pruebas de integración API.
También aprobaron 10 unitarias API, 111 unitarias web, 88 contratos, 17 guardas
de bases y 8 pruebas de scripts. Tipos API/web/scripts y builds de contratos/API
aprobados; lint de API y web aprobados. Auditoría de producción: 0 vulnerabilidades.
La auditoría completa detecta 25 avisos en herramientas de desarrollo (3 bajos y
22 moderados), sin altos ni críticos. No se aplicó `audit fix --force`, que propone
retroceder Jest a una versión incompatible.

Corrida final Playwright: **79 de 79 aprobadas**, móvil a 360 px y escritorio a
1080 px, incluidos axe, navegación por teclado, permisos, recuperación de contraseña,
bloqueo y el recorrido publicar → buscar → comprobar → postular → seguir → notificar
→ retirar. La corrida inicial detectó una expectativa antigua que exigía «Empieza
gratis»; se alineó con FR-001 y la corrida final completa pasó. Build de web aprobado.

Total: **434 pruebas locales aprobadas**. No hay pruebas en ejecución ni resultados
pendientes de esta validación. Los cambios permanecen locales, sin commit ni push,
en `013-cierre-mvp`; `main` conserva `2d9bb8f`.

## Qué impide declarar el cierre formal

- El verificador de proveedores informa `sin configurar` para correo, archivos y
  pagos. Faltan las credenciales de Resend, S3/R2 y Wompi sandbox. El almacenamiento
  compatible local y los fixtures de pagos no acreditan esos proveedores externos.
- La definición de terminado de la constitución exige CI remoto y PR revisado por
  otro integrante. No se han publicado estos cambios ni obtenido esa aprobación.
- Falta registrar la revisión manual completa con teclado y lector de pantalla;
  axe y Playwright cubren solo parte de la accesibilidad.
- Antes de usar datos reales siguen pendientes la validación responsable del
  tratamiento de datos y los requisitos de producción de `docs/produccion.md`.

Las credenciales se configuran en el entorno, nunca en el repositorio ni en el chat.
Con ellas, ejecutar `npm run verificar:proveedores`; la prueba de entrega de correo
requiere un destinatario de prueba expresamente autorizado. Validar además el
webhook público HTTPS de Wompi sandbox. No se declaran cumplidas esas pruebas aún.
