import { BLOQUEO_MS, Intentos, MAX_INTENTOS } from './intentos.js';

describe('Intentos', () => {
  let ahora = 0;
  const reloj = () => ahora;

  beforeEach(() => {
    ahora = 1_000_000;
  });

  it('bloquea al quinto fallo seguido', () => {
    const i = new Intentos(reloj);
    for (let n = 1; n < MAX_INTENTOS; n++) i.fallo('a@b.co');
    expect(i.bloqueado('a@b.co')).toBe(false);
    i.fallo('a@b.co');
    expect(i.bloqueado('a@b.co')).toBe(true);
  });

  it('el bloqueo dura 15 minutos desde el último fallo', () => {
    const i = new Intentos(reloj);
    for (let n = 0; n < MAX_INTENTOS; n++) i.fallo('ip');
    ahora += BLOQUEO_MS - 1;
    expect(i.bloqueado('ip')).toBe(true);
    ahora += 1;
    expect(i.bloqueado('ip')).toBe(false);
  });

  it('un acierto limpia los fallos de esa clave', () => {
    const i = new Intentos(reloj);
    for (let n = 0; n < MAX_INTENTOS - 1; n++) i.fallo('a@b.co');
    i.exito('a@b.co');
    i.fallo('a@b.co');
    expect(i.bloqueado('a@b.co')).toBe(false);
  });

  it('fallos viejos no cuentan', () => {
    const i = new Intentos(reloj);
    for (let n = 0; n < MAX_INTENTOS - 1; n++) i.fallo('ip');
    ahora += BLOQUEO_MS;
    i.fallo('ip');
    expect(i.bloqueado('ip')).toBe(false);
  });

  it('bloquea si cualquiera de las claves lo está', () => {
    const i = new Intentos(reloj);
    for (let n = 0; n < 30; n++) i.fallo('ip:1');
    expect(i.bloqueado('a@b.co', 'ip:1')).toBe(true);
  });
});
