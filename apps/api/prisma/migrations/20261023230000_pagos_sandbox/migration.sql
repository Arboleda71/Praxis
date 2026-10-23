-- AlterTable
ALTER TABLE "Empresa" ADD COLUMN     "plan" TEXT,
ADD COLUMN     "planInicioEn" TIMESTAMP(3),
ADD COLUMN     "planVenceEn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Pago" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "plan" TEXT NOT NULL,
    "montoCentavos" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'COP',
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "wompiId" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprobadaEn" TIMESTAMP(3),

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pago_wompiId_key" ON "Pago"("wompiId");

-- CreateIndex
CREATE INDEX "Pago_empresaId_creadaEn_idx" ON "Pago"("empresaId", "creadaEn");

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("cuentaId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_plan_importe_valido" CHECK (("plan"='basico' AND "montoCentavos"=2990000 OR "plan"='ilimitado' AND "montoCentavos"=5900000) AND "moneda"='COP');
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_estado_valido" CHECK ("estado" IN ('Pendiente','Aprobado','Rechazado'));
CREATE UNIQUE INDEX "Pago_un_pendiente_por_empresa" ON "Pago" ("empresaId") WHERE "estado"='Pendiente';
