# Implementation Plan: Perfil del estudiante

**Branch**: `005-perfil-estudiante` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)
**Mockups**: `docs/praxis-mockups.pen`, frame «M3 · Perfil del estudiante» (360 y 1080 px)

## Summary

El estudiante completa su perfil por secciones (formación, disponibilidad e idiomas, aval), sube hoja de vida,
soporte del aval y foto, y ve si su perfil mínimo está completo. API: columnas nuevas en `Estudiante`, tablas
`IdiomaDeclarado` y `ArchivoPerfil`, endpoints `/perfil/*` solo para el rol estudiante. Archivos en disco en
desarrollo y pruebas, en S3/R2 en producción, siempre con enlaces firmados de corta duración. Web: la página
`/estudiante/perfil` y una página por sección, con los selectores de M2.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 24, ESM
**Primary Dependencies**: NestJS 12 (multer, ya incluido en `@nestjs/platform-express`), Prisma 7, Zod 4, Next.js 16, MUI 9; nuevo en producción: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
**Storage**: PostgreSQL (perfil); archivos en `apps/api/.archivos/` (desarrollo/pruebas) o bucket S3/R2 privado (producción)
**Testing**: Vitest (contracts), Jest + Postgres real (API), Playwright + axe (E2E)
**Target Platform**: web móvil 360 px y escritorio 1080 px
**Project Type**: web (monorepo `apps/web`, `apps/api`, `packages/contracts`)
**Performance Goals**: API < 500 ms p95 sin contar la transferencia del archivo
**Constraints**: WCAG 2.1 AA, solo español, datos ficticios, archivos PDF ≤ 5 MB y foto JPG/PNG ≤ 2 MB
**Scale/Scope**: 10.000 perfiles; ≤ 3 archivos vigentes por perfil

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| II. Comparables | Nivel, avance, jornada e idiomas se guardan como ids de los catálogos de M2; el programa es texto libre (excepción de v4.0.0) |
| IV. Perfil mínimo | `perfilMinimo()` en contracts: nivel + programa (escrito) + CV; el resto nunca lo cambia |
| VI. Mínimo acceso | Todo `/perfil/*` exige sesión de estudiante y opera solo sobre su `cuentaId`; no hay ids en la URL |
| VII. No discriminación (v3.0.0) | Foto opcional, fuera del perfil mínimo; ningún campo de edad, sexo ni estado civil |
| VIII. Datos | Solo los campos de la spec; esquemas estrictos; datos ficticios en semillas y pruebas |
| IX. Honestidad | Rótulo «Aval declarado (con/sin soporte)»; nunca «verificado» |
| X. Accesible | Errores por campo + resumen con foco, `aria-label` en «Completar»/«Editar», progreso con `aria-valuenow`, axe en E2E |
| XII. Simplicidad | Nest y Prisma directos; un servicio `Archivos` con dos backends (disco/S3), sin capas extra |
| XIII. Pruebas primero | Perfil mínimo, esquemas, detección de tipo por contenido y permisos por rol: prueba antes del código |
| XIV. Seguridad | Zod en la API; tipo comprobado por bytes mágicos; límites de tamaño en multer; enlaces firmados (HMAC o S3) de 5 min; logs sin nombres de archivo |

Resultado: pasa. Re-evaluado tras el diseño: sin cambios.

## Decisiones

Detalle y alternativas en [research.md](research.md).

- **Esquemas en contracts**: `formacionSchema`, `disponibilidadSchema` (incluye idiomas), `avalSchema`,
  `perfilMinimo()`, `LIMITES_ARCHIVO` y `tipoPorContenido()` (bytes mágicos). La web y la API usan los mismos.
- **Subida**: `PUT /perfil/archivos/:tipo` multipart con `FileInterceptor` (memoria, con límite). La web usa
  `XMLHttpRequest` para tener progreso y cancelar (fetch no reporta progreso de subida).
- **Enlaces**: `GET /perfil/archivos/:tipo/enlace` devuelve una URL válida 5 minutos. En disco, la sirve
  `GET /archivos/:clave?exp&firma` (HMAC-SHA256 con `ARCHIVOS_SECRETO`); en S3, URL prefirmada.
- **Reemplazar**: se guarda el nuevo, se actualiza la fila y luego se borra el anterior. Si falla la subida, la fila
  sigue apuntando al anterior (FR-013).
- **Sin endpoint de catálogos**: la web importa los catálogos de contracts (M2).

## Project Structure

### Documentation (this feature)

```text
specs/005-perfil-estudiante/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/api-perfil.md
└── tasks.md
```

### Source Code

```text
packages/contracts/src/
├── perfil.ts  perfil.test.ts           # esquemas, perfilMinimo, LIMITES_ARCHIVO, tipoPorContenido
apps/api/
├── prisma/schema.prisma                 # Estudiante + IdiomaDeclarado + ArchivoPerfil (migración `perfil`)
├── src/auth/sesion.ts                   # + SoloEstudianteGuard
├── src/perfil/perfil.controller.ts      # /perfil, /perfil/{formacion,disponibilidad,aval,archivos/:tipo}
├── src/perfil/perfil.service.ts
├── src/perfil/archivos.ts               # disco (HMAC) o S3 (prefirmada)
├── src/perfil/archivos.controller.ts    # GET /archivos/:clave (solo backend disco)
└── test/perfil.e2e-spec.ts
apps/web/src/
├── app/estudiante/perfil/page.tsx                  # ver mi perfil (3 estados)
├── app/estudiante/perfil/{formacion,disponibilidad,aval,hoja-de-vida}/page.tsx
├── components/perfil/{EncabezadoPerfil,SeccionPerfil,FaltaInformacion,FormularioFormacion,
│   FormularioDisponibilidad,ListaIdiomas,FormularioAval,SubidaArchivo,VolverAlPerfil}.tsx
├── lib/perfil.ts                        # getPerfil() en servidor, subir() con XHR en cliente
└── e2e/perfil.spec.ts
```

**Structure Decision**: los tres proyectos existentes; un módulo `perfil` en la API y componentes en
`components/perfil/` en la web.

## Complexity Tracking

| Adición | Por qué | Alternativa descartada |
|---|---|---|
| `@aws-sdk/client-s3` + `s3-request-presigner` | La constitución fija S3/R2 privado con URLs firmadas en producción | Disco en Railway: efímero sin volumen y fuera de la regla |
| Dos backends de archivos | Pruebas y desarrollo sin credenciales ni red, igual que el correo de M1 | Solo S3 con MinIO en Docker: otro servicio para levantar |
