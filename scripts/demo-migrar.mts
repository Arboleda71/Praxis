import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prepararBase } from "../apps/api/test/seguridad/base-libre.ts";
import {
  BASE_DEMO,
  validarBasePruebas,
} from "../apps/api/test/seguridad/base-pruebas.ts";
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const url = validarBasePruebas(BASE_DEMO, "praxis_demo");
// La demo tiene su propia base: las pruebas no le borran los datos ni ella les cambia los contadores.
// No se exige que esté libre: migrar con la demo abierta es válido.
await prepararBase(url, false);
execFileSync(
  process.execPath,
  [require.resolve("prisma/build/index.js"), "migrate", "deploy"],
  {
    cwd: resolve(raiz, "apps/api"),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  },
);
