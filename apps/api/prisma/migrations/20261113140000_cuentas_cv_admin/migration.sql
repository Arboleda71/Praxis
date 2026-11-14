ALTER TYPE "Rol" ADD VALUE 'ADMIN';
ALTER TABLE "Cuenta" ADD COLUMN "accesoRevocadoEn" TIMESTAMP(3), ADD COLUMN "eliminadaEn" TIMESTAMP(3);
ALTER TABLE "Empresa" ADD COLUMN "logoClave" TEXT, ADD COLUMN "logoNombre" TEXT, ADD COLUMN "logoBytes" INTEGER;
CREATE UNIQUE INDEX "Empresa_logoClave_key" ON "Empresa"("logoClave");
ALTER TABLE "Postulacion" ADD COLUMN "cvReemplazadoEn" TIMESTAMP(3);
ALTER TABLE "HistorialPostulacion" ADD COLUMN "detalle" TEXT;
CREATE TABLE "HistorialAcceso" (
  "id" UUID NOT NULL, "cuentaId" UUID NOT NULL, "responsableId" UUID NOT NULL,
  "accion" TEXT NOT NULL, "motivo" VARCHAR(1000) NOT NULL, "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HistorialAcceso_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HistorialAcceso_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "HistorialAcceso_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "HistorialAcceso_cuentaId_fecha_idx" ON "HistorialAcceso"("cuentaId", "fecha");
CREATE TABLE "NitReservado" ("huella" TEXT NOT NULL PRIMARY KEY);
CREATE TABLE "ArchivoPorBorrar" ("clave" TEXT NOT NULL PRIMARY KEY, "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
