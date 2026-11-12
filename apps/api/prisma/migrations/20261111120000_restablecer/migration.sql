-- CreateTable
CREATE TABLE "EnlaceRestablecer" (
    "id" TEXT NOT NULL,
    "cuentaId" UUID NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnlaceRestablecer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnlaceRestablecer_cuentaId_idx" ON "EnlaceRestablecer"("cuentaId");

-- AddForeignKey
ALTER TABLE "EnlaceRestablecer" ADD CONSTRAINT "EnlaceRestablecer_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
