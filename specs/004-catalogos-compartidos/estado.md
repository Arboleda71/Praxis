# Estado de M2 · Catálogos compartidos

> Verificación local: 2026-10-23, America/Bogota. Falta CI (no existe `.github`, ver `docs/pendientes-mvp.md` PM012)
> y la revisión por PR de otro integrante.

## Hecho y verificado localmente

| Parte | Verificación |
|---|---|
| Pruebas: `npm run test -w @praxis/contracts` | 60 aprobadas en 4 archivos: 42 nuevas de M2 y 18 existentes |
| Prueba primero (XIII) | Las dos suites nuevas se vieron fallar (módulos inexistentes) antes de escribir el código |
| Build: contracts, `api` y `web` | Los tres aprobados; la web incluye verificación de tipos |
| Lint: `api`, `web` y oxlint sobre `packages/contracts/src` | Sin errores; sigue solo la advertencia existente de `nit.ts` |

## Archivos

- `packages/contracts/src/catalogos.ts`: 7 catálogos (8 hasta el 2026-10-23), consultas, `valorDe`,
  `idiomasSchema`, `MENSAJES_CATALOGO`.
- `packages/contracts/src/comparar.ts`: `estaEntre`, `coinciden`, `alMenos`, `compararIdioma`, `compararAvance`,
  `REQUISITOS_EXCLUYENTES`, `programasSolicitadosSchema`, `PROGRAMA_REVISA_EMPRESA`.
- Selectores en `docs/praxis-mockups.pen`, Componentes › «Selectores de catálogo (M2)».

## Notas para M3, M4 y M5

- Se guarda el `id`; se muestra `nombreDe(...)`. Los valores retirados no se borran nunca.
- El refinamiento avance-nivel es un predicado (`avanceDelNivel`): cada esquema de M3/M5 lo engancha con
  `.check()`, usando los textos de `MENSAJES_CATALOGO`. (El de programa-nivel se quitó el 2026-10-23.)
- Abierto: editar un perfil que conserva un valor retirado (`valorDe` lo rechazaría). Lo decide la spec de M3.
- `alMenos` lanza un error si recibe un id fuera del catálogo: los datos deben pasar antes por `valorDe`.

## Cambio 2026-10-23: programa en texto libre

- Constitución v4.0.0: se retiran `PROGRAMAS`, `programasDe`, `programaDelNivel` y
  `MENSAJES_CATALOGO.programaDeOtroNivel`; quedan 7 catálogos.
- `comparar.ts` suma `programasSolicitadosSchema` (1 a 5, texto libre, sin repetidos) y `PROGRAMA_REVISA_EMPRESA`;
  `REQUISITOS_EXCLUYENTES = ["nivelFormacion"]`.
- US3 (programa por nivel) y SC-005 quedan retirados; sigue el refinamiento avance-nivel.
- Pruebas de contracts a hoy: 78 aprobadas (incluye las de M3).

## Entorno

- Tras alinear `main` hubo que repetir `npm install` en la raíz (faltaba `vitest`). No cambió el lockfile.
- `next build` fallaba por tipos viejos en `apps/web/.next/dev/types` que citaban `mui-demo`, página borrada en
  `development`. Se borró esa caché (ignorada por git) y el build pasó.
