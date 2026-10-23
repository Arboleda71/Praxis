# Contrato HTTP: perfil del estudiante

Todas las rutas `/perfil/*` exigen la cookie de sesión (401 sin ella) y el rol estudiante (403 con mensaje
«Esta sección es solo para estudiantes.»). Errores de validación: 400 `{ errores: { campo: mensaje } }`, como M1.
La web las llama como `/api/perfil/*` (rewrite de Next).

## GET /perfil → 200

```jsonc
{
  "nombre": "Laura Gómez Restrepo",
  "formacion": { "nivelFormacion": "tecnologo",
                 "programa": "Tecnología en análisis y desarrollo de software",  // texto libre (v4.0.0)
                 "institucion": "SENA · …", "avance": "lectiva" },          // campos null si faltan
  "disponibilidad": { "disponibleDesde": "2026-11-03", "jornada": "tiempo-completo",
                      "idiomas": [{ "idioma": "ingles", "nivel": "b1" }] },
  "aval": true,                                                              // true | false | null
  "archivos": { "hojaDeVida": { "nombre": "cv.pdf", "bytes": 319488, "subidoEn": "…" } | null,
                "soporteAval": … | null, "foto": … | null },
  "perfilMinimo": { "completo": false, "faltan": ["hojaDeVida"] }
}
```

## PUT /perfil/formacion · /perfil/disponibilidad · /perfil/aval → 200 (perfil completo, como GET)

Cuerpos: `formacionSchema`, `disponibilidadSchema`, `avalSchema` de `@praxis/contracts`. En `formacionSchema`,
`programa` es texto libre de 3 a 150 caracteres («Escribe el nombre completo de tu programa.»); solo el avance
debe corresponder al nivel.

## PUT /perfil/archivos/:tipo (multipart, campo `archivo`) → 200 (perfil)

`tipo` ∈ `hoja-de-vida` · `soporte-aval` · `foto`. 400 `{ errores: { archivo } }` si el tipo no corresponde;
413 `{ errores: { archivo } }` si pesa más del límite. `soporte-aval` exige `aval = true` (400).

## DELETE /perfil/archivos/:tipo → 200 (perfil)

`hoja-de-vida` → 400 «La hoja de vida se puede reemplazar, pero no quitar.»

## GET /perfil/archivos/:tipo/enlace → 200 `{ "url": "…", "expiraEn": "…" }` · 404 si no hay archivo

## GET /archivos/:clave?exp&firma (solo backend en disco) → 200 con el archivo · 403 si la firma no vale o venció

Sin cookie: la firma es la autorización. `Content-Disposition: inline`, `Cache-Control: private, no-store`.
