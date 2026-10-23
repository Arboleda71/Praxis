import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASE_PRUEBAS,
  validarBasePruebas,
} from "../apps/api/test/seguridad/base-pruebas.ts";
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
const conectarWompi = process.argv.includes("--wompi");
if (conectarWompi) {
  try {
    process.loadEnvFile(resolve(raiz, "apps/api/.env"));
  } catch {
    /* También admite variables del entorno. */
  }
  if (
    process.env.WOMPI_ENV !== "sandbox" ||
    !process.env.WOMPI_PUBLIC_KEY?.startsWith("pub_test_") ||
    !process.env.WOMPI_INTEGRITY_SECRET?.startsWith("test_integrity_") ||
    !process.env.WOMPI_EVENTS_SECRET?.startsWith("test_events_")
  )
    throw new Error(
      "Configura las tres llaves sandbox de Wompi; producción está bloqueada.",
    );
}
execFileSync(process.execPath, ["dist/main.js"], {
  cwd: resolve(raiz, "apps/api"),
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: validarBasePruebas(BASE_PRUEBAS),
    NODE_ENV: "development",
    PORT: String(puertoApi),
    WEB_URL: `http://localhost:${puertoWeb}`,
    RESEND_API_KEY: "",
    S3_BUCKET: "",
    WOMPI_ENV: "sandbox",
    WOMPI_PUBLIC_KEY: conectarWompi ? process.env.WOMPI_PUBLIC_KEY! : "",
    WOMPI_INTEGRITY_SECRET: conectarWompi
      ? process.env.WOMPI_INTEGRITY_SECRET!
      : "",
    WOMPI_EVENTS_SECRET: conectarWompi ? process.env.WOMPI_EVENTS_SECRET! : "",
    CORREOS_DIR: resolve(tmpdir(), "praxis-correos-e2e"),
    ARCHIVOS_DIR: resolve(tmpdir(), "praxis-archivos-e2e"),
    ARCHIVOS_SECRETO: randomBytes(32).toString("hex"),
  },
});
