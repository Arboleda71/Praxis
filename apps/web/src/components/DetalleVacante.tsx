"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  NIVELES_FORMACION,
  JORNADAS,
  MODALIDADES,
  type evaluarElegibilidad,
} from "@praxis/contracts";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { solicitar, type Vacante } from "@/lib/mercado";
import { fechaLarga } from "@/lib/perfil-cliente";
type Detalle = Vacante & {
  evaluacion: ReturnType<typeof evaluarElegibilidad>;
  postulación: { id: string; estado: string } | null;
};
const resultado = {
  cumple: "Cumple",
  no_cumple: "No cumple",
  falta_informacion: "Falta información",
};
export default function DetalleVacante({ id }: { id: string }) {
  const router = useRouter();
  const [v, setV] = useState<Detalle | null>(null);
  const [error, setError] = useState("");
  const [confirma, setConfirma] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    void solicitar<Detalle>(`/vacantes/${id}`)
      .then(setV)
      .catch((e) => setError(e.message));
  }, [id]);
  async function postular() {
    setOcupado(true);
    try {
      await solicitar(`/vacantes/${id}/postulaciones`, "POST");
      router.push("/estudiante/postulaciones");
    } catch (e) {
      setError((e as Error).message);
      setConfirma(false);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Stack spacing={3} sx={{ maxWidth: 900, mx: "auto", p: 2, py: 4 }}>
      <Button href="/estudiante/vacantes">Volver a buscar prácticas</Button>
      {error && <Alert severity="error">{error}</Alert>}
      {!v ? (
        <Typography role="status">Cargando vacante…</Typography>
      ) : (
        <>
          <Typography variant="h1" sx={{ fontSize: 28 }}>
            {v.titulo}
          </Typography>
          <Typography>
            Estado: {v.estado}. Vigencia: {fechaLarga(v.vigencia.slice(0, 10))}.
          </Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>
            {v.descripcion}
          </Typography>
          <Typography>
            {MODALIDADES.find((m) => m.id === v.modalidad)?.nombre} {v.ciudad} ·{" "}
            {v.duracionMeses} meses · Inicio:{" "}
            {fechaLarga(v.fechaInicio.slice(0, 10))}
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h2" sx={{ fontSize: 22 }}>
              Empresa: {v.empresa?.razonSocial}
            </Typography>
            <Typography>Datos declarados por la empresa</Typography>
            <Typography>{v.empresa?.descripcion}</Typography>
            <Typography>
              {v.empresa?.ciudad} {v.empresa?.correoContacto}{" "}
              {v.empresa?.telefono}
            </Typography>
            {v.empresa?.sitioWeb && (
              <Button
                href={v.empresa.sitioWeb}
                target="_blank"
                rel="noopener noreferrer"
              >
                Sitio web de la empresa
              </Button>
            )}
          </Paper>
          <Typography variant="h2" sx={{ fontSize: 22 }}>
            Comprueba los requisitos
          </Typography>
          <Typography>
            Niveles aceptados:{" "}
            {v.niveles
              .map((n) => NIVELES_FORMACION.find((x) => x.id === n)?.nombre)
              .join(", ")}
            . Jornada deseable:{" "}
            {JORNADAS.find((j) => j.id === v.jornada)?.nombre}.
          </Typography>
          <Typography>
            Programas solicitados:{" "}
            {v.programas.join(", ") || "No especificados"}. Tu programa:{" "}
            {v.evaluacion.programas.declarado || "Falta información"}. La
            empresa revisa la afinidad.
          </Typography>
          <Stack component="ul" spacing={2} sx={{ pl: 2.5 }}>
            {v.evaluacion.requisitos.map((r, i) => (
              <li key={i}>
                <Typography>
                  {r.requisito} ({r.excluyente ? "excluyente" : "deseable"}):{" "}
                  <strong>{resultado[r.resultado]}</strong>
                </Typography>
              </li>
            ))}
          </Stack>
          {!v.evaluacion.perfilMinimo.completo && (
            <Alert severity="warning">
              Completa tu perfil mínimo: nivel de formación, programa y hoja de
              vida. <Button href="/estudiante/perfil">Completar perfil</Button>
            </Alert>
          )}
          {v.evaluacion.perfilMinimo.completo &&
            !v.evaluacion.puedePostular && (
              <Alert severity="warning">
                Tu nivel de formación no está entre los aceptados. Puedes
                consultar otras prácticas.
              </Alert>
            )}
          {v.postulación && (
            <Alert severity="info">
              Ya te postulaste. Estado: {v.postulación.estado}.{" "}
              <Button href="/estudiante/postulaciones">
                Seguir mi postulación
              </Button>
            </Alert>
          )}
          <Typography>
            Al postularte se guardará una copia de tu perfil, CV, soportes y
            foto opcional, y de esta comprobación. Solo esta empresa podrá
            consultarla. Los cambios posteriores de tu perfil no actualizan esa
            copia.
          </Typography>
          <Button
            variant="contained"
            disabled={
              v.estado !== "Abierta" ||
              !v.evaluacion.puedePostular ||
              !!v.postulación
            }
            onClick={() => setConfirma(true)}
          >
            Postularme
          </Button>
          <Dialog
            open={confirma}
            onClose={() => !ocupado && setConfirma(false)}
            aria-labelledby="confirmar-postulacion"
          >
            <DialogTitle id="confirmar-postulacion">
              Enviar postulación
            </DialogTitle>
            <DialogContent>
              La empresa recibirá una copia de tu perfil y archivos actuales.
              Solo puedes postularte una vez a esta vacante, aunque después te
              retires.
            </DialogContent>
            <DialogActions>
              <Button disabled={ocupado} onClick={() => setConfirma(false)}>
                Cancelar
              </Button>
              <Button disabled={ocupado} onClick={postular}>
                {ocupado ? "Enviando…" : "Enviar postulación"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Stack>
  );
}
