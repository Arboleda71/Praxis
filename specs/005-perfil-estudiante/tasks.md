# Tasks: Perfil del estudiante

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/api-perfil.md](contracts/api-perfil.md)

Leyenda: `[x]` verificado localmente · `[~]` pendiente de proveedor externo · `[ ]` pendiente. CI remoto y revisión humana siguen pendientes. Lo crítico va con la prueba primero (XIII).

## Fase 1: Base

- [x] T001 Migración `perfil` en `apps/api/prisma/schema.prisma`: columnas de `Estudiante`, `IdiomaDeclarado`, `ArchivoPerfil` y enum `TipoArchivo`; migración `20261023120000_perfil` generada con `prisma migrate diff` (sin base); aplicada y verificada exclusivamente en praxis_test
- [x] T002 `ARCHIVOS_SECRETO`, `ARCHIVOS_DIR` y `S3_*` en `apps/api/.env.example`; `.archivos/` en `.gitignore`

## Fase 2: Fundacional (prueba primero)

- [x] T003 Prueba en `packages/contracts/src/perfil.test.ts`: `perfilMinimo` (completo, faltan por nombre, foto/aval/idiomas no influyen), `tipoPorContenido` (PDF, JPG, PNG, .docx renombrado), `LIMITES_ARCHIVO`
- [x] T004 Prueba en el mismo archivo: `formacionSchema` (programa en texto libre de 3 a 150 caracteres, avance de otro nivel, retirado, institución ≤ 150; el caso «programa de otro nivel» se quitó el 2026-10-23 por la constitución v4.0.0), `disponibilidadSchema` (fecha válida, idiomas repetidos), `avalSchema`
- [x] T005 Implementar `packages/contracts/src/perfil.ts` y exportarlo en `index.ts`
- [x] T006 `SoloEstudianteGuard` en `apps/api/src/auth/sesion.ts` (401 sin sesión, 403 otro rol)
- [~] T007 Servicio `Archivos` en `apps/api/src/perfil/archivos.ts` (disco con HMAC; S3 con URL prefirmada) y `GET /archivos/:clave` en `archivos.controller.ts`

## Fase 3: US1 + US2 · Perfil mínimo y secciones (P1) 🎯 MVP

- [x] T008 [US1] Pruebas de integración en `apps/api/test/perfil.e2e-spec.ts`: GET vacío, PUT formación/disponibilidad válidos e inválidos, `perfilMinimo` en la respuesta, 401/403
- [x] T009 [US1] `PerfilService` y `PerfilController` (`GET /perfil`, `PUT /perfil/formacion`, `PUT /perfil/disponibilidad`) en `apps/api/src/perfil/`, registrados en `app.module.ts`
- [x] T010 [P] [US1] `apps/web/src/lib/perfil.ts`: `getPerfil()` en servidor (reenvía la cookie) y `guardarSeccion()` en cliente
- [x] T011 [US1] Ver mi perfil en `apps/web/src/app/estudiante/perfil/page.tsx`: vacío (guía), incompleto y completo; `EncabezadoPerfil`, `SeccionPerfil`, `FaltaInformacion`
- [x] T012 [US2] `FormularioFormacion` + página `estudiante/perfil/formacion`: Select de nivel, programa en `TextField` de texto libre (constitución v4.0.0; antes Autocomplete con `programasDe`), institución, avance (`avancesDe`), vaciado del avance al cambiar de nivel, errores por campo y resumen
- [x] T013 [US2] `FormularioDisponibilidad` + `ListaIdiomas` + página `estudiante/perfil/disponibilidad`: fecha, jornada, idiomas; aviso «Guardamos…» al volver

## Fase 4: US3 · Archivos (P1)

- [x] T014 [US3] Pruebas de integración: subir PDF válido, .docx renombrado (400), PDF > 5 MB (413), reemplazar (el enlace anterior deja de servir), DELETE de hoja de vida (400), enlace firmado alterado o vencido (403)
- [x] T015 [US3] `PUT/DELETE /perfil/archivos/:tipo` y `GET /perfil/archivos/:tipo/enlace` en `perfil.controller.ts`
- [x] T016 [US3] `SubidaArchivo` (XHR con progreso, cancelar, rechazo previo por tipo y tamaño) y página `estudiante/perfil/hoja-de-vida`; «Ver» abre el enlace firmado

## Fase 5: US4 · Aval (P2)

- [x] T017 [US4] Pruebas: aval Sí/No, soporte sin aval (400), «No» borra el soporte
- [x] T018 [US4] `PUT /perfil/aval` y `FormularioAval` + página `estudiante/perfil/aval` (RadioGroup, soporte opcional, confirmación al pasar a «No»)

## Fase 6: US5 · Foto (P3)

- [x] T019 [US5] Pruebas: foto JPG/PNG ≤ 2 MB, GIF y > 2 MB rechazados, `perfilMinimo` sin cambios
- [x] T020 [US5] Foto en `EncabezadoPerfil`: agregar, cambiar y quitar con aviso previo; inicial sin foto

## Fase 7: Cierre

- [x] T021 E2E en `apps/web/e2e/perfil.spec.ts`: recorrido de perfil mínimo, errores, archivos y axe a 360 y 1080 px
- [x] T022 Verificar: pruebas, tipos, lint y build de los tres proyectos; registrar en `specs/005-perfil-estudiante/estado.md`

## Dependencias

Fase 1 → Fase 2 → US1/US2 → US3 → US4 y US5 (usan la subida de US3). T010 en paralelo con T009.

## Estrategia

MVP = Fases 1–4: perfil mínimo completo de punta a punta. Luego aval y foto.

Validación final local: 55 integración API y 67 Playwright aprobadas; ver docs/mvp-entrega.md. T007 queda parcial porque S3/R2 real no tiene credenciales.
