"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { IDIOMAS, JORNADAS, NIVELES_MCER, disponibilidadSchema, nombreDe, vigentes, type Disponibilidad } from "@praxis/contracts";
import { useState } from "react";
import { useSeccion } from "./useSeccion";

export default function FormularioDisponibilidad({ inicial }: { inicial: Disponibilidad }) {
  const [v, setV] = useState(inicial);
  const { guardar, Resumen, Acciones, campo } = useSeccion("disponibilidad", disponibilidadSchema);
  const idiomas = v.idiomas;
  const cambiarIdioma = (i: number, cambio: Partial<(typeof idiomas)[number]>) =>
    setV({ ...v, idiomas: idiomas.map((x, j) => (j === i ? { ...x, ...cambio } : x)) });
  // El siguiente idioma propuesto es el primero que no se ha agregado.
  const libre = vigentes(IDIOMAS).find((i) => !idiomas.some((x) => x.idioma === i.id));

  return (
    <Stack
      component="form"
      noValidate
      spacing={2.5}
      onSubmit={(e) => {
        e.preventDefault();
        guardar(v);
      }}
    >
      {Resumen}
      <Typography variant="h2" sx={{ fontSize: 16 }}>
        Disponibilidad
      </Typography>
      <TextField
        {...campo("disponibleDesde", "Día/mes/año.")}
        type="date"
        label="Disponible desde"
        value={v.disponibleDesde ?? ""}
        onChange={(e) => setV({ ...v, disponibleDesde: e.target.value || null })}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField {...campo("jornada")} select label="Jornada" value={v.jornada ?? ""} onChange={(e) => setV({ ...v, jornada: e.target.value || null })}>
        <MenuItem value="">
          <em>Sin elegir</em>
        </MenuItem>
        {vigentes(JORNADAS).map((j) => (
          <MenuItem key={j.id} value={j.id}>
            {j.nombre}
          </MenuItem>
        ))}
      </TextField>

      <Typography variant="h2" sx={{ fontSize: 16 }}>
        Idiomas
      </Typography>
      {idiomas.length === 0 && <Typography color="text.secondary">Aún no agregas idiomas. Son opcionales.</Typography>}
      {idiomas.map((fila, i) => (
        <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <TextField
            {...campo(`idiomas.${i}.idioma`)}
            select
            label="Idioma"
            value={fila.idioma}
            onChange={(e) => cambiarIdioma(i, { idioma: e.target.value })}
            sx={{ flex: 1 }}
          >
            {vigentes(IDIOMAS).map((x) => (
              <MenuItem key={x.id} value={x.id}>
                {x.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            {...campo(`idiomas.${i}.nivel`)}
            select
            label="Nivel (MCER)"
            value={fila.nivel}
            onChange={(e) => cambiarIdioma(i, { nivel: e.target.value })}
            sx={{ width: { xs: 104, md: 200 }, flexShrink: 0 }}
            fullWidth={false}
            slotProps={{ select: { renderValue: (n) => (n as string).toUpperCase() } }}
          >
            {vigentes(NIVELES_MCER).map((n) => (
              <MenuItem key={n.id} value={n.id}>
                {n.nombre}
              </MenuItem>
            ))}
          </TextField>
          <IconButton
            aria-label={`Quitar ${nombreDe(IDIOMAS, fila.idioma) ?? "idioma"}`}
            onClick={() => setV({ ...v, idiomas: idiomas.filter((_, j) => j !== i) })}
            sx={{ mt: 1 }}
          >
            <DeleteOutlineRounded />
          </IconButton>
        </Stack>
      ))}
      {libre && (
        <Button
          startIcon={<AddRounded />}
          sx={{ alignSelf: "flex-start" }}
          onClick={() => setV({ ...v, idiomas: [...idiomas, { idioma: libre.id, nivel: "a1" }] })}
        >
          Agregar idioma
        </Button>
      )}
      {Acciones}
    </Stack>
  );
}
