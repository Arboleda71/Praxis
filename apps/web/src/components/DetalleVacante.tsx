"use client";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { NIVELES_FORMACION, nombreDe, type evaluarElegibilidad } from "@praxis/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AvisoError, ChipResultado, Insignia } from "@/components/mercado-ui";
import { useCarga } from "@/lib/carga";
import { tactil } from "@/lib/estilos";
import { enlaceWeb, solicitar, ubicacion, type Vacante } from "@/lib/mercado";
import { fechaLarga } from "@/lib/perfil-cliente";

type Detalle = Vacante & {
  evaluacion: ReturnType<typeof evaluarElegibilidad>;
  postulación: { id: string; estado: string } | null;
};

const tarjeta = { p: 2, borderRadius: 2 } as const;
const detalle = { variant: "body2", color: "text.secondary" } as const;
const unir = (partes: (string | null | undefined | false)[]) => partes.filter(Boolean).join(" · ");

/**
 * Detalle de una práctica con la comprobación de cada requisito y la postulación (mockups M6 · Grupos 3 y 4).
 * Cada requisito va por separado con su resultado (III); solo el nivel excluye (IV); el programa no tiene
 * estado automático (II).
 */
export default function DetalleVacante({ id }: { id: string }) {
  const router = useRouter();
  // Se recarga al reintentar una carga fallida o tras un envío rechazado.
  const { datos: v, setDatos: setV, error, recargar } = useCarga<Detalle>(`/vacantes/${id}`);
  const [confirma, setConfirma] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  async function postular() {
    setOcupado(true);
    try {
      await solicitar(`/vacantes/${id}/postulaciones`, "POST");
      // Sigue ocupado hasta que cambie la página: un segundo clic no debe reenviar.
      router.push("/estudiante/postulaciones");
    } catch (e) {
      // El motivo se explica en el propio diálogo (p. ej. la vacante se cerró mientras se leía).
      setErrorEnvio((e as Error).message);
      setOcupado(false);
    }
  }
  function cerrarDialogo() {
    if (ocupado) return;
    setConfirma(false);
    if (!errorEnvio) return;
    // Un envío rechazado suele significar que la vacante o el perfil cambiaron: se vuelve a cargar sin dejar
    // a la vista los datos viejos (si la recarga falla, se ve el error con «Reintentar», no una vacante falsa).
    setErrorEnvio("");
    setV(null);
    recargar();
  }

  const contacto = unir([v?.empresa?.ciudad, v?.empresa?.correoContacto, v?.empresa?.telefono]);
  const niveles = v?.niveles.map((n) => nombreDe(NIVELES_FORMACION, n) ?? n).join(", ");
  const sitioWeb = enlaceWeb(v?.empresa?.sitioWeb);
  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ width: "100%", maxWidth: 720, mx: "auto", px: { xs: 2, md: 3 }, pt: { xs: 3, md: 5 }, pb: { xs: 4, md: 5 } }}>
      <Button href="/estudiante/vacantes" startIcon={<ArrowBackRounded />} sx={{ ...tactil, alignSelf: "flex-start" }}>
        Volver a buscar prácticas
      </Button>
      {/* Mientras carga o si falla, la página también tiene su encabezado (el mismo título de la pestaña). */}
      {!v && (
        <Typography variant="h1" sx={{ fontSize: 28 }}>
          Requisitos de la práctica
        </Typography>
      )}
      {error && <AvisoError mensaje={error} reintentar={v ? undefined : recargar} />}
      {!v ? (
        !error && <Typography role="status">Cargando vacante…</Typography>
      ) : (
        <>
          <Typography variant="h1" sx={{ fontSize: 28, overflowWrap: "anywhere" }}>
            {v.titulo}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Insignia tono={v.estado === "Abierta" ? "ok" : "neu"}>{v.estado}</Insignia>
            <Typography {...detalle}>Vigencia: {fechaLarga(v.vigencia.slice(0, 10))}</Typography>
          </Stack>
          <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{v.descripcion}</Typography>
          <Typography {...detalle}>
            {unir([
              ubicacion(v),
              `${v.duracionMeses} ${v.duracionMeses === 1 ? "mes" : "meses"}`,
              `Inicio: ${fechaLarga(v.fechaInicio.slice(0, 10))}`,
            ])}
          </Typography>

          <Paper variant="outlined" sx={{ ...tarjeta, bgcolor: "background.default" }}>
            <Stack spacing={0.75} sx={{ alignItems: "flex-start" }}>
              <Typography variant="h2" sx={{ fontSize: 18, overflowWrap: "anywhere" }}>
                Empresa: {v.empresa?.razonSocial}
              </Typography>
              <Insignia tono="neu">Datos declarados por la empresa</Insignia>
              {v.empresa?.descripcion && <Typography sx={{ overflowWrap: "anywhere" }}>{v.empresa.descripcion}</Typography>}
              {contacto && (
                <Typography {...detalle} sx={{ overflowWrap: "anywhere" }}>
                  {contacto}
                </Typography>
              )}
              {sitioWeb && (
                <Button href={sitioWeb} target="_blank" rel="noopener noreferrer" sx={{ ...tactil, ml: -1 }}>
                  Sitio web de la empresa
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </Button>
              )}
            </Stack>
          </Paper>

          <Typography variant="h2" sx={{ fontSize: 20 }}>
            Comprueba los requisitos
          </Typography>
          <Paper variant="outlined" sx={{ ...tarjeta, bgcolor: "#DBEAFE" }}>
            <Stack spacing={0.75}>
              <Typography sx={{ overflowWrap: "anywhere" }}>
                Programas solicitados: {v.programas.join("; ") || "No especificados"}.
              </Typography>
              <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                Tu programa: {v.evaluacion.programas.declarado || "Falta información"}.
              </Typography>
              <Typography variant="body2">{v.evaluacion.programas.etiqueta}.</Typography>
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={tarjeta}>
            <Stack component="ul" spacing={1.5} sx={{ listStyle: "none", m: 0, p: 0 }}>
              {v.evaluacion.requisitos.map((r) => (
                <Stack component="li" key={r.requisito} direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{r.requisito}</Typography>
                    <Typography {...detalle}>{r.excluyente ? `Excluyente · Niveles aceptados: ${niveles}` : "Deseable"}</Typography>
                  </Box>
                  <ChipResultado resultado={r.resultado} />
                </Stack>
              ))}
            </Stack>
          </Paper>

          {!v.evaluacion.perfilMinimo.completo && (
            <>
              <Alert severity="warning">Completa tu perfil mínimo: nivel de formación, programa y hoja de vida.</Alert>
              <Button variant="outlined" href="/estudiante/perfil" sx={{ ...tactil, alignSelf: "flex-start" }}>
                Completar perfil
              </Button>
            </>
          )}
          {/* Se dice aunque además falte el perfil mínimo: el estudiante no debe completarlo para enterarse. */}
          {v.evaluacion.requisitos.some((r) => r.excluyente && r.resultado === "no_cumple") && (
            <Alert severity="warning">
              <AlertTitle>Tu nivel de formación no está entre los aceptados.</AlertTitle>
              Puedes consultar otras prácticas.
            </Alert>
          )}
          {v.estado !== "Abierta" && !v.postulación && (
            <Alert severity="info">Esta vacante ya no recibe postulaciones.</Alert>
          )}
          {v.postulación && (
            <>
              <Alert severity="info">Ya te postulaste. Estado: {v.postulación.estado}.</Alert>
              <Button variant="outlined" href="/estudiante/postulaciones" sx={{ ...tactil, alignSelf: "flex-start" }}>
                Seguir mi postulación
              </Button>
            </>
          )}
          <Typography {...detalle}>
            Al postularte se guardará una copia de tu perfil, CV, soportes y foto opcional, y de esta comprobación.
            Solo esta empresa podrá consultarla. Los cambios posteriores de tu perfil no actualizan esa copia.
          </Typography>
          <Button
            variant="contained"
            disabled={v.estado !== "Abierta" || !v.evaluacion.puedePostular || !!v.postulación}
            onClick={() => setConfirma(true)}
            sx={{ ...tactil, alignSelf: { md: "flex-start" } }}
          >
            Postularme
          </Button>

          <Dialog open={confirma} onClose={cerrarDialogo} aria-labelledby="confirmar-postulacion" fullWidth maxWidth={false} slotProps={{ paper: { sx: { maxWidth: 520, m: 2 } }, backdrop: { sx: { bgcolor: "#0B1F4B99" } } }}>
            <DialogTitle id="confirmar-postulacion" sx={{ fontSize: 20 }}>
              Enviar postulación
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Typography>
                  La empresa recibirá una copia de tu perfil y archivos actuales.
                  {!errorEnvio && " Solo puedes postularte una vez a esta vacante, aunque después te retires."}
                </Typography>
                {errorEnvio && <Alert severity="error">{errorEnvio}</Alert>}
              </Stack>
            </DialogContent>
            {/* Móvil: botones apilados a todo el ancho, el principal arriba. Escritorio: a la derecha. */}
            <DialogActions
              sx={{
                px: 3,
                pb: 3,
                gap: 1,
                flexDirection: { xs: "column-reverse", sm: "row" },
                "& > .MuiButton-root": { ...tactil, m: 0, width: { xs: "100%", sm: "auto" } },
              }}
            >
              {errorEnvio ? (
                <Button onClick={cerrarDialogo}>Cerrar</Button>
              ) : (
                <>
                  <Button disabled={ocupado} onClick={cerrarDialogo}>
                    Cancelar
                  </Button>
                  <Button variant="contained" disabled={ocupado} onClick={postular}>
                    {ocupado ? "Enviando…" : "Enviar postulación"}
                  </Button>
                </>
              )}
            </DialogActions>
          </Dialog>
        </>
      )}
    </Stack>
  );
}
