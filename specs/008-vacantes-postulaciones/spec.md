# M5/M6 · Vacantes, buscar, comprobar y postular
Mockups M5 y M6. Implementados localmente. Spec completada 2026-11-13 sobre el código y planes existentes.

## Aceptación
- Empresa crea borrador por pasos. Publicar valida correo, NIT y cupo en transacción: dos gratis por periodo de seis meses anclado a la cuenta.
- Congelar requisitos al publicar; abierta solo cambia descripción, cerrada no reabre; borrar solo borrador propio.
- Cierre manual o vencimiento conserva candidaturas y crea avisos atómicos a sus estudiantes.
- Visitante ve cinco últimas abiertas. Estudiante busca título y filtra nivel/modalidad/ciudad con paginación del servidor.
- Cada requisito muestra su resultado. Solo nivel excluye. Programa libre no se evalúa. Perfil mínimo: nivel, programa y CV.
- Una candidatura por vacante y estudiante incluso retirada. Conservar copia del perfil, documentos y evaluación con confirmación previa.
- Ocultar empresas revocadas y bloquear candidaturas; serializar cambios sensibles con supresión y revocación.

API: /empresa/vacantes, /vacantes y /vacantes/:id/postulaciones; Zod en contracts/src/vacantes.ts.
Pruebas: vacantes.e2e-spec.ts, m6-buscar-postular.e2e-spec.ts, cupos.spec.ts, m6.spec.ts y mvp.spec.ts.
