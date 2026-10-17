import { execSync } from 'node:child_process';

// Aplica las migraciones versionadas a la base de pruebas antes de la corrida.
export default function migrar() {
  const url = process.env.TEST_DATABASE_URL ?? 'postgresql://praxis:praxis@localhost:5432/praxis_test';
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: url } });
}
