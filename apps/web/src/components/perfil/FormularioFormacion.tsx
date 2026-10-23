"use client";

import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { NIVELES_FORMACION, avanceDelNivel, avancesDe, formacionSchema, vigentes, type Formacion } from "@praxis/contracts";
import { useState } from "react";
import { useSeccion } from "./useSeccion";

export default function FormularioFormacion({ inicial }: { inicial: Formacion }) {
  const [v, setV] = useState({ ...inicial, programa: inicial.programa ?? "", institucion: inicial.institucion ?? "" });
  const [aviso, setAviso] = useState("");
  const { guardar, Resumen, Acciones, campo } = useSeccion("formacion", formacionSchema);
  const nivel = v.nivelFormacion;

  // El avance depende del nivel; el programa no (texto libre, constitución v4.0.0).
  function cambiarNivel(nuevo: string) {
    const quitaAvance = !!v.avance && !avanceDelNivel(v.avance, nuevo);
    setV({ ...v, nivelFormacion: nuevo, avance: quitaAvance ? null : v.avance });
    setAviso(quitaAvance ? "Cambiaste el nivel: elige de nuevo el avance." : "");
  }

  return (
    <Stack
      component="form"
      noValidate
      spacing={2.5}
      onSubmit={(e) => {
        e.preventDefault();
        guardar({ ...v, programa: v.programa || null, institucion: v.institucion || null });
      }}
    >
      {Resumen}
      <TextField
        {...campo("nivelFormacion")}
        select
        label="Nivel de formación *"
        value={nivel ?? ""}
        onChange={(e) => cambiarNivel(e.target.value)}
      >
        {vigentes(NIVELES_FORMACION).map((n) => (
          <MenuItem key={n.id} value={n.id}>
            {n.nombre}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        {...campo("programa", "Escríbelo como aparece en tu institución, por ejemplo «Tecnología en análisis y desarrollo de software».")}
        label="Programa *"
        value={v.programa}
        onChange={(e) => setV({ ...v, programa: e.target.value })}
        slotProps={{ htmlInput: { maxLength: 150 } }}
      />

      <TextField
        {...campo("institucion", "Opcional.")}
        label="Institución"
        value={v.institucion}
        onChange={(e) => setV({ ...v, institucion: e.target.value })}
        slotProps={{ htmlInput: { maxLength: 150 } }}
        autoComplete="organization"
      />

      <TextField
        {...campo("avance", nivel === "universitario" ? "Opcional. Semestre del 1.º al 12.º" : "Opcional. Técnico y tecnólogo: Lectiva o Productiva.")}
        select
        label="Avance académico"
        value={v.avance ?? ""}
        onChange={(e) => setV({ ...v, avance: e.target.value || null })}
        disabled={!nivel}
      >
        <MenuItem value="">
          <em>Sin elegir</em>
        </MenuItem>
        {nivel &&
          avancesDe(nivel).map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.nombre}
            </MenuItem>
          ))}
      </TextField>

      <Typography variant="body2" color="text.secondary" role="status" aria-live="polite">
        {aviso || "* Obligatorio para postularte."}
      </Typography>
      {Acciones}
    </Stack>
  );
}
