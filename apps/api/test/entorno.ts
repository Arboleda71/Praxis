import { validarBasePruebas, BASE_PRUEBAS } from './seguridad/base-pruebas.js';
// Las pruebas de integración usan una base aparte y una bandeja de correos temporal.
import { join } from 'node:path';
import { tmpdir } from 'node:os';

process.env.DATABASE_URL = validarBasePruebas(process.env.TEST_DATABASE_URL ?? BASE_PRUEBAS);
process.env.CORREOS_DIR = join(tmpdir(), 'praxis-correos-pruebas');
process.env.RESEND_API_KEY = '';
process.env.ARCHIVOS_DIR = join(tmpdir(), 'praxis-archivos-pruebas');
process.env.ARCHIVOS_SECRETO = 'secreto-de-pruebas';
process.env.S3_BUCKET = '';
