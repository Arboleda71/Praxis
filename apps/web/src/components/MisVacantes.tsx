"use client";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { TAMANO_PAGINA } from "@praxis/contracts";
import { AvisoError } from "@/components/mercado-ui";
import { useCarga } from "@/lib/carga";
import { solicitar, type Lista, type Vacante } from "@/lib/mercado";
import { fechaLarga } from "@/lib/perfil-cliente";


export default function MisVacantes() {
  const [pagina, setPagina] = useState(1);
  const [accion, setAccion] = useState<{
    id: string;
    tipo: "publicar" | "cerrar" | "eliminar";
  } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  // Se recarga la página actual después de publicar, cerrar o eliminar. Al cargar con éxito se quita el
  // aviso de una acción anterior fallida: los datos ya son los actuales.
  const { datos: lista, error, setError, recargar } = useCarga<Lista<Vacante>>(
    `/empresa/vacantes?pagina=${pagina}`,
    (datos) => {
      // La página quedó fuera de rango (se eliminó su último borrador): se va a la última que existe en
      // lugar de mostrar una lista vacía cuando todavía hay vacantes.
      const ultima = Math.max(1, Math.ceil(datos.total / TAMANO_PAGINA));
      if (pagina <= ultima) return true;
      setPagina(ultima);
      return false;
    },
  );
  async function confirmar() {
    if (!accion) return;
    setOcupado(true);
    setError("");
    try {
      await solicitar(
        `/empresa/vacantes/${accion.id}${accion.tipo === "eliminar" ? "" : `/${accion.tipo}`}`,
        accion.tipo === "eliminar" ? "DELETE" : "POST",
      );
      setAccion(null);
      recargar();
    } catch (e) {
      setError((e as Error).message);
      setAccion(null);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <Stack spacing={3} sx={{ maxWidth: 960, mx: "auto", p: 2, py: 4 }}>
      <Typography variant="h1" sx={{ fontSize: 28 }}>
        Mis vacantes
      </Typography>
      {lista?.estadoPlan?.avisoPlan && <Alert severity="warning" action={<Button color="inherit" href="/empresa/planes">Ver planes y pagos</Button>}>{lista.estadoPlan.avisoPlan}</Alert>}
      {lista?.estadoPlan?.activo && <Typography>{lista.estadoPlan.plan === "basico" ? `Plan Básico: te quedan ${lista.estadoPlan.publicacionesRestantes} de 4 publicaciones adicionales.` : "Plan Ilimitado activo."} Hasta {lista.estadoPlan.planVenceEn ? fechaLarga(lista.estadoPlan.planVenceEn.slice(0, 10)) : ""}.</Typography>}
      <Typography>
        Te quedan {lista?.cuposGratis ?? "…"} de 2 publicaciones gratis en estos
        6 meses.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
        <Button href="/empresa/vacantes/nueva" variant="contained">
          Crear vacante
        </Button>
        <Button href="/empresa/planes">Planes y pagos</Button>
        <Button href="/notificaciones">Notificaciones</Button>
      </Stack>
      {/* Sin lista, el error es de la carga: se reintenta. Con lista, es de una acción (publicar exige correo,
          NIT y cupos): se lleva a revisar la empresa. */}
      {error &&
        (lista ? (
          <AvisoError mensaje={error}>
            <Button href={/cupo|publicaciones|planes/i.test(error) ? "/empresa/planes" : "/empresa/perfil"}>{/cupo|publicaciones|planes/i.test(error) ? "Ver planes y pagos" : "Revisar mi empresa"}</Button>
          </AvisoError>
        ) : (
          <AvisoError mensaje={error} reintentar={recargar} />
        ))}
      {!lista ? (
        !error && <Typography role="status">Cargando vacantes…</Typography>
      ) : lista.total === 0 ? (
        <Typography>
          Aún no tienes vacantes. Crea tu primer borrador.
        </Typography>
      ) : (
        lista.items.map((v) => (
          <Paper
            component="article"
            variant="outlined"
            key={v.id}
            sx={{ p: 2 }}
          >
            <Stack spacing={1.5}>
              <Typography variant="h2" sx={{ fontSize: 20 }}>
                {v.titulo}
              </Typography>
              <Typography>
                Estado: {v.estado}
                {v.motivoCierre ? ` (${v.motivoCierre})` : ""}. Vigencia:{" "}
                {fechaLarga(v.vigencia.slice(0, 10))}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button href={`/empresa/vacantes/${v.id}`}>
                  {v.estado === "Borrador" ? "Editar borrador" : "Ver vacante"}
                </Button>
                {v.estado === "Borrador" && (
                  <>
                    <Button
                      onClick={() => setAccion({ id: v.id, tipo: "publicar" })}
                    >
                      Publicar
                    </Button>
                    <Button
                      onClick={() => setAccion({ id: v.id, tipo: "eliminar" })}
                    >
                      Eliminar borrador
                    </Button>
                  </>
                )}
                {v.estado === "Abierta" && (
                  <Button
                    onClick={() => setAccion({ id: v.id, tipo: "cerrar" })}
                  >
                    Cerrar vacante
                  </Button>
                )}
                {v.estado !== "Borrador" && (
                  <Button href={`/empresa/vacantes/${v.id}/postulaciones`}>
                    Ver postulaciones
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        ))
      )}
      <Stack direction="row" spacing={2}>
        <Button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>
          Anterior
        </Button>
        <Typography>Página {pagina}</Typography>
        <Button
          disabled={!lista || pagina * TAMANO_PAGINA >= lista.total}
          onClick={() => setPagina(pagina + 1)}
        >
          Siguiente
        </Button>
      </Stack>
      <Dialog
        open={!!accion}
        onClose={() => !ocupado && setAccion(null)}
        aria-labelledby="confirmar-vacante"
      >
        <DialogTitle id="confirmar-vacante">
          {accion?.tipo === "publicar"
            ? "Publicar vacante"
            : accion?.tipo === "cerrar"
              ? "Cerrar vacante"
              : "Eliminar borrador"}
        </DialogTitle>
        <DialogContent>
          {accion?.tipo === "publicar"
            ? "Publicar consume un cupo. Los requisitos quedarán fijos y no podrás cambiarlos."
            : accion?.tipo === "cerrar"
              ? "No podrás reabrirla. Las postulaciones en curso seguirán disponibles."
              : "Se eliminará este borrador."}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccion(null)} disabled={ocupado}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={ocupado}>
            {ocupado ? "Procesando…" : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
