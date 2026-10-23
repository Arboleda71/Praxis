# Research: Perfil del estudiante

Sin «NEEDS CLARIFICATION»: la spec resolvió los casos abiertos (cambio de nivel, aval «No», CV solo
reemplazable). El caso «programa retirado» dejó de existir con la constitución v4.0.0 (programa en texto libre).

## 1. Almacenamiento de archivos

- **Decision**: servicio `Archivos` con backend en disco (`ARCHIVOS_DIR`, por defecto `.archivos/`, ignorado por
  git) si no hay `S3_BUCKET`, y S3/R2 si lo hay. En producción, sin `S3_BUCKET`, la API no arranca.
- **Rationale**: mismo patrón que `Correo` en M1; las pruebas no necesitan red ni credenciales.
- **Alternatives considered**: MinIO en Docker (otro servicio); guardar el PDF en Postgres (`bytea`, infla la base
  y los respaldos).

## 2. Enlaces firmados

- **Decision**: 5 minutos. Disco: `GET /archivos/:clave?exp=…&firma=…` con HMAC-SHA256 (`ARCHIVOS_SECRETO`),
  comparación en tiempo constante. S3: `getSignedUrl` con `ResponseContentDisposition: inline`.
- **Rationale**: XIV exige URLs firmadas de corta duración; la verificación es de pocas líneas con `node:crypto`.
- **Alternatives considered**: servir siempre por la API con la cookie (no cumple «URL firmada» y no sirve para S3).

## 3. Validación del tipo

- **Decision**: `tipoPorContenido(bytes)` en contracts: `%PDF-` → pdf, `FF D8 FF` → jpg, `89 50 4E 47 0D 0A 1A 0A` →
  png. La web filtra antes por `file.type` y tamaño para avisar rápido; la API decide.
- **Rationale**: un .docx renombrado a .pdf no pasa; sin dependencias (`file-type` resolvería lo mismo con más
  peso).
- **Alternatives considered**: confiar en `Content-Type` del navegador (lo controla el cliente).

## 4. Subida con progreso

- **Decision**: `XMLHttpRequest` con `upload.onprogress` y `abort()`; multer en memoria con `limits.fileSize`
  (5 MB o 2 MB según el tipo) y 413 con el mensaje de la spec.
- **Rationale**: `fetch` no informa progreso de subida en los navegadores actuales.

## 5. Modelo

- **Decision**: los campos del perfil son columnas de `Estudiante` (1:1 con la cuenta); idiomas en tabla propia
  con clave (`cuentaId`, `idioma`); archivos en `ArchivoPerfil` con único (`cuentaId`, `tipo`).
- **Rationale**: la elegibilidad filtrará por nivel e idiomas: columnas y tabla indexables (escala del piloto). El
  programa es texto libre y no se filtra (v4.0.0), así que no lleva índice. Un archivo vigente por tipo lo garantiza la base.
- **Alternatives considered**: JSON para idiomas (no indexable ni con unicidad en la base).

## 6. Cambio de nivel en el formulario

- **Decision**: al cambiar el nivel en la web, el avance se vacía si no corresponde y se anuncia con `aria-live`;
  el programa se conserva (texto libre, no depende del nivel desde v4.0.0). La API rechaza un avance de otro
  nivel con el mensaje de M2.

## 8. Programa en texto libre (constitución v4.0.0, 2026-10-23)

- **Decision**: `TextField` simple (sin `Autocomplete`); `formacionSchema` valida 3 a 150 caracteres sin espacios
  sobrantes. Columna `VARCHAR(150)`.
- **Rationale**: los programas reales no caben en un catálogo; la afinidad la revisa la empresa.

## 7. Foto en la barra superior

- **Decision**: la barra sigue con la inicial (FR-018 lo exige sin foto; con foto no es obligatorio). Mostrarla
  arriba requeriría pedir un enlace firmado en cada página. `ponytail:` se agrega si el equipo lo pide.
