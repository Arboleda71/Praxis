"use client";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  IDIOMAS,
  JORNADAS,
  MODALIDADES,
  NIVELES_FORMACION,
  NIVELES_MCER,
  avancesDe,
  vacanteSchema,
  type VacanteDatos,
} from "@praxis/contracts";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { solicitar, type Vacante } from "@/lib/mercado";

const vacia: VacanteDatos = {
  titulo: "",
  descripcion: "",
  modalidad: "remota",
  ciudad: null,
  duracionMeses: 6,
  fechaInicio: "",
  vigencia: "",
  niveles: [],
  programas: [],
  avances: [],
  aval: false,
  jornada: "tiempo-completo",
  idiomas: [],
};
export default function FormularioVacante({ id }: { id?: string }) {
  const router = useRouter();
  const resumen = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(vacia);
  const [paso, setPaso] = useState(0);
  const [estado, setEstado] = useState("Borrador");
  const [error, setError] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(!!id);
  useEffect(() => {
    if (id)
      void solicitar<Vacante>(`/empresa/vacantes/${id}`)
        .then((d) => {
          setEstado(d.estado);
          setV({
            titulo: d.titulo,
            descripcion: d.descripcion,
            modalidad: d.modalidad,
            ciudad: d.ciudad,
            duracionMeses: d.duracionMeses,
            fechaInicio: d.fechaInicio.slice(0, 10),
            vigencia: d.vigencia.slice(0, 10),
            niveles: d.niveles,
            programas: d.programas,
            avances: d.avances,
            aval: d.aval,
            jornada: d.jornada,
            idiomas: d.idiomas,
          });
        })
        .catch((e) => setError(e.message))
        .finally(() => setOcupado(false));
  }, [id]);
  function validar(final = false) {
    const r = vacanteSchema.safeParse(v);
    const campos =
      paso === 0
        ? [
            "titulo",
            "descripcion",
            "modalidad",
            "ciudad",
            "duracionMeses",
            "fechaInicio",
            "vigencia",
          ]
        : ["niveles", "programas", "avances", "aval", "jornada", "idiomas"];
    const issues = r.success
      ? []
      : r.error.issues.filter(
          (i) => final || campos.includes(String(i.path[0])),
        );
    setErrores(
      Object.fromEntries(issues.map((i) => [String(i.path[0]), i.message])),
    );
    if (issues.length) {
      setError("Revisa los campos indicados.");
      requestAnimationFrame(() => resumen.current?.focus());
      return false;
    }
    setError("");
    return true;
  }
  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (estado === "Borrador" && !validar(true)) return;
    setOcupado(true);
    setError("");
    try {
      await solicitar(
        id ? `/empresa/vacantes/${id}` : "/empresa/vacantes",
        id ? "PUT" : "POST",
        estado === "Borrador" ? v : { descripcion: v.descripcion },
      );
      router.push("/empresa/vacantes");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }
  const campo = (k: keyof VacanteDatos) => ({
    error: !!errores[k],
    helperText: errores[k] ?? " ",
  });
  return (
    <Stack spacing={3} sx={{ maxWidth: 760, mx: "auto", p: 2, py: 4 }}>
      <Typography variant="h1" sx={{ fontSize: 28 }}>
        {id ? "Editar vacante" : "Crear vacante"}
      </Typography>
      <Button href="/empresa/vacantes">Volver a mis vacantes</Button>
      {error && (
        <Alert severity="error" tabIndex={-1} ref={resumen}>
          {error}
        </Alert>
      )}
      <Typography>
        Estado: {estado}. Solo la descripción de una vacante abierta puede
        cambiar.
      </Typography>
      <Stack component="form" noValidate onSubmit={guardar} spacing={2.5}>
        {estado !== "Borrador" ? (
          <>
            <Typography>
              Requisitos publicados: niveles {v.niveles.join(", ")}. Programas:{" "}
              {v.programas.join(", ") || "Sin programas solicitados"}. La
              empresa revisa la afinidad.
            </Typography>
            <TextField
              label="Descripción"
              multiline
              minRows={4}
              value={v.descripcion}
              onChange={(e) => setV({ ...v, descripcion: e.target.value })}
            />
          </>
        ) : (
          <>
            <Typography variant="h2" sx={{ fontSize: 20 }}>
              Paso {paso + 1} de 3:{" "}
              {["Datos generales", "Requisitos", "Revisión"][paso]}
            </Typography>
            {paso === 0 && (
              <>
                <TextField
                  id="vacante-titulo"
                  label="Título"
                  required
                  value={v.titulo}
                  onChange={(e) => setV({ ...v, titulo: e.target.value })}
                  {...campo("titulo")}
                />
                <TextField
                  id="vacante-descripcion"
                  label="Descripción"
                  required
                  multiline
                  minRows={4}
                  value={v.descripcion}
                  onChange={(e) => setV({ ...v, descripcion: e.target.value })}
                  {...campo("descripcion")}
                />
                <TextField
                  id="vacante-modalidad"
                  label="Modalidad"
                  select
                  value={v.modalidad}
                  onChange={(e) => setV({ ...v, modalidad: e.target.value })}
                >
                  {MODALIDADES.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.nombre}
                    </MenuItem>
                  ))}
                </TextField>
                {v.modalidad !== "remota" && (
                  <TextField
                    id="vacante-ciudad"
                    label="Ciudad"
                    required
                    value={v.ciudad ?? ""}
                    onChange={(e) => setV({ ...v, ciudad: e.target.value })}
                    {...campo("ciudad")}
                  />
                )}
                <TextField
                  id="vacante-duracion"
                  label="Duración en meses"
                  type="number"
                  value={v.duracionMeses}
                  onChange={(e) =>
                    setV({ ...v, duracionMeses: Number(e.target.value) })
                  }
                  {...campo("duracionMeses")}
                />
                {(["fechaInicio", "vigencia"] as const).map((k) => (
                  <TextField
                    key={k}
                    id={`vacante-${k}`}
                    label={k === "fechaInicio" ? "Fecha de inicio" : "Vigencia"}
                    type="date"
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={v[k]}
                    onChange={(e) => setV({ ...v, [k]: e.target.value })}
                    {...campo(k)}
                  />
                ))}
              </>
            )}
            {paso === 1 && (
              <>
                <Stack
                  component="fieldset"
                  sx={{ border: 1, borderColor: "divider", p: 2 }}
                >
                  <Typography component="legend">
                    Niveles de formación aceptados (excluyente)
                  </Typography>
                  {NIVELES_FORMACION.map((n) => (
                    <FormControlLabel
                      key={n.id}
                      label={n.nombre}
                      control={
                        <Checkbox
                          checked={v.niveles.includes(n.id)}
                          onChange={(e) =>
                            setV({
                              ...v,
                              niveles: e.target.checked
                                ? [...v.niveles, n.id]
                                : v.niveles.filter((x) => x !== n.id),
                              avances: e.target.checked
                                ? v.avances
                                : v.avances.filter((a) => a.nivel !== n.id),
                            })
                          }
                        />
                      }
                    />
                  ))}
                  {errores.niveles && (
                    <Typography color="error">{errores.niveles}</Typography>
                  )}
                </Stack>
                <TextField
                  id="vacante-programas"
                  label="Programas solicitados (opcional)"
                  multiline
                  minRows={2}
                  helperText={
                    errores.programas ??
                    "Máximo cinco, uno por línea. La empresa revisa la afinidad; nunca bloquean."
                  }
                  error={!!errores.programas}
                  value={v.programas.join("\n")}
                  onChange={(e) =>
                    setV({
                      ...v,
                      programas: e.target.value
                        ? e.target.value.split("\n")
                        : [],
                    })
                  }
                />
                {v.niveles.map((n) => (
                  <TextField
                    key={n}
                    id={`avance-${n}`}
                    label={`Avance deseable: ${NIVELES_FORMACION.find((x) => x.id === n)?.nombre}`}
                    select
                    value={v.avances.find((a) => a.nivel === n)?.avance ?? ""}
                    onChange={(e) =>
                      setV({
                        ...v,
                        avances: [
                          ...v.avances.filter((a) => a.nivel !== n),
                          ...(e.target.value
                            ? [{ nivel: n, avance: e.target.value }]
                            : []),
                        ],
                      })
                    }
                  >
                    <MenuItem value="">Sin requisito de avance</MenuItem>
                    {avancesDe(n).map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.nombre}
                      </MenuItem>
                    ))}
                  </TextField>
                ))}
                <FormControlLabel
                  label="Aval deseable (no excluyente)"
                  control={
                    <Checkbox
                      checked={v.aval}
                      onChange={(e) => setV({ ...v, aval: e.target.checked })}
                    />
                  }
                />
                <TextField
                  id="vacante-jornada"
                  label="Jornada deseable"
                  select
                  value={v.jornada}
                  onChange={(e) => setV({ ...v, jornada: e.target.value })}
                >
                  {JORNADAS.map((j) => (
                    <MenuItem key={j.id} value={j.id}>
                      {j.nombre}
                    </MenuItem>
                  ))}
                </TextField>
                <Typography>
                  Idiomas deseables. No excluyen la postulación.
                </Typography>
                {v.idiomas.map((i, n) => (
                  <Stack key={n} spacing={1}>
                    <TextField
                      id={`idioma-${n}`}
                      label={`Idioma ${n + 1}`}
                      select
                      value={i.idioma}
                      onChange={(e) =>
                        setV({
                          ...v,
                          idiomas: v.idiomas.map((x, k) =>
                            k === n ? { ...x, idioma: e.target.value } : x,
                          ),
                        })
                      }
                    >
                      {IDIOMAS.map((x) => (
                        <MenuItem key={x.id} value={x.id}>
                          {x.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      id={`mcer-${n}`}
                      label={`Nivel de idioma ${n + 1}`}
                      select
                      value={i.nivel}
                      onChange={(e) =>
                        setV({
                          ...v,
                          idiomas: v.idiomas.map((x, k) =>
                            k === n ? { ...x, nivel: e.target.value } : x,
                          ),
                        })
                      }
                    >
                      {NIVELES_MCER.map((x) => (
                        <MenuItem key={x.id} value={x.id}>
                          {x.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      onClick={() =>
                        setV({
                          ...v,
                          idiomas: v.idiomas.filter((_, k) => k !== n),
                        })
                      }
                    >
                      Quitar idioma {n + 1}
                    </Button>
                  </Stack>
                ))}
                <Button
                  disabled={v.idiomas.length >= IDIOMAS.length}
                  onClick={() =>
                    setV({
                      ...v,
                      idiomas: [
                        ...v.idiomas,
                        { idioma: "ingles", nivel: "b1" },
                      ],
                    })
                  }
                >
                  Agregar idioma deseable
                </Button>
                {errores.idiomas && (
                  <Alert severity="error">{errores.idiomas}</Alert>
                )}
              </>
            )}
            {paso === 2 && (
              <>
                <Typography variant="h3" sx={{ fontSize: 20 }}>
                  {v.titulo}
                </Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>
                  {v.descripcion}
                </Typography>
                <Typography>
                  Modalidad: {v.modalidad}. Vigencia: {v.vigencia}. Inicio:{" "}
                  {v.fechaInicio}. Duración: {v.duracionMeses} meses.
                </Typography>
                <Typography>
                  Niveles excluyentes: {v.niveles.join(", ")}. Programas:{" "}
                  {v.programas.join(", ") || "No solicitados"} — La empresa
                  revisa la afinidad.
                </Typography>
                <Typography>
                  Jornada, aval, avance e idiomas son deseables y no bloquean.
                </Typography>
              </>
            )}
            <Stack direction="row" spacing={2}>
              {paso > 0 && (
                <Button onClick={() => setPaso(paso - 1)}>Anterior</Button>
              )}
              {paso < 2 && (
                <Button
                  variant="contained"
                  onClick={() => {
                    if (validar()) setPaso(paso + 1);
                  }}
                >
                  Siguiente
                </Button>
              )}
            </Stack>
          </>
        )}
        {(paso === 2 || estado !== "Borrador") && (
          <Button
            type="submit"
            variant="contained"
            disabled={ocupado || estado === "Cerrada"}
          >
            {ocupado
              ? "Guardando…"
              : estado === "Borrador"
                ? "Guardar borrador"
                : "Guardar descripción"}
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
