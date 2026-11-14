ALTER TABLE "Notificacion" ALTER COLUMN "postulacionId" DROP NOT NULL;
ALTER TABLE "Notificacion" ADD COLUMN "clave" TEXT;
CREATE UNIQUE INDEX "Notificacion_clave_key" ON "Notificacion"("clave");
CREATE INDEX "Empresa_planVenceEn_idx" ON "Empresa"("planVenceEn");
