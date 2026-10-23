import { randomBytes } from 'node:crypto';
import { validarBasePruebas, BASE_PRUEBAS } from '../api/test/seguridad/base-pruebas';
import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const secreto = process.env.PRAXIS_TEST_CONTROL_SECRET ?? randomBytes(32).toString('hex');
process.env.PRAXIS_TEST_CONTROL_SECRET = secreto;
const WEB = 3100;
const API = 3101;
export const CORREOS_DIR = join(tmpdir(), "praxis-correos-e2e");
const ARCHIVOS_DIR = join(tmpdir(), "praxis-archivos-e2e");
const DATABASE_URL = validarBasePruebas(process.env.E2E_DATABASE_URL ?? BASE_PRUEBAS);

const movil = { ...devices["Desktop Chrome"], viewport: { width: 360, height: 740 } };
const escritorio = { ...devices["Desktop Chrome"], viewport: { width: 1080, height: 800 } };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  // Cada prueba hace un barrido de accesibilidad con axe: pesan. Con más en paralelo se
  // estorban entre ellas y se agota el tiempo de las pruebas.
  workers: 1,
  timeout: 60_000,
  // En un portátil cargado, una navegación puede tardar más que los 5 s que Playwright espera.
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  globalSetup: "./e2e/migrar.ts",
  use: { extraHTTPHeaders: { Origin: `http://localhost:${WEB}` }, baseURL: `http://localhost:${WEB}`, trace: "retain-on-failure" },
  projects: [
    { name: "movil-360", use: movil, testIgnore: /bloqueo/ },
    { name: "escritorio", use: escritorio, testIgnore: /bloqueo/ },
    // Bloquea la IP local 15 minutos: corre al final, sola.
    { name: "bloqueo", use: escritorio, testMatch: /bloqueo/, dependencies: ["movil-360", "escritorio"] },
  ],
  webServer: [
    {
      command: "npm run build -w api && node apps/api/test/servidor.ts",
      cwd: "../..",
      port: API,
      reuseExistingServer: false,
      timeout: 180_000,
      env: { NODE_ENV: "test", PRAXIS_TEST_CONTROL_SECRET: secreto, PORT: String(API), DATABASE_URL, CORREOS_DIR, ARCHIVOS_DIR, S3_BUCKET: "", RESEND_API_KEY: "", WEB_URL: `http://localhost:${WEB}` },
    },
    {
      // Compilación de producción: en modo dev, Next compila cada ruta al primer acceso y las
      // pruebas se agotan esperando. Construir una vez cuesta menos que esas esperas.
      command: `npx next build && npx next start --port ${WEB}`,
      url: `http://localhost:${WEB}`,
      reuseExistingServer: false,
      timeout: 300_000,
      env: { API_URL: `http://localhost:${API}`, WEB_URL: `http://localhost:${WEB}` },
    },
  ],
});

