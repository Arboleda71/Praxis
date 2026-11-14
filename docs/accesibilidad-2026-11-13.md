# Accesibilidad · 2026-11-13

## Evidencia disponible

Playwright verificó los recorridos de visitante, estudiante, empresa y administrador
a 360 y 1080 px, incluidos axe WCAG A/AA, nombres accesibles, foco inicial, navegación
protegida, diálogos, Escape y selección/carga de documentos. Los flujos nuevos
incluyen cancelación de supresión, revisión/reemplazo de CV, avisos de plan y control
de acceso. Objetivos táctiles de botones e iconos >=44 px en el tema compartido.

Esto no certifica una revisión humana completa ni la salida auditiva de un lector.

## Intento de revisión manual y bloqueo

Se inicializó computer-use con @oai/sky y se seleccionó una ventana de Edge.
Se abrió una pestaña para http://localhost:3100/. Antes de poder inspeccionar
Praxis, el control se detuvo: no podía determinar la URL actual del navegador con
suficiente confianza para aplicar su política. No se volvió a enviar entrada nativa.
Narrador existe en el equipo; NVDA no está en sus ubicaciones habituales. No se
inició ni se afirmó haber escuchado una sesión de lector de pantalla.

## Procedimiento pendiente para una persona del equipo

1. Iniciar la demo con datos ficticios según docs/mvp-entrega.md, sin una corrida
   Playwright simultánea, o usar el entorno de revisión publicado.
2. Con Narrador/NVDA, recorrer inicio, registro, ingreso, confirmación y recuperación
   solo con teclado; comprobar encabezados, etiquetas, errores y avisos vivos.
3. Como estudiante, recorrer perfil, búsqueda/filtros, requisitos, confirmación de
   postulación, historial y reemplazo de CV. Revisar diálogo y cancelación de supresión.
4. Como empresa, ficha/logo, vacantes por pasos, publicación bloqueada, candidatos,
   revisión/estado, notificaciones y planes/vencimiento. Sin introducir pagos reales.
5. Como administrador ficticio, lista/filtros, detalle, diálogo de revocación,
   motivo obligatorio, cancelación y restauración. No usar cuentas reales para pruebas.
6. Repetir a 360/1080 px y con texto ampliado 200%. Comprobar foco visible y orden,
   lectura de estados sin depender de color, retorno del foco y ausencia de recortes.
7. Registrar lector/versión, navegador, fecha, resultado por pantalla y cualquier
   corrección. Adjuntar al PR; solo entonces cerrar la tarea manual.
