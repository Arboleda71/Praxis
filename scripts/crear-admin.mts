/** Alta operativa autorizada. No hay endpoint de registro de administradores.
 * ADMIN_CORREO y ADMIN_CONTRASENA se reciben desde el entorno, nunca como argumentos.
 * Ejecutar después de migrar y compilar la API. No imprime credenciales.
 */
import { resolve } from 'node:path';
import { hash } from '@node-rs/argon2';
import { loginSchema } from '@praxis/contracts';
try { process.loadEnvFile(resolve('apps/api/.env')); } catch { /* Entorno del despliegue. */ }
const datos = loginSchema.safeParse({ correo: process.env.ADMIN_CORREO, contrasena: process.env.ADMIN_CONTRASENA });
if (!datos.success || datos.data.contrasena.length < 16) {
  console.error('Configura ADMIN_CORREO y ADMIN_CONTRASENA (mínimo 16 caracteres) en el entorno. No los pases por argumentos.');
  process.exitCode = 1;
} else {
  const modulo = '../apps/api/dist/prisma.service.js';
  const { PrismaService } = await import(modulo);
  const db = new PrismaService();
  try {
    if (await db.cuenta.findUnique({ where: { correo: datos.data.correo } })) throw new Error('La cuenta ya existe. El alta no modifica ni promueve cuentas existentes.');
    await db.cuenta.create({ data: { correo: datos.data.correo, contrasenaHash: await hash(datos.data.contrasena), rol: 'ADMIN', correoConfirmadoEn: new Date(), autorizacionDatosEn: new Date() } });
    console.log('Administrador creado. Inicia sesión por el formulario habitual.');
  } catch { console.error('No se pudo crear el administrador. Comprueba conexión, migraciones y que el correo no exista.'); process.exitCode = 1; }
  finally { await db.$disconnect(); }
}
