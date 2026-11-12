import { prepararBase } from "../../api/test/seguridad/base-libre";
import {
  validarBasePruebas,
  BASE_E2E,
} from "../../api/test/seguridad/base-pruebas";
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Crea la base E2E si falta, aplica las migraciones y vacía la bandeja de correos antes de la corrida.
export default async function migrar() {
  const url = validarBasePruebas(
    process.env.E2E_DATABASE_URL ?? BASE_E2E,
    "praxis_e2e",
  );
  // No se exige que esté libre: Playwright arranca su API antes de este paso y puede estar ya conectada.
  // Dos corridas a la vez ya chocan en los puertos fijos (`reuseExistingServer: false`).
  await prepararBase(url, false);
  execSync("npx prisma migrate deploy", {
    cwd: "../api",
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
  rmSync(join(tmpdir(), "praxis-correos-e2e"), {
    recursive: true,
    force: true,
  });
}
