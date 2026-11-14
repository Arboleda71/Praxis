import { test } from 'node:test';
import { rejects } from 'node:assert/strict';
import { crearCuentasDemo } from './demo-cuentas.mts';
test('el seed rechaza bases remotas y otras bases locales antes de conectar', async () => {
  for (const url of ['postgresql://example.test/praxis_demo', 'postgresql://localhost:5432/praxis', 'postgresql://127.0.0.1:55432/praxis_test'])
    await rejects(crearCuentasDemo(url), /Base de pruebas insegura/);
});
test('el seed no admite ejecución en producción', async () => {
  const anterior = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try { await rejects(crearCuentasDemo(), /no se crean en producción/); }
  finally { if (anterior === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = anterior; }
});
