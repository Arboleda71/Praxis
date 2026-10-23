import { test } from 'node:test';
import assert from 'node:assert/strict';
const { validarBasePruebas } = await import(
  new URL('./base-pruebas.ts', import.meta.url).href
);

await test('acepta exclusivamente Postgres local aislado en puerto 55432', () => {
  const url =
    'postgresql://praxis_test:praxis_test@127.0.0.1:55432/praxis_test';
  assert.equal(validarBasePruebas(url), url);
});
for (const url of [
  undefined,
  '',
  'no-url',
  'postgresql://u:p@ep-example.neon.tech:55432/praxis_test',
  'postgresql://u:p@localhost:5432/praxis_test',
  'postgresql://u:p@127.0.0.1:55432/praxis',
  'postgresql://u:p@127.0.0.1:55432/praxis_test?host=neon.tech',
  'postgresql://u:p@127.0.0.1:55432/praxis_test#fragment',
  'mysql://u:p@127.0.0.1:55432/praxis_test',
]) {
  await test(`rechaza destino inseguro ${String(url).replace(/:\/\/.*@/, '://***@')}`, () => {
    assert.throws(() => validarBasePruebas(url), /Base de pruebas insegura/);
  });
}
