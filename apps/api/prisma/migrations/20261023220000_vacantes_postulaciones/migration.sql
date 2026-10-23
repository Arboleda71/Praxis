-- CreateTable
CREATE TABLE "Vacante" (
    "id" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "modalidad" TEXT NOT NULL,
    "ciudad" TEXT,
    "duracionMeses" INTEGER NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "vigencia" DATE NOT NULL,
    "niveles" TEXT[],
    "programas" TEXT[],
    "avances" JSONB NOT NULL,
    "aval" BOOLEAN NOT NULL,
    "jornada" TEXT NOT NULL,
    "idiomas" JSONB NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Borrador',
    "motivoCierre" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicadaEn" TIMESTAMP(3),
    "cupoTipo" TEXT,
    "cupoPeriodo" TIMESTAMP(3),

    CONSTRAINT "Vacante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postulacion" (
    "id" UUID NOT NULL,
    "vacanteId" UUID NOT NULL,
    "estudianteId" UUID NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Enviada',
    "perfil" JSONB NOT NULL,
    "evaluacion" JSONB NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchivoPostulacion" (
    "id" UUID NOT NULL,
    "postulacionId" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,

    CONSTRAINT "ArchivoPostulacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialPostulacion" (
    "id" UUID NOT NULL,
    "postulacionId" UUID NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialPostulacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" UUID NOT NULL,
    "cuentaId" UUID NOT NULL,
    "postulacionId" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leidaEn" TIMESTAMP(3),

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Vacante_empresaId_estado_idx" ON "Vacante"("empresaId", "estado");

-- CreateIndex
CREATE INDEX "Vacante_estado_vigencia_idx" ON "Vacante"("estado", "vigencia");

-- CreateIndex
CREATE INDEX "Vacante_niveles_idx" ON "Vacante" USING GIN ("niveles");

-- CreateIndex
CREATE INDEX "Vacante_modalidad_ciudad_idx" ON "Vacante"("modalidad", "ciudad");

-- CreateIndex
CREATE INDEX "Postulacion_estudianteId_creadaEn_idx" ON "Postulacion"("estudianteId", "creadaEn");

-- CreateIndex
CREATE UNIQUE INDEX "Postulacion_vacanteId_estudianteId_key" ON "Postulacion"("vacanteId", "estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivoPostulacion_clave_key" ON "ArchivoPostulacion"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivoPostulacion_postulacionId_tipo_key" ON "ArchivoPostulacion"("postulacionId", "tipo");

-- CreateIndex
CREATE INDEX "HistorialPostulacion_postulacionId_fecha_idx" ON "HistorialPostulacion"("postulacionId", "fecha");

-- CreateIndex
CREATE INDEX "Notificacion_cuentaId_creadaEn_idx" ON "Notificacion"("cuentaId", "creadaEn");

-- AddForeignKey
ALTER TABLE "Vacante" ADD CONSTRAINT "Vacante_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("cuentaId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "Vacante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("cuentaId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivoPostulacion" ADD CONSTRAINT "ArchivoPostulacion_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "Postulacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialPostulacion" ADD CONSTRAINT "HistorialPostulacion_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "Postulacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Vacante_titulo_busqueda_idx" ON "Vacante" USING GIN ("titulo" gin_trgm_ops);
ALTER TABLE "Vacante" ADD CONSTRAINT "Vacante_estado_valido" CHECK ("estado" IN ('Borrador', 'Abierta', 'Cerrada'));
ALTER TABLE "Postulacion" ADD CONSTRAINT "Postulacion_estado_valido" CHECK ("estado" IN ('Enviada', 'En revisión', 'Entrevista', 'Seleccionada', 'Rechazada', 'Retirada'));
