/** Cuentas públicas exclusivamente para la base local de demo. Nunca exporta cuentas personales. */
import pg from 'pg';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { digitoVerificacion } from '@praxis/contracts';
import { BASE_DEMO, validarBasePruebas } from '../apps/api/test/seguridad/base-pruebas.ts';

export const CUENTAS_DEMO = [
  { correo: 'estudiante@demo.praxis.test', rol: 'ESTUDIANTE', nombre: 'Estudiante Demo' },
  { correo: 'empresa@demo.praxis.test', rol: 'EMPRESA', nombre: 'Empresa Demo Praxis S.A.S.' },
] as const;
export const CONTRASENA_DEMO = 'PraxisDemo2026!';

export async function crearCuentasDemo(url = BASE_DEMO) {
  validarBasePruebas(url, 'praxis_demo');
  if (process.env.NODE_ENV === 'production') throw new Error('Las cuentas públicas de demo no se crean en producción.');
  const cliente = new pg.Client({ connectionString: url });
  await cliente.connect();
  try {
    const contrasenaHash = await hash(CONTRASENA_DEMO);
    await cliente.query('BEGIN');
    for (const cuenta of CUENTAS_DEMO) {
      const id = randomUUID();
      const creada = await cliente.query(
        'INSERT INTO "Cuenta" (id, correo, "contrasenaHash", rol, "correoConfirmadoEn", "autorizacionDatosEn", "creadaEn") VALUES ($1,$2,$3,$4,NOW(),NOW(),NOW()) ON CONFLICT (correo) DO NOTHING RETURNING id',
        [id, cuenta.correo, contrasenaHash, cuenta.rol],
      );
      // Repetir la preparación no restablece contraseñas, perfiles ni sesiones existentes.
      if (!creada.rowCount) continue;
      if (cuenta.rol === 'ESTUDIANTE') {
        await cliente.query('INSERT INTO "Estudiante" ("cuentaId", "nombreCompleto") VALUES ($1,$2)', [id, cuenta.nombre]);
      } else {
        const nit = '900999998';
        await cliente.query('INSERT INTO "Empresa" ("cuentaId", "razonSocial", nit, dv) VALUES ($1,$2,$3,$4)', [id, cuenta.nombre, nit, digitoVerificacion(nit)]);
      }
    }
    await cliente.query('COMMIT');
    console.log('Cuentas públicas de demo disponibles. Las demás cuentas no se modificaron.');
  } catch (e) {
    await cliente.query('ROLLBACK');
    throw e;
  } finally { await cliente.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await crearCuentasDemo(); }
  catch { console.error('No se pudieron preparar las cuentas demo. Ejecuta npm run demo:db y comprueba que no exista un NIT reservado en conflicto.'); process.exitCode = 1; }
}
