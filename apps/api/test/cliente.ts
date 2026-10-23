import supertest from 'supertest';
import type { Test, Response } from 'supertest';

/** Supertest HTTP no almacena Secure: transporte explícito solo en este cliente de pruebas. */
function agente(app: Parameters<typeof supertest>[0]) {
  let cookie = '';
  return supertest.agent(app).use((req: Test) => {
    req.set('Origin', 'http://localhost:3000');
    if (cookie) req.set('Cookie', cookie);
    req.on('response', (res: Response) => {
      const cabecera = res.headers['set-cookie'];
      const primera = Array.isArray(cabecera) ? String(cabecera[0]) : cabecera;
      if (primera) cookie = primera.split(';')[0];
    });
  });
}
const request = Object.assign(agente, { agent: agente });
export default request;
