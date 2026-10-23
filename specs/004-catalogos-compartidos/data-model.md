# Data Model: Catálogos compartidos

Sin tablas. Son constantes en `packages/contracts`; M3, M4 y M5 guardan el `id` como texto.

## Valor de catálogo

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string kebab-case | Único en su catálogo; nunca cambia ni se reutiliza |
| `nombre` | string | Visible en español; se puede corregir |
| `retirado` | `true` opcional | No se ofrece ni se acepta en elecciones nuevas; se sigue mostrando |

El orden de visualización es el orden del arreglo (FR-005).

## Catálogos

| Catálogo | Valores | Extra | Regla de comparación |
|---|---|---|---|
| `NIVELES_FORMACION` | tecnico, tecnologo, universitario | — | `estaEntre` (sin orden) |
| `AVANCES` | Universitario: `sem-1`…`sem-12`; Técnico y tecnólogo: `lectiva` < `productiva` | `niveles`: niveles a los que aplica | `alMenos`, solo dentro del mismo nivel |
| `MODALIDADES` | presencial, hibrida, remota | — | ninguna (filtro, no requisito) |
| `JORNADAS` | tiempo-completo, medio-tiempo | — | `coinciden` |
| `IDIOMAS` | ingles, frances, portugues, aleman, italiano, mandarin, japones, lsc | — | por idioma, con `compararIdioma` |
| `NIVELES_MCER` | a1 < a2 < b1 < b2 < c1 < c2 | — | `alMenos` |
| `SECTORES` | 12 de FR-014 | — | ninguna (dato de la empresa) |

Son 7 catálogos. `PROGRAMAS` se retiró el 2026-10-23 (constitución v4.0.0): el programa es texto libre.

## Programas solicitados (no es catálogo)

`programasSolicitadosSchema` en `comparar.ts`: de 1 a 5 textos, cada uno de 3 a 150 caracteres sin espacios
sobrantes, sin repetidos ignorando tildes y mayúsculas. Errores: «Escribe el nombre completo del programa.»,
«Ya agregaste este programa.», «Escribe máximo 5 programas.». Se muestran con `PROGRAMA_REVISA_EMPRESA`
(«La empresa revisa la afinidad»); nunca dan *cumple*/*no cumple*.

## Validaciones (esquemas Zod exportados)

- Valor de un catálogo: solo `id` vigentes → «Elige una opción de la lista.»
- Idiomas declarados: cada idioma una vez → «Ya agregaste este idioma.»
- Avance y nivel: el avance aplica al nivel elegido → «Este avance no corresponde al nivel elegido.»

## Invariantes

- No existe catálogo de edad, sexo, género, estado civil, foto ni otro dato sensible (FR-006): una prueba fija
  el conjunto exacto de catálogos exportados.
- Solo `nivelFormacion` puede ser excluyente (`REQUISITOS_EXCLUYENTES`, FR-017; constitución v4.0.0).
