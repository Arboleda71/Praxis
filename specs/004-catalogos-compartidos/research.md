# Research: Catálogos compartidos

No quedaron puntos «NEEDS CLARIFICATION»: la spec ya resolvió las preguntas abiertas de `docs/modulos.md`
(avance por nivel en FR-009, semilla ficticia de programas en FR-008). La semilla quedó obsoleta el 2026-10-23:
la constitución v4.0.0 saca el programa de los catálogos (texto libre; ver §6).

## 1. Dónde viven los catálogos

- **Decision**: constantes en `packages/contracts/src/catalogos.ts`.
- **Rationale**: FR-002 pide una única fuente para la web y la API, y `contracts` ya cumple ese papel. Sin panel
  de administración (supuesto de la spec), los cambios los hace el equipo en el código, con revisión por PR.
- **Alternatives considered**: tablas en Postgres + `GET /catalogos`: migración, seed, endpoint y caché en la web
  para listas que no cambian sin un despliegue. Se retoma cuando exista el administrador.

## 2. Identidad y valores retirados

- **Decision**: cada valor tiene un `id` en kebab-case (`tecnologo`, `ingles`, `b1`, `sem-6`) que nunca cambia ni
  se reutiliza. Retirar = `retirado: true`; nunca se borra un valor.
- **Rationale**: FR-003/FR-004. Corregir una tilde cambia `nombre` y no rompe nada guardado. El valor retirado
  sigue disponible para mostrar su nombre, pero los esquemas Zod de elección nueva no lo aceptan.
- **Alternatives considered**: ids numéricos (ilegibles en la base y en los logs de pruebas); usar el nombre como
  id (una tilde rompería las comparaciones).
- **Pendiente para M3/M5**: editar un perfil que conserva un valor retirado. Lo decide la spec del módulo que edita.

## 3. Reglas de comparación

- **Decision**: funciones puras que devuelven `"cumple" | "no_cumple" | "falta_informacion"`:
  `estaEntre` (nivel), `coinciden` (jornada), `alMenos` (MCER, avance), `compararIdioma`,
  `compararAvance`. Declarado vacío → `falta_informacion` (FR-016).
- **Rationale**: FR-015; la elegibilidad (fase posterior) solo las compone. Que un requisito sea excluyente o
  deseable no lo decide la regla sino `REQUISITOS_EXCLUYENTES` (FR-017), que usará la elegibilidad.
- **Alternatives considered**: un motor genérico de reglas: más código que las cinco funciones juntas.

## 4. Búsqueda sin tildes (FR-018)

- **Decision**: ningún código en M2. El selector de M3/M5 usa `Autocomplete` de MUI, cuyo `createFilterOptions`
  ignora tildes y mayúsculas por defecto (`ignoreAccents`, `ignoreCase`).
- **Rationale**: función nativa de una dependencia ya instalada.
- **Alternatives considered**: normalizar con `String.prototype.normalize` en contracts: duplicaría lo que MUI ya hace.

## 5. Ciudad

- **Decision**: no es catálogo (FR-010). M4 y M5 la piden como texto informativo; M2 no exporta nada para ella.

## 6. Programa en texto libre (constitución v4.0.0, 2026-10-23)

- **Decision**: se retira `PROGRAMAS` (con `programasDe`, `programaDelNivel` y `MENSAJES_CATALOGO.programaDeOtroNivel`).
  El estudiante escribe su programa; la vacante solicita de 1 a 5 programas con `programasSolicitadosSchema`
  (sin repetidos ignorando tildes y mayúsculas) y la web los muestra con `PROGRAMA_REVISA_EMPRESA`.
  `REQUISITOS_EXCLUYENTES = ["nivelFormacion"]`.
- **Rationale**: los programas reales (SNIES, SENA, extranjeros) no caben en un catálogo mantenido por Praxis.
- **Alternatives considered**: reemplazar la semilla por el SNIES + SENA (el pendiente anterior): mantenimiento
  continuo y aun así incompleto.
