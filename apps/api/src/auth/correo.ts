import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

/**
 * Envía el único correo del MVP: la confirmación de cuenta.
 * Con RESEND_API_KEY usa Resend; sin ella (desarrollo y pruebas) guarda el correo como archivo en
 * CORREOS_DIR. Nunca escribe el enlace en los logs (principio XIV).
 */
@Injectable()
export class Correo {
  async enviarConfirmacion(destino: string, token: string): Promise<void> {
    const enlace = `${process.env.WEB_URL ?? 'http://localhost:3000'}/confirmar-correo?token=${token}`;
    const html = [
      '<p>Hola:</p>',
      '<p>Confirma tu correo en Praxis abriendo este enlace. Vence en 24 horas y sirve una sola vez.</p>',
      `<p><a href="${enlace}">${enlace}</a></p>`,
      '<p>Si no creaste una cuenta en Praxis, ignora este mensaje.</p>',
    ].join('\n');

    const clave = process.env.RESEND_API_KEY;
    if (!clave) {
      if (process.env.NODE_ENV === 'production') throw new Error('Falta RESEND_API_KEY en producción.');
      const dir = process.env.CORREOS_DIR ?? '.correos';
      await mkdir(dir, { recursive: true });
      const id = createHash('sha256').update(destino).digest('hex');
      await writeFile(join(dir, `${process.hrtime.bigint()}-${id}.html`), html);
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CORREO_REMITENTE,
        to: destino,
        subject: 'Confirma tu correo en Praxis',
        html,
      }),
    });
    if (!res.ok) throw new Error(`Resend respondió ${res.status}.`);
  }
}
