-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ESTUDIANTE', 'EMPRESA');

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" UUID NOT NULL,
    "correo" TEXT NOT NULL,
    "contrasenaHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "correoConfirmadoEn" TIMESTAMP(3),
    "autorizacionDatosEn" TIMESTAMP(3) NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estudiante" (
    "cuentaId" UUID NOT NULL,
    "nombreCompleto" TEXT NOT NULL,

    CONSTRAINT "Estudiante_pkey" PRIMARY KEY ("cuentaId")
);

-- CreateTable
CREATE TABLE "Empresa" (
    "cuentaId" UUID NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "nit" TEXT NOT NULL,
    "dv" INTEGER NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("cuentaId")
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" TEXT NOT NULL,
    "cuentaId" UUID NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnlaceConfirmacion" (
    "id" TEXT NOT NULL,
    "cuentaId" UUID NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnlaceConfirmacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_correo_key" ON "Cuenta"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_nit_key" ON "Empresa"("nit");

-- CreateIndex
CREATE INDEX "Sesion_cuentaId_idx" ON "Sesion"("cuentaId");

-- CreateIndex
CREATE INDEX "EnlaceConfirmacion_cuentaId_idx" ON "EnlaceConfirmacion"("cuentaId");

-- AddForeignKey
ALTER TABLE "Estudiante" ADD CONSTRAINT "Estudiante_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnlaceConfirmacion" ADD CONSTRAINT "EnlaceConfirmacion_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
