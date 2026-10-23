# Implementation Plan: Catálogos compartidos

**Branch**: `004-catalogos-compartidos` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)
**Mockups**: no aplica (M2 no tiene pantallas; los selectores se diseñan en M3, M4 y M5)

## Summary

Las listas cerradas que comparten perfil del estudiante, ficha de empresa y vacante, y las reglas para comparar
sus valores. Todo vive en `packages/contracts` como constantes de TypeScript: la web las importa para los
selectores y la API para validar. Sin tablas, sin endpoints, sin dependencias nuevas. M3, M4 y M5 guardan solo
el `id` del valor.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js 24, ESM
**Primary Dependencies**: Zod 4 (ya instalado en contracts)
**Storage**: ninguno en M2. M3/M4/M5 guardarán el `id` como texto
**Testing**: Vitest en `packages/contracts`
**Target Platform**: paquete compartido por `apps/web` y `apps/api`
**Project Type**: librería interna del monorepo
**Performance Goals**: no aplica (listas de ≤ 30 valores en memoria)
**Constraints**: solo español; el programa es texto libre, fuera de los catálogos (constitución v4.0.0)
**Scale/Scope**: 7 catálogos (antes 8, con ~30 programas; el de programas se retiró el 2026-10-23)

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| II. Requisitos comparables | Una sola lista por campo; se compara por `id`, nunca por texto. El programa es la excepción: texto libre, sin comparar (v4.0.0) |
| III. Sin puntajes | Las reglas devuelven solo `cumple`, `no_cumple` o `falta_informacion`; los programas solicitados se muestran con `PROGRAMA_REVISA_EMPRESA`, sin estado |
| IV. No se postula a lo que no se cumple | Campo vacío → `falta_informacion`; solo el nivel de formación se marca como excluyente |
| VII. No discriminación | No hay catálogos de datos sensibles; una prueba fija el conjunto exacto de catálogos |
| VIII. Datos ficticios | Los catálogos no tienen datos personales; ya no hay semilla de programas |
| XII. Simplicidad | Constantes + funciones puras en el paquete existente; sin tablas, endpoint ni panel |
| XIII. Pruebas primero | Las reglas de comparación son parte de la elegibilidad: prueba antes del código |
| XIV. Seguridad | La API valida con los esquemas Zod de estos catálogos (solo valores vigentes) |

Resultado: pasa. Re-evaluado tras el diseño: sin cambios.

## Project Structure

### Documentation (this feature)

```text
specs/004-catalogos-compartidos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/catalogos.md   # API pública del módulo para M3, M4 y M5
└── tasks.md                 # /speckit-tasks
```

### Source Code

```text
packages/contracts/src/
├── catalogos.ts             # listas, búsqueda por id, esquemas Zod
├── catalogos.test.ts
├── comparar.ts              # reglas: estaEntre, coinciden, alMenos, idioma, avance; programas solicitados
├── comparar.test.ts
└── index.ts                 # + export de ambos
```

**Structure Decision**: solo `packages/contracts`. La web y la API no cambian en M2; empiezan a usarlo en M3.

## Complexity Tracking

Sin violaciones.
