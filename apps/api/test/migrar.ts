import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

export default async function migrar() {
  const moduloGuarda = './seguridad/base-pruebas.ts';
  const { validarBasePruebas, BASE_PRUEBAS } = await import(moduloGuarda);
  // Validar antes de iniciar Prisma o cargar su configuración.
  const url = validarBasePruebas(process.env.TEST_DATABASE_URL ?? BASE_PRUEBAS);
  const require = createRequire(join(process.cwd(), 'package.json'));
  execFileSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
    {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: url },
    },
  );
}

