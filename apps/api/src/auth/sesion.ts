import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { Request } from 'express';
import { PrismaService } from '../prisma.service.js';

export const COOKIE = 'praxis_sesion';
export const SESION_MS = 30 * 24 * 60 * 60_000;

/** En la base solo se guarda el hash del token (sesiones y enlaces). */
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const nuevoToken = () => randomBytes(32).toString('base64url');

export const opcionesCookie = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});

const incluir = { estudiante: true, empresa: true } as const;

async function buscarSesion(prisma: PrismaService, token: string | undefined) {
  if (!token) return null;
  const s = await prisma.sesion.findUnique({ where: { id: hashToken(token) }, include: { cuenta: { include: incluir } } });
  return s && s.expiraEn > new Date() ? s : null;
}

export type SesionActiva = NonNullable<Awaited<ReturnType<typeof buscarSesion>>>;
export type RequestConSesion = Request & { sesion: SesionActiva };

@Injectable()
export class SesionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestConSesion>();
    const sesion = await buscarSesion(this.prisma, req.cookies?.[COOKIE]);
    if (!sesion) throw new UnauthorizedException({ mensaje: 'Inicia sesión para continuar.' });
    req.sesion = sesion;
    return true;
  }
}
