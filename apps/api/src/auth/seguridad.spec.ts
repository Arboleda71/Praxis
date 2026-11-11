import { opcionesCookie } from './sesion.js';

// Los límites de intentos se prueban contra Postgres real en test/intentos.e2e-spec.ts (spec 011).
describe('spec 003: cookie de sesión', () => {
  it('la cookie siempre es Secure, httpOnly y SameSite', () => {
    expect(opcionesCookie()).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });
  });
});
