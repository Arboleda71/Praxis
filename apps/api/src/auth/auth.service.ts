import { ConflictException, GoneException, HttpException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import type { Login, RegistroEmpresa, RegistroEstudiante, SesionPublica } from '@praxis/contracts';
import { PrismaService } from '../prisma.service.js';
import { Correo } from './correo.js';
import { Intentos } from './intentos.js';
import { hashToken, nuevoToken, SESION_MS, type SesionActiva } from './sesion.js';

const ENLACE_MS = 24 * 60 * 60_000;
const DEMASIADOS = 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.';
type CuentaConPerfil = SesionActiva['cuenta'];
export const publica = (c: CuentaConPerfil): SesionPublica => ({
  rol: c.rol === 'ESTUDIANTE' ? 'estudiante' : 'empresa',
  nombre: c.estudiante?.nombreCompleto ?? c.empresa?.razonSocial ?? '',
  correo: c.correo, correoConfirmado: !!c.correoConfirmadoEn,
});

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);
  private readonly hashFicticio = hash('praxis-cuenta-inexistente');
  constructor(private readonly prisma: PrismaService, private readonly intentos: Intentos, private readonly correo: Correo) {}
  async registrarEstudiante(d: RegistroEstudiante, ip: string) {
    await this.validarNuevo(ip, d.correo);
    return this.crear(d, ip, { rol: 'ESTUDIANTE', estudiante: { create: { nombreCompleto: d.nombreCompleto } } });
  }
  async registrarEmpresa(d: RegistroEmpresa, ip: string) {
    await this.validarNuevo(ip, d.correo, d.nit);
    return this.crear(d, ip, { rol: 'EMPRESA', empresa: { create: { razonSocial: d.razonSocial, nit: d.nit, dv: d.dv } } });
  }
  async login(d: Login, ip: string) {
    const claves = [`correo:${d.correo}`, `ip:${ip}`];
    if (!this.intentos.reservar(...claves)) throw new HttpException({ mensaje: DEMASIADOS }, 429);
    const cuenta = await this.prisma.cuenta.findUnique({ where: { correo: d.correo }, include: { estudiante: true, empresa: true } });
    const ok = await verify(cuenta?.contrasenaHash ?? (await this.hashFicticio), d.contrasena);
    if (!cuenta || !ok) throw new UnauthorizedException({ mensaje: 'Correo o contraseña incorrectos.' });
    this.intentos.exito(...claves);
    return this.abrirSesion(cuenta);
  }
  async cerrarSesion(token: string | undefined) {
    if (token) await this.prisma.sesion.deleteMany({ where: { id: hashToken(token) } });
  }
  async confirmarCorreo(token: string) {
    return this.prisma.$transaction(async tx => {
      const ahora = new Date();
      const enlace = await tx.enlaceConfirmacion.findUnique({ where: { id: hashToken(token) }, include: { cuenta: true } });
      if (!enlace || enlace.expiraEn <= ahora) throw new GoneException({ mensaje: 'Este enlace ya no sirve.' });
      await tx.$queryRaw`SELECT id FROM "Cuenta" WHERE id = ${enlace.cuentaId}::uuid FOR UPDATE`;
      const cuenta = await tx.cuenta.findUniqueOrThrow({ where: { id: enlace.cuentaId } });
      if (enlace.usadoEn && !cuenta.correoConfirmadoEn) throw new GoneException({ mensaje: 'Este enlace ya no sirve.' });
      const usado = await tx.enlaceConfirmacion.updateMany({ where: { id: enlace.id, usadoEn: null }, data: { usadoEn: ahora } });
      if (usado.count) await tx.cuenta.update({ where: { id: enlace.cuentaId }, data: { correoConfirmadoEn: cuenta.correoConfirmadoEn ?? ahora } });
      return { rol: cuenta.rol === 'ESTUDIANTE' ? 'estudiante' : 'empresa', yaConfirmado: !usado.count };
    });
  }
  async reenviarConfirmacion(cuenta: CuentaConPerfil) {
    const token = nuevoToken();
    await this.prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Cuenta" WHERE id = ${cuenta.id}::uuid FOR UPDATE`;
      const actual = await tx.cuenta.findUniqueOrThrow({ where: { id: cuenta.id } });
      if (actual.correoConfirmadoEn) throw new ConflictException({ mensaje: 'Tu correo ya está confirmado.' });
      const ultimo = await tx.enlaceConfirmacion.findFirst({ where: { cuentaId: cuenta.id }, orderBy: { creadoEn: 'desc' } });
      const segundos = Math.ceil((60_000 - (Date.now() - (ultimo?.creadoEn.getTime() ?? 0))) / 1000);
      if (segundos > 0) throw new HttpException({ mensaje: `Puedes pedir otro enlace en ${segundos} s.`, segundos }, 429);
      await tx.enlaceConfirmacion.updateMany({ where: { cuentaId: cuenta.id, usadoEn: null }, data: { usadoEn: new Date() } });
      await tx.enlaceConfirmacion.create({ data: { id: hashToken(token), cuentaId: cuenta.id, expiraEn: new Date(Date.now() + ENLACE_MS) } });
    });
    try { await this.correo.enviarConfirmacion(cuenta.correo, token); }
    catch { this.log.error('No se pudo enviar la confirmación.'); throw new HttpException({ mensaje: 'No pudimos enviar el correo. Inténtalo de nuevo en un minuto.' }, 503); }
  }
  private async validarNuevo(ip: string, correo: string, nit?: string) {
    if (this.intentos.bloqueado(`correo:${correo}`, `ip:${ip}`)) throw new HttpException({ mensaje: DEMASIADOS }, 429);
    if (!this.intentos.registro(ip)) throw new HttpException({ mensaje: 'Demasiados registros. Espera una hora e inténtalo de nuevo.' }, 429);
    const errores: Record<string, string> = {};
    if (await this.prisma.cuenta.findUnique({ where: { correo } })) errores.correo = 'Este correo ya tiene una cuenta. Inicia sesión.';
    if (nit && await this.prisma.empresa.findUnique({ where: { nit } })) errores.nit = 'Ya existe una cuenta para este NIT.';
    if (Object.keys(errores).length) { this.intentos.fallo(`ip:${ip}`); throw new ConflictException({ errores }); }
  }
  private async crear(d: { correo: string; contrasena: string }, ip: string, perfil: { rol: 'ESTUDIANTE' | 'EMPRESA'; estudiante?: object; empresa?: object }) {
    const token = nuevoToken();
    const contrasenaHash = await hash(d.contrasena);
    let cuenta: CuentaConPerfil;
    try {
      cuenta = await this.prisma.$transaction(async tx => {
        const c = await tx.cuenta.create({ data: { correo: d.correo, contrasenaHash, autorizacionDatosEn: new Date(), ...perfil }, include: { estudiante: true, empresa: true } });
        await tx.enlaceConfirmacion.create({ data: { id: hashToken(token), cuentaId: c.id, expiraEn: new Date(Date.now() + ENLACE_MS) } });
        return c;
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') { this.intentos.fallo(`ip:${ip}`); throw new ConflictException({ errores: { correo: 'Este correo o NIT ya tiene una cuenta.' } }); }
      throw e;
    }
    try { await this.correo.enviarConfirmacion(cuenta.correo, token); }
    catch { this.log.error('No se pudo enviar la confirmación.'); }
    return this.abrirSesion(cuenta);
  }
  private async abrirSesion(cuenta: CuentaConPerfil) {
    const token = nuevoToken();
    await this.prisma.sesion.deleteMany({ where: { expiraEn: { lte: new Date() } } });
    await this.prisma.sesion.create({ data: { id: hashToken(token), cuentaId: cuenta.id, expiraEn: new Date(Date.now() + SESION_MS) } });
    return { token, sesion: publica(cuenta) };
  }
}

