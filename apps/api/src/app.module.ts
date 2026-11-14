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
import {
  VacantesController,
  VacantesEmpresaController,
} from './vacantes/vacantes.controller.js';
import { VacantesService } from './vacantes/vacantes.service.js';
import {
  CandidatosController,
  PostulacionesEstudianteController,
} from './vacantes/postulaciones.controller.js';
import { SeguimientoService } from './vacantes/seguimiento.service.js';
import { NotificacionesController } from './vacantes/notificaciones.controller.js';
import {
  EventosWompiController,
  PagosEmpresaController,
} from './pagos/pagos.controller.js';
import { PagosService } from './pagos/pagos.service.js';
import { WompiClient } from './pagos/wompi.js';
import { AvisosPlanesService } from './pagos/avisos-planes.service.js';
import { SoloAdminGuard } from './auth/sesion.js';
import { CuentaController, AdminController } from './cuenta/cuenta.controller.js';
import { CuentaService } from './cuenta/cuenta.service.js';
import { LimpiezaService } from './cuenta/limpieza.service.js';
import { CvService } from './vacantes/cv.service.js';

@Module({
  imports: [],
  controllers: [
    AuthController,
    CuentaController,
    AdminController,
    PerfilController,
    ArchivosController,
    EmpresaController,
    VacantesController,
    VacantesEmpresaController,
    CandidatosController,
    PostulacionesEstudianteController,
    NotificacionesController,
    PagosEmpresaController,
    EventosWompiController,
  ],
  providers: [
    PrismaService,
    CuentaService,
    CvService,
    LimpiezaService,
    SoloAdminGuard,
    AuthService,
    Correo,
    SesionGuard,
    SoloEstudianteGuard,
    SoloEmpresaGuard,
    VacantesService,
    SeguimientoService,
    PagosService,
    WompiClient,
    AvisosPlanesService,
    PerfilService,
    Archivos,
    Intentos,
  ],
})
export class AppModule {}
