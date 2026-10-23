-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('HOJA_DE_VIDA', 'SOPORTE_AVAL', 'FOTO');

-- AlterTable
ALTER TABLE "Estudiante" ADD COLUMN     "aval" BOOLEAN,
ADD COLUMN     "avance" TEXT,
ADD COLUMN     "disponibleDesde" DATE,
ADD COLUMN     "institucion" TEXT,
ADD COLUMN     "jornada" TEXT,
ADD COLUMN     "nivelFormacion" TEXT,
ADD COLUMN     "perfilActualizadoEn" TIMESTAMP(3),
ADD COLUMN     "programa" VARCHAR(150);

-- CreateTable
CREATE TABLE "IdiomaDeclarado" (
    "cuentaId" UUID NOT NULL,
    "idioma" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,

    CONSTRAINT "IdiomaDeclarado_pkey" PRIMARY KEY ("cuentaId","idioma")
);

-- CreateTable
CREATE TABLE "ArchivoPerfil" (
    "id" UUID NOT NULL,
    "cuentaId" UUID NOT NULL,
    "tipo" "TipoArchivo" NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "subidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivoPerfil_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdiomaDeclarado_idioma_idx" ON "IdiomaDeclarado"("idioma");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivoPerfil_clave_key" ON "ArchivoPerfil"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivoPerfil_cuentaId_tipo_key" ON "ArchivoPerfil"("cuentaId", "tipo");

-- CreateIndex
CREATE INDEX "Estudiante_nivelFormacion_idx" ON "Estudiante"("nivelFormacion");

-- AddForeignKey
ALTER TABLE "IdiomaDeclarado" ADD CONSTRAINT "IdiomaDeclarado_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Estudiante"("cuentaId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoPerfil" ADD CONSTRAINT "ArchivoPerfil_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Estudiante"("cuentaId") ON DELETE CASCADE ON UPDATE CASCADE;

