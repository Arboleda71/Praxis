import {
  ConflictException,
  ForbiddenException,
  GoneException,
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import type {
  Login,
  RegistroEmpresa,
  RegistroEstudiante,
  SesionPublica,
} from '@praxis/contracts';
import { PrismaService } from '../prisma.service.js';
import { Correo } from './correo.js';
import { Intentos } from './intentos.js';
import { huellaNit } from '../cuenta/cuenta.service.js';
import {
  hashToken,
  nuevoToken,
  SESION_MS,
  cuentaActiva,
  type SesionActiva,
} from './sesion.js';

const ENLACE_MS = 24 * 60 * 60_000;
/** Corto a propósito: quien tenga el enlace puede cambiar la contraseña (spec 012). */
const RESTABLECER_MS = 30 * 60_000;
const enlaceInvalido = () =>
  new GoneException({ mensaje: 'Este enlace ya no sirve.' });
/** 429 con el tiempo real que falta (spec 011): la web reactiva el formulario al cumplirse. */
const demasiados = (segundos: number, que = 'intentos') => {
  const minutos = Math.ceil(segundos / 60);
  const espera =
    minutos >= 60
      ? 'una hora'
      : `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  return new HttpException(
    {
      mensaje: `Demasiados ${que}. Espera ${espera} e inténtalo de nuevo.`,
      segundos,
    },
    429,
  );
};
type CuentaConPerfil = SesionActiva['cuenta'];
export const publica = (c: CuentaConPerfil): SesionPublica => ({
  rol:
    c.rol === 'ADMIN'
      ? 'admin'
      : c.rol === 'ESTUDIANTE'
        ? 'estudiante'
        : 'empresa',
  nombre:
    c.estudiante?.nombreCompleto ?? c.empresa?.razonSocial ?? 'Administración',
  correo: c.correo,
  correoConfirmado: !!c.correoConfirmadoEn,
});

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);
  private readonly hashFicticio = hash('praxis-cuenta-inexistente');
  constructor(
    private readonly prisma: PrismaService,
    private readonly intentos: Intentos,
    private readonly correo: Correo,
  ) {}
  async registrarEstudiante(d: RegistroEstudiante, ip: string) {
    await this.validarNuevo(ip, d.correo);
    return this.crear(d, ip, {
      rol: 'ESTUDIANTE',
      estudiante: { create: { nombreCompleto: d.nombreCompleto } },
    });
  }
  async registrarEmpresa(d: RegistroEmpresa, ip: string) {
    await this.validarNuevo(ip, d.correo, d.nit);
    return this.crear(
      d,
      ip,
      {
        rol: 'EMPRESA',
        empresa: {
          create: { razonSocial: d.razonSocial, nit: d.nit, dv: d.dv },
        },
      },
      d.nit,
    );
  }
  async login(d: Login, ip: string) {
    const claves = [`correo:${d.correo}`, `ip:${ip}`];
    const espera = await this.intentos.reservar(...claves);
    if (espera) throw demasiados(espera);
    const cuenta = await this.prisma.cuenta.findUnique({
      where: { correo: d.correo },
      include: { estudiante: true, empresa: true },
    });
    const ok = await verify(
      cuenta?.contrasenaHash ?? (await this.hashFicticio),
      d.contrasena,
    );
    if (!cuenta || !ok || cuenta.eliminadaEn)
      throw new UnauthorizedException({
        mensaje: 'Correo o contraseña incorrectos.',
      });
    if (cuenta.accesoRevocadoEn)
      throw new ForbiddenException({
        mensaje:
          'Tu acceso está revocado. Contacta con el equipo de Praxis para consultar tu caso.',
      });
    await this.intentos.exito(...claves);
    return this.abrirSesion(cuenta);
  }
  async cerrarSesion(token: string | undefined) {
    if (token)
      await this.prisma.sesion.deleteMany({ where: { id: hashToken(token) } });
  }
  async confirmarCorreo(token: string) {
    return this.prisma.$transaction(async (tx) => {
      const ahora = new Date();
      const enlace = await tx.enlaceConfirmacion.findUnique({
        where: { id: hashToken(token) },
        include: { cuenta: true },
      });
      if (!enlace || enlace.expiraEn <= ahora)
        throw new GoneException({ mensaje: 'Este enlace ya no sirve.' });
      await tx.$queryRaw`SELECT id FROM "Cuenta" WHERE id = ${enlace.cuentaId}::uuid FOR UPDATE`;
      const cuenta = await tx.cuenta.findUniqueOrThrow({
        where: { id: enlace.cuentaId },
      });
      if (enlace.usadoEn && !cuenta.correoConfirmadoEn)
        throw new GoneException({ mensaje: 'Este enlace ya no sirve.' });
      const usado = await tx.enlaceConfirmacion.updateMany({
        where: { id: enlace.id, usadoEn: null },
        data: { usadoEn: ahora },
      });
      if (usado.count)
        await tx.cuenta.update({
          where: { id: enlace.cuentaId },
          data: { correoConfirmadoEn: cuenta.correoConfirmadoEn ?? ahora },
        });
      return {
        rol: cuenta.rol === 'ESTUDIANTE' ? 'estudiante' : 'empresa',
        yaConfirmado: !usado.count,
      };
    });
  }
  async estadoEnlace(token: string) {
    const enlace = await this.prisma.enlaceConfirmacion.findUnique({
      where: { id: hashToken(token) },
    });
    return {
      valido: !!enlace && !enlace.usadoEn && enlace.expiraEn > new Date(),
    };
  }
  async reenviarConfirmacion(cuenta: CuentaConPerfil) {
    const token = nuevoToken();
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Cuenta" WHERE id = ${cuenta.id}::uuid FOR UPDATE`;
      const actual = await tx.cuenta.findUniqueOrThrow({
        where: { id: cuenta.id },
      });
      if (actual.eliminadaEn || actual.accesoRevocadoEn)
        throw new UnauthorizedException({
          mensaje: 'Inicia sesión para continuar.',
        });
      if (actual.correoConfirmadoEn)
        throw new ConflictException({
          mensaje: 'Tu correo ya está confirmado.',
        });
      const ultimo = await tx.enlaceConfirmacion.findFirst({
        where: { cuentaId: cuenta.id },
        orderBy: { creadoEn: 'desc' },
      });
      const segundos = Math.ceil(
        (60_000 - (Date.now() - (ultimo?.creadoEn.getTime() ?? 0))) / 1000,
      );
      if (segundos > 0)
        throw new HttpException(
          { mensaje: `Puedes pedir otro enlace en ${segundos} s.`, segundos },
          429,
        );
      await tx.enlaceConfirmacion.create({
        data: {
          id: hashToken(token),
          cuentaId: cuenta.id,
          expiraEn: new Date(Date.now() + ENLACE_MS),
        },
      });
    });
    // Los enlaces anteriores solo dejan de servir cuando el nuevo salió (spec 011, FR-016). Si el envío
    // falla no se anula nada: el proveedor pudo aceptarlo y tardar en responder, y ese correo debe servir.
    // El enlace nuevo conserva su fecha, así que el límite de un minuto sigue aplicando.
    try {
      await this.correo.enviarConfirmacion(cuenta.correo, token);
    } catch {
      this.log.error('No se pudo enviar la confirmación.');
      throw new HttpException(
        {
          mensaje:
            'No pudimos enviar el correo. Inténtalo de nuevo en un minuto.',
        },
        503,
      );
    }
    await this.prisma.enlaceConfirmacion.updateMany({
      where: {
        cuentaId: cuenta.id,
        usadoEn: null,
        id: { not: hashToken(token) },
      },
      data: { usadoEn: new Date() },
    });
  }
  /**
   * Pide el enlace para restablecer la contraseña (spec 012). Termina igual exista o no la cuenta: quien
   * llama no se entera de si el correo está registrado ni de si el envío falló.
   *
   * ponytail: el envío se espera, así que una cuenta que existe tarda más en responder. El registro ya
   * dice si un correo existe (spec 003, FR-009) y el límite por origen frena medirlo; enviar en segundo
   * plano si eso cambia.
   */
  async olvideContrasena(correo: string, ip: string) {
    const espera = await this.intentos.reservar(`restablecer:${ip}`);
    if (espera) throw demasiados(espera);
    const token = nuevoToken();
    const creado = await this.prisma.$transaction(async (tx) => {
      await tx.enlaceRestablecer.deleteMany({
        where: { expiraEn: { lte: new Date() } },
      });
      // El bloqueo de la cuenta serializa dos solicitudes simultáneas: sale un solo correo.
      const [cuenta] = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM "Cuenta" WHERE correo = ${correo} FOR UPDATE`;
      if (!cuenta) return false;
      const ultimo = await tx.enlaceRestablecer.findFirst({
        where: { cuentaId: cuenta.id },
        orderBy: { creadoEn: 'desc' },
      });
      // Un correo por minuto y cuenta, sin avisar: un 429 aquí diría que la cuenta existe.
      if (ultimo && Date.now() - ultimo.creadoEn.getTime() < 60_000)
        return false;
      // Solo sirve el último enlace pedido.
      await tx.enlaceRestablecer.deleteMany({ where: { cuentaId: cuenta.id } });
      await tx.enlaceRestablecer.create({
        data: {
          id: hashToken(token),
          cuentaId: cuenta.id,
          expiraEn: new Date(Date.now() + RESTABLECER_MS),
        },
      });
      return true;
    });
    if (!creado) return;
    try {
      await this.correo.enviarRestablecer(correo, token);
    } catch {
      this.log.error('No se pudo enviar el restablecimiento.');
    }
  }
  async estadoRestablecer(token: string) {
    const enlace = await this.prisma.enlaceRestablecer.findUnique({
      where: { id: hashToken(token) },
    });
    return { valido: !!enlace && enlace.expiraEn > new Date() };
  }
  async restablecerContrasena(token: string, contrasena: string) {
    // Antes de argon2: un enlace inventado no le cuesta CPU a la API.
    if (!(await this.estadoRestablecer(token)).valido) throw enlaceInvalido();
    const contrasenaHash = await hash(contrasena);
    const correo = await this.prisma.$transaction(async (tx) => {
      const id = hashToken(token);
      const enlace = await tx.enlaceRestablecer.findUnique({ where: { id } });
      // El borrado decide: de dos peticiones simultáneas con el mismo enlace, solo una borra la fila.
      const { count } = await tx.enlaceRestablecer.deleteMany({
        where: { id, expiraEn: { gt: new Date() } },
      });
      if (!enlace || !count) throw enlaceInvalido();
      const cuenta = await tx.cuenta.update({
        where: { id: enlace.cuentaId },
        data: { contrasenaHash },
      });
      // Quien conocía la contraseña anterior queda fuera: se cierran todas las sesiones.
      await tx.sesion.deleteMany({ where: { cuentaId: cuenta.id } });
      await tx.enlaceRestablecer.deleteMany({ where: { cuentaId: cuenta.id } });
      return cuenta.correo;
    });
    // El dueño demostró que el correo es suyo: se levanta el bloqueo por fallos de su cuenta.
    await this.intentos.exito(`correo:${correo}`);
  }
  private async validarNuevo(ip: string, correo: string, nit?: string) {
    const bloqueo = await this.intentos.bloqueado(
      `correo:${correo}`,
      `ip:${ip}`,
    );
    if (bloqueo) throw demasiados(bloqueo);
    const espera = await this.intentos.registro(ip);
    if (espera) throw demasiados(espera, 'registros');
    const errores: Record<string, string> = {};
    if (await this.prisma.cuenta.findUnique({ where: { correo } }))
      errores.correo = 'Este correo ya tiene una cuenta. Inicia sesión.';
    if (
      nit &&
      ((await this.prisma.empresa.findUnique({ where: { nit } })) ||
        (await this.prisma.nitReservado.findUnique({
          where: { huella: huellaNit(nit) },
        })))
    )
      errores.nit = 'Ya existe una cuenta para este NIT.';
    if (Object.keys(errores).length) {
      await this.intentos.fallo(`ip:${ip}`);
      throw new ConflictException({ errores });
    }
  }
  private async crear(
    d: { correo: string; contrasena: string },
    ip: string,
    perfil: {
      rol: 'ESTUDIANTE' | 'EMPRESA';
      estudiante?: object;
      empresa?: object;
    },
    nit?: string,
  ) {
    const token = nuevoToken();
    const contrasenaHash = await hash(d.contrasena);
    let cuenta: CuentaConPerfil;
    try {
      cuenta = await this.prisma.$transaction(async (tx) => {
        if (nit) {
          await tx.$queryRaw`SELECT 1 AS bloqueado FROM pg_advisory_xact_lock(hashtextextended(${nit}, 0))`;
          if (
            await tx.nitReservado.findUnique({
              where: { huella: huellaNit(nit) },
            })
          )
            throw new ConflictException({
              errores: { nit: 'Ya existe una cuenta para este NIT.' },
            });
        }
        const c = await tx.cuenta.create({
          data: {
            correo: d.correo,
            contrasenaHash,
            autorizacionDatosEn: new Date(),
            ...perfil,
          },
          include: { estudiante: true, empresa: true },
        });
        await tx.enlaceConfirmacion.create({
          data: {
            id: hashToken(token),
            cuentaId: c.id,
            expiraEn: new Date(Date.now() + ENLACE_MS),
          },
        });
        return c;
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') {
        await this.intentos.fallo(`ip:${ip}`);
        throw new ConflictException({
          errores: { correo: 'Este correo o NIT ya tiene una cuenta.' },
        });
      }
      throw e;
    }
    try {
      await this.correo.enviarConfirmacion(cuenta.correo, token);
    } catch {
      this.log.error('No se pudo enviar la confirmación.');
    }
    return this.abrirSesion(cuenta);
  }
  private async abrirSesion(cuenta: CuentaConPerfil) {
    const token = nuevoToken();
    await this.prisma.$transaction(async (tx) => {
      const actual = await cuentaActiva(tx, cuenta.id);
      if (actual.contrasenaHash !== cuenta.contrasenaHash)
        throw new UnauthorizedException({
          mensaje: 'La contraseña cambió. Inicia sesión de nuevo.',
        });
      await tx.sesion.deleteMany({
        where: { expiraEn: { lte: new Date() } },
      });
      await tx.sesion.create({
        data: {
          id: hashToken(token),
          cuentaId: cuenta.id,
          expiraEn: new Date(Date.now() + SESION_MS),
        },
      });
    });
    return { token, sesion: publica(cuenta) };
  }
}
