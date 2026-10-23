import { validarConfiguracion } from './seguridad.js';
import { Archivos } from './perfil/archivos.js';
describe('configuración segura al arrancar', () => {
  it('rechaza producción sin las variables de seguridad', () => {
    expect(() =>
      validarConfiguracion({
        NODE_ENV: 'production',
        ARCHIVOS_SECRETO: 'ficticio',
      }),
    ).toThrow('DATABASE_URL');
  });
  it('rechaza un entorno de pagos real incluso en desarrollo', () => {
    expect(() => validarConfiguracion({ WOMPI_ENV: 'production' })).toThrow(
      'sandbox',
    );
  });
  it('no firma archivos locales con un secreto público por omisión', () => {
    const secreto = process.env.ARCHIVOS_SECRETO;
    const bucket = process.env.S3_BUCKET;
    delete process.env.ARCHIVOS_SECRETO;
    delete process.env.S3_BUCKET;
    try {
      expect(() => new Archivos()).toThrow('ARCHIVOS_SECRETO');
    } finally {
      if (secreto !== undefined) process.env.ARCHIVOS_SECRETO = secreto;
      if (bucket !== undefined) process.env.S3_BUCKET = bucket;
    }
  });
});
