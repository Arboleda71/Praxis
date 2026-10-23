# Tasks: Catálogos compartidos

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/catalogos.md](contracts/catalogos.md)

Leyenda: `[x]` hecho y verificado · `[ ]` pendiente. Las pruebas van primero (XIII): se escriben, se ven fallar y
luego se implementa. Todo el trabajo está en `packages/contracts/src/`; se prueba con `npm run test -w @praxis/contracts`.

## Fase 1: Base

- [x] T001 Crear `packages/contracts/src/catalogos.ts` con el tipo `Valor` (`id`, `nombre`, `retirado?`) y `packages/contracts/src/comparar.ts` con el tipo `Resultado`; exportar ambos desde `packages/contracts/src/index.ts`

## Fase 2: Fundacional

- [x] T002 Prueba en `packages/contracts/src/catalogos.test.ts`: ids únicos y en kebab-case en cada catálogo; `vigentes` excluye retirados y respeta el orden; `nombreDe` devuelve el nombre de un retirado y `undefined` para un id inexistente (FR-003, FR-004, FR-005)
- [x] T003 Implementar `vigentes(catalogo)` y `nombreDe(catalogo, id)` en `packages/contracts/src/catalogos.ts`
- [x] T004 Prueba en `packages/contracts/src/comparar.test.ts`: con el declarado vacío, todas las reglas devuelven `falta_informacion`, nunca `no_cumple` (FR-016)

## Fase 3: US1 · Estudiante y empresa eligen de la misma lista (P1) 🎯 MVP

**Independent Test**: el mismo id en perfil y vacante da `cumple`; un id fuera de la lista o retirado se rechaza con «Elige una opción de la lista.»

- [x] T005 [P] [US1] Prueba en `packages/contracts/src/catalogos.test.ts`: `valorDe(catalogo)` acepta ids vigentes y rechaza texto libre y retirados con «Elige una opción de la lista.» (US1-2, SC-003)
- [x] T006 [P] [US1] Prueba en `packages/contracts/src/comparar.test.ts`: `estaEntre` y `coinciden` dan `cumple`/`no_cumple` por id (US1-1, FR-007, FR-012)
- [x] T007 [US1] Añadir a `packages/contracts/src/catalogos.ts` las listas `NIVELES_FORMACION`, `MODALIDADES`, `JORNADAS`, `IDIOMAS` y `SECTORES` con los valores y el orden de FR-007, FR-011, FR-012, FR-013 y FR-014
- [x] T008 [US1] Añadir `PROGRAMAS` a `packages/contracts/src/catalogos.ts`: semilla ficticia de ~30 programas, ~10 por nivel, cada uno con `nivel` (FR-008); comentario `ponytail:` con el pendiente de reemplazarla por SNIES + SENA antes de salir del piloto. **Quitado el 2026-10-23 por la constitución v4.0.0**: `PROGRAMAS` ya no existe; el programa es texto libre
- [x] T009 [US1] Implementar `valorDe(catalogo)` (Zod) en `packages/contracts/src/catalogos.ts`
- [x] T010 [US1] Implementar `estaEntre` y `coinciden` en `packages/contracts/src/comparar.ts` y `REQUISITOS_EXCLUYENTES = ["nivelFormacion", "programa"]` (FR-015, FR-017). Desde el 2026-10-23 (v4.0.0) es `["nivelFormacion"]`

## Fase 4: US2 · Los niveles con orden se comparan como «mínimo» (P1)

**Independent Test**: los 36 pares MCER dan el resultado esperado; `sem-6` cumple `sem-5`; `productiva` cumple `lectiva`; idioma no declarado y avance de otro nivel dan `falta_informacion`.

- [x] T011 [P] [US2] Prueba en `packages/contracts/src/comparar.test.ts`: `alMenos` con los 36 pares MCER (SC-002); `compararIdioma` con idioma no declarado → `falta_informacion` (US2-2); `compararAvance` dentro del mismo nivel y entre niveles distintos (US2-3, FR-009)
- [x] T012 [P] [US2] Prueba en `packages/contracts/src/catalogos.test.ts`: `avancesDe(nivel)` devuelve semestres 1.º–12.º para universitario y Lectiva/Productiva para técnico y tecnólogo; el refinamiento de idiomas rechaza un idioma repetido con «Ya agregaste este idioma.»
- [x] T013 [US2] Añadir `NIVELES_MCER` y `AVANCES` (con `niveles`) a `packages/contracts/src/catalogos.ts`, e implementar `avancesDe` y el refinamiento de idiomas sin repetir
- [x] T014 [US2] Implementar `alMenos`, `compararIdioma` y `compararAvance` en `packages/contracts/src/comparar.ts`

## Fase 5: US3 · El programa depende del nivel de formación (P2) — Retirada (constitución v4.0.0)

> El 2026-10-23 se quitaron las partes de programa de T015 y T016; solo queda el refinamiento avance-nivel.

**Independent Test**: cada nivel lista solo sus programas; un programa de otro nivel se rechaza con «Este programa no corresponde al nivel elegido.»

- [x] T015 [US3] Prueba en `packages/contracts/src/catalogos.test.ts`: `programasDe([nivel])` solo devuelve programas vigentes de ese nivel y `programasDe` con varios niveles los une; el refinamiento programa-nivel rechaza la combinación con el mensaje de US3-2; el refinamiento avance-nivel rechaza un avance que no aplica. **Partes de programa quitadas el 2026-10-23 (v4.0.0)**; queda la prueba de avance-nivel
- [x] T016 [US3] Implementar `programasDe(nivelIds)` y los refinamientos programa-nivel y avance-nivel en `packages/contracts/src/catalogos.ts`. **`programasDe` y `programaDelNivel` quitados el 2026-10-23 (v4.0.0)**; queda `avanceDelNivel`

## Fase 6: US4 · Ningún dato sensible se convierte en requisito (P2)

**Independent Test**: el conjunto de catálogos exportados es exactamente el de data-model.md.

- [x] T017 [US4] Prueba en `packages/contracts/src/catalogos.test.ts`: las constantes de catálogo exportadas por `packages/contracts/src/index.ts` son exactamente las 8 de data-model.md (7 desde el 2026-10-23, sin `PROGRAMAS`); ningún nombre de catálogo ni de valor menciona edad, sexo, género, estado civil, foto, etnia, religión ni discapacidad (FR-006, SC-006)

## Fase 7: Cierre

- [x] T018 Verificar desde la raíz: `npm run test -w @praxis/contracts`, `npm run build -w @praxis/contracts`, `npm run build -w api`, `npm run build -w web` y lint de contracts, según [quickstart.md](quickstart.md)
- [x] T019 Registrar el estado de M2 en `specs/004-catalogos-compartidos/estado.md` (el reemplazo por SNIES + SENA ya estaba en `docs/pendientes-constitucion.md`; obsoleto desde v4.0.0)

## Dependencias

- Fase 1 → Fase 2 → US1. US2, US3 y US4 dependen de US1 (las listas base) y son independientes entre sí.
- Dentro de cada historia: prueba (ver fallar) → implementación.
- M3, M4 y M5 dependen de este módulo completo.

## Paralelo

- US1: T005 y T006 (archivos de prueba distintos).
- US2: T011 y T012.
- Tras US1: US2, US3 y US4 en paralelo si hay varias personas; tocan las mismas dos fuentes, así que conviene coordinar los merges.

## Estrategia

MVP = Fases 1–3 (US1): listas base, validación y comparación por id. Bastan para empezar M4 (sector) y el
esqueleto de M3. Luego US2 (necesaria para requisitos de M5), US3 y US4.
