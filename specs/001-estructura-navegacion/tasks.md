# Tasks: Estructura y navegación

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Fase 1: Base

- [x] T001 Instalar `@mui/icons-material`, Vitest, Testing Library, Playwright y axe en `apps/web` (desde la raíz)
- [x] T002 Configurar `apps/web/vitest.config.mts` y `apps/web/playwright.config.ts`; scripts `test` y `test:e2e`
- [x] T003 Ajustar `apps/web/src/app/theme.ts` (botones, contraste, warning, títulos, enlaces con `next/link`)

## Fase 2: Lógica (prueba primero)

- [x] T004 [P] Prueba `nav.test.ts`: destinos por rol y destino actual (incluye «ninguno»)
- [x] T005 [P] Prueba `session.test.ts`: rol simulado válido/ inválido y ruta de retorno segura
- [x] T006 Implementar `src/lib/nav.ts` y `src/lib/session.ts`

## Fase 3: US1 visitante (P1)

- [x] T007 `Logo`, `SiteHeader` público, `SiteFooter`, enlace «Saltar al contenido» en `layout.tsx`
- [x] T008 Página de inicio `src/app/page.tsx` según el mockup
- [x] T009 E2E: inicio a 360 px y escritorio, teclado, sin scroll horizontal, axe

## Fase 4: US2 navegación por rol (P2)

- [x] T010 `NavTabs`, `AccountMenu`, `BottomNav` y acciones de cerrar sesión
- [x] T011 Páginas marcador protegidas con `requireRole`
- [x] T012 Prueba `BottomNav.test.tsx`
- [x] T013 E2E: cabecera por rol, barra inferior, cerrar sesión, axe

## Fase 5: US3 errores (P3)

- [x] T014 `Aviso`, `not-found.tsx` y «sin acceso»
- [x] T015 E2E: 404, sin acceso, redirección a ingresar con retorno

## Fase 6: Cierre

- [x] T016 Lint, tipos, pruebas y build en verde
