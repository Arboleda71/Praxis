import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { SinAcceso } from "@/components/Aviso";
import PaginaSeccion from "@/components/perfil/PaginaSeccion";
import SubidaArchivo from "@/components/perfil/SubidaArchivo";
import { getPerfil } from "@/lib/perfil";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Hoja de vida" };

export default async function HojaDeVida() {
  if (!(await requireRole("estudiante", "/estudiante/perfil/hoja-de-vida"))) return <SinAcceso role="empresa" />;
  const perfil = await getPerfil();
  return (
    <PaginaSeccion titulo="Hoja de vida" intro="Es parte del perfil mínimo. La ven solo las empresas a cuyas vacantes te postules.">
      {perfil && (
        <>
          <SubidaArchivo tipo="hoja-de-vida" actual={perfil.archivos.hojaDeVida} etiqueta="hoja de vida" />
          {perfil.archivos.hojaDeVida && (
            <Typography variant="body2" color="text.secondary">
              Al reemplazarla, las empresas a las que ya te postulaste siguen viendo la versión que enviaste.
            </Typography>
          )}
        </>
      )}
    </PaginaSeccion>
  );
}
