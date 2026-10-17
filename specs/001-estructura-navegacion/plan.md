# Implementation Plan: Estructura y navegación

**Branch**: `001-estructura-navegacion` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md)
**Mockups**: `docs/praxis-mockups.pen`, sección «M0 · Estructura y navegación» (aprobado el 2026-10-16)

## Summary

Esqueleto común de `apps/web`: cabecera pública y por rol, navegación inferior en móvil, menú de cuenta, pie,
inicio, páginas «no encontrada» y «sin acceso», y protección de las secciones por rol. Solo web; la API no cambia.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node.js 24
**Primary Dependencies**: Next.js 16 (App Router), React 19, MUI 9.4 + `@mui/icons-material` 9.4, Tailwind 4
**Storage**: N/A (la sesión real llega en M1)
**Testing**: Vitest + Testing Library (unitarias web), Playwright + axe (E2E). La API usa Jest (constitución v1.2.0); M0 no la toca
**Target Platform**: navegadores modernos, 360 px a escritorio
**Performance Goals**: LCP < 2,5 s en 4G
**Constraints**: WCAG 2.1 AA, solo español, mobile-first

## Constitution Check

| Principio | Cumple | Cómo |
|---|---|---|
| I. Práctica, no empleo | Sí | Textos del inicio hablan de prácticas y aclaran que no es bolsa de empleo |
| VI. Mínimo acceso | Sí | Secciones por rol; otro rol ve «sin acceso» sin datos de la sección |
| IX. Honestidad | Sí | Sin cifras ni convenios inventados; pie dice «Proyecto académico · datos ficticios» |
| X. Accesible | Sí | Saltar al contenido, foco visible, sección actual con indicador + `aria-current`, axe en E2E |
| XI. MVP primero | Sí | Solo navegación; el contenido de cada sección es de su módulo |
| XII. Simplicidad | Sí | MUI directo, sin wrappers; sin proxy ni librerías de auth |
| XIV. Seguridad | Sí | La sesión simulada solo existe fuera de producción; `next` de retorno solo acepta rutas internas |

## Decisiones

- **Sesión simulada (solo desarrollo y E2E):** cookie `praxis_demo_session` con el rol. `getSession()` la ignora en
  producción. M1 la reemplaza por la sesión real de la API sin tocar la navegación.
- **Protección por rol:** cada página de sección llama `requireRole(rol, ruta)`: sin sesión redirige a
  `/ingresar?next=<ruta>`; con otro rol muestra «sin acceso». Sin `proxy.ts` ni `forbidden()` (experimental).
- **Enlaces:** el tema define `LinkComponent = next/link` para `ButtonBase` y `Link`, así `<Button href>` navega
  en cliente desde Server Components.
- **Tema:** `textTransform: none`, `secondary.contrastText = #0B1F4B`, `warning.main = #B45309`, títulos en
  Poppins 600 con interlineado 1,3.

## Project Structure

```text
apps/web/src/
├── app/
│   ├── layout.tsx            # cabecera, main#contenido, pie, barra inferior
│   ├── page.tsx              # inicio
│   ├── not-found.tsx
│   ├── ingresar/ registro/ politica-de-datos/   # marcadores de M1
│   ├── estudiante/perfil/    # marcador de M3, protegido
│   └── empresa/{perfil,vacantes}/  # marcadores de M4 y M5, protegidos
├── components/               # Logo, SiteHeader, NavTabs, AccountMenu, BottomNav, SiteFooter, Aviso
└── lib/                      # session.ts, actions.ts, nav.ts
apps/web/e2e/                 # Playwright + axe
```

## Complexity Tracking

| Adición | Por qué | Alternativa descartada |
|---|---|---|
| `@mui/icons-material` | Iconos oficiales de MUI que usa el diseño aprobado (≈ 12 iconos) | Copiar los SVG a mano: más código propio que mantener |
| Páginas marcador de M1/M3/M4/M5 | La navegación y la protección por rol necesitan destinos reales para probarse | Enlaces rotos hasta que exista cada módulo |
