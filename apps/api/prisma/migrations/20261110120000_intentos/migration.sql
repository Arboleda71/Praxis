-- CreateTable
CREATE TABLE "Intento" (
    "clave" TEXT NOT NULL,
    "n" INTEGER NOT NULL,
    "vence" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Intento_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE INDEX "Intento_vence_idx" ON "Intento"("vence");
