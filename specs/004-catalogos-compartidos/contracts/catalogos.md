# Contrato: `@praxis/contracts` · catálogos

Lo que M3, M4 y M5 importan. Sin endpoints HTTP: la web y la API importan el mismo paquete.
Fuente: `packages/contracts/src/catalogos.ts` y `comparar.ts`.

## Listas

```ts
type Valor = { id: string; nombre: string; retirado?: true };

NIVELES_FORMACION, MODALIDADES, JORNADAS, IDIOMAS, NIVELES_MCER, SECTORES: readonly Valor[]
AVANCES:   readonly (Valor & { niveles: string[] })[]
```

Son 7 catálogos. `PROGRAMAS`, `programasDe` y `programaDelNivel` se retiraron el 2026-10-23 (constitución
v4.0.0): el programa es texto libre.

## Consultas

```ts
vigentes(catalogo)                 // valores para un selector, en orden
nombreDe(catalogo, id)             // nombre aunque esté retirado; undefined si el id no existe
avancesDe(nivelId)                 // avances vigentes que aplican a ese nivel
avanceDelNivel(avanceId, nivelId): boolean
```

## Esquemas Zod y mensajes

```ts
valorDe(catalogo)   // z.string() que acepta solo ids vigentes → «Elige una opción de la lista.»
idiomasSchema       // [{ idioma, nivel }], cada idioma una vez → «Ya agregaste este idioma.» en [i, "idioma"]
MENSAJES_CATALOGO   // fueraDeLista, avanceDeOtroNivel, idiomaRepetido
```

Avance-nivel se valida en el esquema de M3/M5 con `.check()` y el predicado de arriba.

## Comparación

```ts
type Resultado = "cumple" | "no_cumple" | "falta_informacion";

estaEntre(aceptados, declarado?)                 // nivel de formación
coinciden(requerido, declarado?)                 // jornada
alMenos(orden, minimo, declarado?)               // lanza si un id no es del catálogo
compararIdioma({ idioma, nivel }, declarados)
compararAvance({ nivel, avance }, { nivel?, avance? })

REQUISITOS_EXCLUYENTES = ["nivelFormacion"]

// Programas solicitados por la vacante (no es catálogo; v4.0.0)
programasSolicitadosSchema  // 1 a 5 textos de 3 a 150 caracteres, sin repetidos (ignora tildes y mayúsculas)
                            // «Escribe el nombre completo del programa.», «Ya agregaste este programa.»,
                            // «Escribe máximo 5 programas.»
PROGRAMA_REVISA_EMPRESA = "La empresa revisa la afinidad"   // rótulo; nunca cumple/no cumple
```

Declarado vacío → `falta_informacion`. Idioma no declarado → `falta_informacion`. Avance de otro nivel → `falta_informacion`.
