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
import { EmpresaController } from './empresa/empresa.controller.js';
import { SoloEmpresaGuard } from './auth/sesion.js';
import { VacantesController, VacantesEmpresaController } from './vacantes/vacantes.controller.js';
import { VacantesService } from './vacantes/vacantes.service.js';
import { CandidatosController, PostulacionesEstudianteController } from './vacantes/postulaciones.controller.js';

@Module({
  imports: [],
  controllers: [AuthController, PerfilController, ArchivosController, EmpresaController, VacantesController, VacantesEmpresaController, CandidatosController, PostulacionesEstudianteController],
  providers: [
    PrismaService,
    AuthService,
    Correo,
    SesionGuard,
    SoloEstudianteGuard,
    SoloEmpresaGuard,
    VacantesService,
    PerfilService,
    Archivos,
    { provide: Intentos, useValue: new Intentos() },
  ],
})
export class AppModule {}
