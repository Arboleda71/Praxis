import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Aplica las migraciones a la base E2E y vacía la bandeja de correos antes de la corrida.
export default function migrar() {
  const url = process.env.E2E_DATABASE_URL ?? "postgresql://praxis:praxis@localhost:5432/praxis_e2e";
  execSync("npx prisma migrate deploy", { cwd: "../api", stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
  rmSync(join(tmpdir(), "praxis-correos-e2e"), { recursive: true, force: true });
}
