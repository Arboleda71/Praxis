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
  it('producción exige el secreto del proxy: sin él todos compartirían un origen (spec 011)', () => {
    const base = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://ficticia',
      WEB_URL: 'https://praxis.test',
      RESEND_API_KEY: 're_ficticia',
      CORREO_REMITENTE: 'no-responder@praxis.test',
      S3_BUCKET: 'ficticio',
      S3_ACCESS_KEY_ID: 'ficticio',
      S3_SECRET_ACCESS_KEY: 'ficticio',
    };
    expect(() => validarConfiguracion(base)).toThrow('PROXY_SECRETO');
    expect(() =>
      validarConfiguracion({ ...base, PROXY_SECRETO: 'corto' }),
    ).toThrow('PROXY_SECRETO');
    expect(() =>
      validarConfiguracion({ ...base, PROXY_SECRETO: 'x'.repeat(32) }),
    ).not.toThrow();
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
