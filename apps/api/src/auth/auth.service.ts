import { ConflictException, GoneException, HttpException, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import type { Login, RegistroEmpresa, RegistroEstudiante, SesionPublica } from '@praxis/contracts';
import { PrismaService } from '../prisma.service.js';
import { Correo } from './correo.js';
import { Intentos } from './intentos.js';
import { hashToken, nuevoToken, SESION_MS, type SesionActiva } from './sesion.js';

const ENLACE_MS = 24 * 60 * 60_000;
const REENVIO_MS = 60_000;
const DEMASIADOS = 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.';
const CREDENCIALES = 'Correo o contraseña incorrectos.';

type CuentaConPerfil = SesionActiva['cuenta'];

export const publica = (c: CuentaConPerfil): SesionPublica => ({
  rol: c.rol === 'ESTUDIANTE' ? 'estudiante' : 'empresa',
  nombre: c.estudiante?.nombreCompleto ?? c.empresa?.razonSocial ?? '',
  correo: c.correo,
  correoConfirmado: !!c.correoConfirmadoEn,
});

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);
  // Hash de referencia: con un correo inexistente se verifica igual, para no revelar si existe.
  private readonly hashFicticio = hash('praxis-cuenta-inexistente');

  constructor(
    private readonly prisma: PrismaService,
    private readonly intentos: Intentos,
    private readonly correo: Correo,
  ) {}

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
    if (this.intentos.bloqueado(...claves)) throw new HttpException({ mensaje: DEMASIADOS }, HttpStatus.TOO_MANY_REQUESTS);
    const cuenta = await this.prisma.cuenta.findUnique({ where: { correo: d.correo }, include: { estudiante: true, empresa: true } });
    const ok = await verify(cuenta?.contrasenaHash ?? (await this.hashFicticio), d.contrasena);
    if (!cuenta || !ok) {
      this.intentos.fallo(...claves);
      throw new UnauthorizedException({ mensaje: CREDENCIALES });
    }
    // Un acierto corta la racha: el bloqueo es por cinco fallos seguidos (FR-012).
    this.intentos.exito(...claves);
    return this.abrirSesion(cuenta);
  }

  async cerrarSesion(token: string | undefined) {
    if (token) await this.prisma.sesion.deleteMany({ where: { id: hashToken(token) } });
  }

  async confirmarCorreo(token: string) {
    const ahora = new Date();
    const enlace = await this.prisma.enlaceConfirmacion.findUnique({ where: { id: hashToken(token) }, include: { cuenta: true } });
    if (!enlace || enlace.usadoEn || enlace.expiraEn <= ahora) throw new GoneException({ mensaje: 'Este enlace ya no sirve.' });
    await this.prisma.$transaction([
      this.prisma.enlaceConfirmacion.update({ where: { id: enlace.id }, data: { usadoEn: ahora } }),
      this.prisma.cuenta.update({ where: { id: enlace.cuentaId }, data: { correoConfirmadoEn: enlace.cuenta.correoConfirmadoEn ?? ahora } }),
    ]);
    return { rol: enlace.cuenta.rol === 'ESTUDIANTE' ? 'estudiante' : 'empresa' };
  }

  async reenviarConfirmacion(cuenta: CuentaConPerfil) {
    if (cuenta.correoConfirmadoEn) throw new ConflictException({ mensaje: 'Tu correo ya está confirmado.' });
    const ultimo = await this.prisma.enlaceConfirmacion.findFirst({ where: { cuentaId: cuenta.id }, orderBy: { creadoEn: 'desc' } });
    const espera = ultimo ? REENVIO_MS - (Date.now() - ultimo.creadoEn.getTime()) : 0;
    if (espera > 0) {
      const segundos = Math.ceil(espera / 1000);
      throw new HttpException({ mensaje: `Puedes pedir otro enlace en ${segundos} s.`, segundos }, HttpStatus.TOO_MANY_REQUESTS);
    }
    // El enlace anterior deja de servir.
    await this.prisma.enlaceConfirmacion.updateMany({ where: { cuentaId: cuenta.id, usadoEn: null }, data: { usadoEn: new Date() } });
    await this.enviarEnlace(cuenta.id, cuenta.correo);
  }

  private async validarNuevo(ip: string, correo: string, nit?: string) {
    if (this.intentos.bloqueado(`ip:${ip}`)) throw new HttpException({ mensaje: DEMASIADOS }, HttpStatus.TOO_MANY_REQUESTS);
    const errores: Record<string, string> = {};
    if (await this.prisma.cuenta.findUnique({ where: { correo } })) errores.correo = 'Este correo ya tiene una cuenta. Inicia sesión.';
    if (nit && (await this.prisma.empresa.findUnique({ where: { nit } }))) errores.nit = 'Ya existe una cuenta para este NIT.';
    if (Object.keys(errores).length) {
      this.intentos.fallo(`ip:${ip}`);
      throw new ConflictException({ errores });
    }
  }

  private async crear(
    d: { correo: string; contrasena: string },
    ip: string,
    perfil: { rol: 'ESTUDIANTE' | 'EMPRESA'; estudiante?: object; empresa?: object },
  ) {
    let cuenta: CuentaConPerfil;
    try {
      cuenta = await this.prisma.cuenta.create({
        data: { correo: d.correo, contrasenaHash: await hash(d.contrasena), autorizacionDatosEn: new Date(), ...perfil },
        include: { estudiante: true, empresa: true },
      });
    } catch (e) {
      // Dos registros simultáneos con el mismo correo o NIT: lo frena la restricción única de la base.
      if ((e as { code?: string }).code === 'P2002') {
        this.intentos.fallo(`ip:${ip}`);
        throw new ConflictException({ errores: { correo: 'Este correo o NIT ya tiene una cuenta.' } });
      }
      throw e;
    }
    // Un registro logrado también corta la racha de esa IP (FR-012: cinco fallos seguidos).
    this.intentos.exito(`ip:${ip}`);
    await this.enviarEnlace(cuenta.id, cuenta.correo);
    return this.abrirSesion(cuenta);
  }

  private async enviarEnlace(cuentaId: string, correo: string) {
    const token = nuevoToken();
    await this.prisma.enlaceConfirmacion.create({ data: { id: hashToken(token), cuentaId, expiraEn: new Date(Date.now() + ENLACE_MS) } });
    try {
      await this.correo.enviarConfirmacion(correo, token);
    } catch (e) {
      // La cuenta ya existe: se puede reenviar. Sin datos personales en el log (XIV).
      this.log.error(`No se pudo enviar el correo de confirmación: ${(e as Error).message}`);
    }
  }

  private async abrirSesion(cuenta: CuentaConPerfil) {
    const token = nuevoToken();
    await this.prisma.sesion.create({ data: { id: hashToken(token), cuentaId: cuenta.id, expiraEn: new Date(Date.now() + SESION_MS) } });
    return { token, sesion: publica(cuenta) };
  }
}
