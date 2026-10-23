"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { avalSchema } from "@praxis/contracts";
import { useState } from "react";
import type { ArchivoMeta } from "@/lib/perfil";
import SubidaArchivo from "./SubidaArchivo";
import { useSeccion } from "./useSeccion";

const valor = (a: boolean | null) => (a === null ? "" : a ? "si" : "no");

export default function FormularioAval({ aval, soporte }: { aval: boolean | null; soporte: ArchivoMeta | null }) {
  const [elegido, setElegido] = useState(valor(aval));
  const [confirmar, setConfirmar] = useState(false);
  const { guardar, Resumen, Acciones } = useSeccion("aval", avalSchema);
  const datos = () => ({ aval: elegido === "" ? null : elegido === "si" });

  return (
    <Stack
      component="form"
      noValidate
      spacing={2.5}
      onSubmit={(e) => {
        e.preventDefault();
        // Pasar a «No» con un soporte subido lo borra: se pide confirmación.
        if (elegido === "no" && soporte) return setConfirmar(true);
        guardar(datos());
      }}
    >
      {Resumen}
      <FormControl>
        <FormLabel id="aval-pregunta" sx={{ fontWeight: 600, color: "text.primary" }}>
          ¿Tienes aval de tu institución?
        </FormLabel>
        <RadioGroup aria-labelledby="aval-pregunta" value={elegido} onChange={(e) => setElegido(e.target.value)}>
          <FormControlLabel value="si" control={<Radio />} label="Sí" />
          <FormControlLabel value="no" control={<Radio />} label="No" />
        </RadioGroup>
      </FormControl>

      {aval === true && elegido === "si" ? (
        <Stack spacing={1}>
          <Typography variant="h2" sx={{ fontSize: 16 }}>
            Soporte del aval
          </Typography>
          <Typography color="text.secondary">Opcional, pero recomendado: ayuda a la empresa a revisar tu postulación.</Typography>
          <SubidaArchivo tipo="soporte-aval" actual={soporte} etiqueta="soporte del aval" />
        </Stack>
      ) : (
        elegido === "si" && <Typography color="text.secondary">Guarda tu respuesta para poder subir el soporte (opcional).</Typography>
      )}

      <Alert severity="info">
        <AlertTitle>Praxis no verifica el aval</AlertTitle>
        Tu perfil dirá «Aval declarado (sin soporte)» o «Aval declarado (con soporte)». Nunca «verificado».
      </Alert>
      {Acciones}

      <Dialog open={confirmar} onClose={() => setConfirmar(false)} aria-labelledby="confirmar-titulo">
        <DialogTitle id="confirmar-titulo">¿Quitar el soporte del aval?</DialogTitle>
        <DialogContent>
          <DialogContentText>Si respondes «No», borramos el soporte que subiste. Puedes volver a subirlo después.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmar(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmar(false);
              guardar(datos());
            }}
          >
            Sí, quitar y guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
