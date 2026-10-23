# Data Model: Perfil del estudiante

Migración `perfil` (`apps/api/prisma/migrations/20261023120000_perfil`, aún sin aplicar: ver
`docs/pendientes-mvp.md` PM000). Ids de catálogo como `text` (M2); se validan con `valorDe` en la API. El
programa es texto libre (constitución v4.0.0); el único índice de formación es `@@index([nivelFormacion])`.

## Estudiante (columnas nuevas, todas opcionales)

| Columna | Tipo | Regla |
|---|---|---|
| `nivelFormacion` | text? | id de `NIVELES_FORMACION` · índice |
| `programa` | varchar(150)? | texto libre, 3–150 caracteres, sin espacios sobrantes; no depende del nivel (v4.0.0) |
| `institucion` | text? | 1–150 caracteres, sin espacios sobrantes |
| `avance` | text? | id de `AVANCES` que aplica al nivel |
| `disponibleDesde` | date? | fecha válida |
| `jornada` | text? | id de `JORNADAS` |
| `aval` | boolean? | null = sin responder |
| `perfilActualizadoEn` | timestamptz? | se actualiza al guardar cualquier sección |

## IdiomaDeclarado

| Columna | Tipo | Regla |
|---|---|---|
| `cuentaId` | uuid → Estudiante (cascade) | PK compuesta con `idioma` |
| `idioma` | text | id de `IDIOMAS` · índice |
| `nivel` | text | id de `NIVELES_MCER` |

Guardar la sección reemplaza todas las filas del estudiante en una transacción.

## ArchivoPerfil

| Columna | Tipo | Regla |
|---|---|---|
| `id` | uuid | |
| `cuentaId` | uuid → Estudiante (cascade) | único con `tipo` |
| `tipo` | enum `HOJA_DE_VIDA` · `SOPORTE_AVAL` · `FOTO` | |
| `clave` | text | ubicación privada aleatoria (`<uuid>.<ext>`), nunca derivada del nombre |
| `nombre` | text | nombre original, solo para mostrar (≤ 200) |
| `bytes` | int | |
| `subidoEn` | timestamptz | default now |

## Reglas derivadas

- **Perfil mínimo**: `nivelFormacion` y `programa` no nulos y existe `HOJA_DE_VIDA`. Lo calcula `perfilMinimo()`
  (contracts) y la respuesta de `GET /perfil` lo incluye.
- **Aval**: `aval = false` borra `SOPORTE_AVAL`. Rótulo: `true` + soporte → «con soporte»; `true` sin soporte →
  «sin soporte»; `false`/null → sin rótulo.
- **Límites**: PDF ≤ 5 MB (hoja de vida, soporte); JPG/PNG ≤ 2 MB (foto). `HOJA_DE_VIDA` no se puede borrar.
