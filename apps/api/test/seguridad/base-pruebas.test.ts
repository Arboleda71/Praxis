import { test } from 'node:test';
import assert from 'node:assert/strict';
const { validarBasePruebas, BASE_PRUEBAS, BASE_E2E, BASE_DEMO } = await import(
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

// Una base por uso: integración, navegador y demo no comparten datos ni contadores.
await test('cada uso tiene su base y las tres son distintas', () => {
  assert.equal(new Set([BASE_PRUEBAS, BASE_E2E, BASE_DEMO]).size, 3);
  assert.equal(validarBasePruebas(BASE_PRUEBAS), BASE_PRUEBAS);
  assert.equal(validarBasePruebas(BASE_E2E, 'praxis_e2e'), BASE_E2E);
  assert.equal(validarBasePruebas(BASE_DEMO, 'praxis_demo'), BASE_DEMO);
});
for (const [url, base] of [
  [BASE_E2E, 'praxis_test'],
  [BASE_DEMO, 'praxis_test'],
  [BASE_PRUEBAS, 'praxis_e2e'],
  [BASE_DEMO, 'praxis_e2e'],
  [BASE_PRUEBAS, 'praxis_demo'],
  [BASE_E2E, 'praxis_demo'],
]) {
  await test(`quien espera ${base} rechaza ${new URL(url).pathname}`, () => {
    assert.throws(
      () => validarBasePruebas(url, base),
      new RegExp(`Base de pruebas insegura.*/${base},`),
    );
  });
}
