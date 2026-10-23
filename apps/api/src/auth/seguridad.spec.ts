import { Intentos } from './intentos.js';
import { opcionesCookie } from './sesion.js';

describe('spec 003: reservas y ventanas', () => {
  it('reserva antes del await: solo cinco de cincuenta llegan a verificar', () => {
    const i = new Intentos();
    const aceptados = Array.from({ length: 50 }, () =>
      i.reservar('correo:a', 'ip:1'),
    );
    expect(aceptados.filter(Boolean)).toHaveLength(5);
  });
  it('un acierto libera la cuenta pero conserva el contador del origen', () => {
    const i = new Intentos();
    for (let n = 0; n < 29; n++) i.fallo('ip:1');
    expect(i.reservar('correo:correcto', 'ip:1')).toBe(true);
    i.exito('correo:correcto', 'ip:1');
    expect(i.reservar('correo:ultimo', 'ip:1')).toBe(true);
    expect(i.reservar('correo:otra', 'ip:1')).toBe(false);
  });
  it('limita los registros a diez por hora y descarta ventanas vencidas', () => {
    let ahora = 0;
    const i = new Intentos(() => ahora);
    for (let n = 0; n < 10; n++) expect(i.registro('ip:1')).toBe(true);
    expect(i.registro('ip:1')).toBe(false);
    ahora = 3_600_001;
    expect(i.registro('ip:1')).toBe(true);
  });
  it('la cookie siempre es Secure, httpOnly y SameSite', () => {
    expect(opcionesCookie()).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });
  });
});
