import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASE_PRUEBAS,
  validarBasePruebas,
} from "../apps/api/test/seguridad/base-pruebas.ts";
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const url = validarBasePruebas(BASE_PRUEBAS);
execFileSync(
  process.execPath,
  [require.resolve("prisma/build/index.js"), "migrate", "deploy"],
  {
    cwd: resolve(raiz, "apps/api"),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  },
);
