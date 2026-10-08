# Monorepo: dependencias con npm workspaces

## La regla

En este monorepo hay **un solo `package-lock.json` y un solo `node_modules`, ambos en la raíz** (`praxis_portal/`).
Las apps (`apps/web`, `apps/api`) **no** deben tener lockfile propio.

```
praxis_portal/
├─ package.json          ← "workspaces": ["apps/*"]
├─ package-lock.json     ← el ÚNICO lockfile
├─ node_modules/         ← dependencias de todas las apps
└─ apps/
   ├─ web/   (sin package-lock.json)
   └─ api/   (sin package-lock.json)
```

## Por qué importa (el problema que tuvimos)

`apps/web` se creó con `create-next-app`, que la instaló como proyecto independiente: tenía su propio
`node_modules` y su propio `package-lock.json`. Eso causa:

- **Versiones distintas entre compañeros.** En un workspace, npm ignora el lockfile de `apps/web` y solo
  lee el de la raíz. Uno instala una versión, otro instala otra: "en mi máquina funciona".
- **Versiones distintas entre apps.** Node busca paquetes primero en `apps/web/node_modules` y luego en
  la raíz, así que puede usar una versión distinta de la que crees.
- **React duplicado.** Dos copias de React dan el error `Invalid hook call`.
- **Comandos raros desde la raíz.** `npm run dev` o `npm run lint -w web` fallan o usan dependencias equivocadas.

## Qué hacer siempre

| Quiero…                          | Comando (desde la raíz)            |
|----------------------------------|------------------------------------|
| Instalar todo                    | `npm install`                      |
| Añadir dependencia a web         | `npm install zod -w web`           |
| Añadir dependencia de dev a web  | `npm install -D vitest -w web`     |
| Añadir dependencia a api         | `npm install @nestjs/config -w api`|
| Quitar dependencia               | `npm uninstall zod -w web`         |
| Ejecutar un script de una app    | `npm run dev -w web`               |

`-w web` usa el campo `name` del `package.json` de la app. También vale la ruta: `-w apps/web`.

**Nunca** ejecutes `npm install` dentro de `apps/web` o `apps/api`: eso vuelve a crear un lockfile propio.

## Al crear una app nueva

Los generadores (`create-next-app`, `nest new`, etc.) instalan por su cuenta. Evítalo:

```powershell
# NestJS
cd apps
npx @nestjs/cli new api --skip-install --package-manager npm
cd ..
npm install
```

Si el generador no tiene opción para saltarse la instalación, borra lo que cree y reinstala desde la raíz
(ver abajo).

## Cómo arreglarlo si vuelve a pasar (PowerShell)

Cierra antes `next dev` y el editor (pueden bloquear archivos). Ejemplo con `apps/web`:

```powershell
cd C:\Users\Wesley\Documents\proyects\praxis\praxis_portal
Remove-Item -Recurse -Force apps\web\node_modules, apps\web\.next
Remove-Item -Force apps\web\package-lock.json
npm install
```

Comprueba:

```powershell
Test-Path apps\web\package-lock.json   # debe dar False
npm ls react                            # una sola versión; el resto "deduped"
```

Es normal que exista un `apps/web/node_modules` pequeño (por ejemplo, solo con `.bin`).
Lo que **no** debe existir es `apps/web/package-lock.json`.

## Cosas a tener en cuenta

- El `package.json` de la raíz necesita `"private": true` para que funcionen los workspaces.
- Sube `package-lock.json` (el de la raíz) a git. **No** subas `node_modules`.
- No uses `npm audit fix --force` a ciegas: puede subir versiones mayores (por ejemplo, de Next) y romper
  la app. Mira primero `npm audit`.
