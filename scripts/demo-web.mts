import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const puertoWeb = Number(process.env.PRAXIS_DEMO_WEB_PORT ?? 3000);
const puertoApi = Number(process.env.PRAXIS_DEMO_API_PORT ?? 3001);
if (
  [puertoWeb, puertoApi].some(
    (p) => !Number.isInteger(p) || p < 1024 || p > 65535,
  ) ||
  puertoWeb === puertoApi
)
  throw new Error("Elige puertos locales distintos entre 1024 y 65535.");
const require = createRequire(import.meta.url);
const opciones = {
  cwd: resolve(raiz, "apps/web"),
  stdio: "inherit" as const,
  env: {
    ...process.env,
    API_URL: `http://localhost:${puertoApi}`,
    WEB_URL: `http://localhost:${puertoWeb}`,
  },
};
const next = require.resolve("next/dist/bin/next");
execFileSync(process.execPath, [next, "build"], opciones);
execFileSync(
  process.execPath,
  [next, "start", "--port", String(puertoWeb), "--hostname", "127.0.0.1"],
  opciones,
);
