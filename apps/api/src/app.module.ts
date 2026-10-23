import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { Correo } from './auth/correo.js';
import { Intentos } from './auth/intentos.js';
import { SesionGuard, SoloEstudianteGuard } from './auth/sesion.js';
import { Archivos } from './perfil/archivos.js';
import { ArchivosController } from './perfil/archivos.controller.js';
import { PerfilController } from './perfil/perfil.controller.js';
import { PerfilService } from './perfil/perfil.service.js';
import { PrismaService } from './prisma.service.js';

@Module({
  imports: [],
  controllers: [AuthController, PerfilController, ArchivosController],
  providers: [
    PrismaService,
    AuthService,
    Correo,
    SesionGuard,
    SoloEstudianteGuard,
    PerfilService,
    Archivos,
    { provide: Intentos, useValue: new Intentos() },
  ],
})
export class AppModule {}
