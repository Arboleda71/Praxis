import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { Correo } from './auth/correo.js';
import { Intentos } from './auth/intentos.js';
import { SesionGuard } from './auth/sesion.js';
import { PrismaService } from './prisma.service.js';

@Module({
  imports: [],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    PrismaService,
    AuthService,
    Correo,
    SesionGuard,
    { provide: Intentos, useValue: new Intentos() },
  ],
})
export class AppModule {}
