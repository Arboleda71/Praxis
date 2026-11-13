"use client";
import SearchOffRounded from "@mui/icons-material/SearchOffRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MODALIDADES, NIVELES_FORMACION, TAMANO_PAGINA } from "@praxis/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { AvisoError, EstadoVacio, TarjetaVacante } from "@/components/mercado-ui";
import { tactil } from "@/lib/estilos";
import { resumenVacante, solicitar, type Lista, type Vacante } from "@/lib/mercado";

const SIN_FILTROS = { q: "", nivel: "", modalidad: "", ciudad: "" };
type Filtros = typeof SIN_FILTROS;

function pedir(filtros: Filtros, pagina: number) {
  const q = new URLSearchParams({ pagina: String(pagina) });
  for (const [k, v] of Object.entries(filtros)) if (v) q.set(k, v);
  return solicitar<Lista<Vacante>>(`/vacantes?${q}`);
}

/** Búsqueda del estudiante (mockups M6 · Grupo 2): título y filtros de nivel, modalidad y ciudad; 20 por página. */
export default function BuscarVacantes() {
  const [lista, setLista] = useState<Lista<Vacante> | null>(null);
  const [error, setError] = useState("");
  // `f` es lo que se está escribiendo; `aplicados`, lo último que se buscó. La paginación usa `aplicados`:
  // «Siguiente» no debe aplicar un filtro que todavía no se ha enviado con «Buscar».
  const [f, setF] = useState(SIN_FILTROS);
  const [aplicados, setAplicados] = useState(SIN_FILTROS);
  // Turno de la petición más reciente. Una respuesta que llega tarde (p. ej. la carga inicial después de
  // una búsqueda) ya no es la última y no toca ni los resultados ni el error.
  const turno = useRef(0);
  const [cargando, setCargando] = useState(true);
  // Al cambiar de página el botón pulsado puede desaparecer o deshabilitarse: el foco pasa al resumen de
  // resultados, que además dice en qué página se está (WCAG 2.4.3).
  const resumen = useRef<HTMLParagraphElement>(null);
  const enfocarResumen = useRef(false);
  // Lo último que se pidió, para reintentarlo tal cual (misma página y filtros) si falla.
  const ultima = useRef<[Filtros, number]>([SIN_FILTROS, 1]);
  const cargar = useCallback((filtros: Filtros, pagina: number) => {
    const mio = ++turno.current;
    ultima.current = [filtros, pagina];
    return pedir(filtros, pagina).then(
      (datos) => {
        if (mio !== turno.current) return;
        setLista(datos);
        setError("");
        setCargando(false);
      },
      (e: Error) => {
        if (mio !== turno.current) return;
        // Los resultados anteriores ya no corresponden a lo pedido: no se dejan bajo el aviso como si lo fueran.
        setLista(null);
        setError(e.message);
        setCargando(false);
      },
    );
  }, []);
  useEffect(() => {
    if (!enfocarResumen.current || cargando || !lista) return;
    enfocarResumen.current = false;
    resumen.current?.focus();
  }, [cargando, lista]);
  function paginar(pagina: number) {
    enfocarResumen.current = true;
    setCargando(true);
    void cargar(aplicados, pagina);
  }
  // Carga inicial; los filtros se aplican al enviar el formulario.
  useEffect(() => {
    void cargar(SIN_FILTROS, 1);
  }, [cargar]);
  function buscar(filtros: Filtros) {
    setCargando(true);
    setF(filtros);
    setAplicados(filtros);
    void cargar(filtros, 1);
  }
  const conFiltros = Object.values(aplicados).some(Boolean);
  const campo = (clave: keyof Filtros) => ({
    value: f[clave],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const valor = e.target.value;
      setF((previo) => ({ ...previo, [clave]: valor }));
    },
    sx: { flex: 1 },
  });

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }} sx={{ width: "100%", maxWidth: 960, mx: "auto", px: { xs: 2, md: 3 }, pt: { xs: 3, md: 5 }, pb: { xs: 4, md: 5 } }}>
      <Typography variant="h1" sx={{ fontSize: 28 }}>
        Buscar prácticas
      </Typography>
      <Stack
        component="form"
        spacing={{ xs: 2, md: 2.5 }}
        sx={{ alignItems: { md: "flex-start" } }}
        onSubmit={(e) => {
          e.preventDefault();
          buscar(f);
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ width: "100%" }}>
          <TextField id="buscar-titulo" label="Buscar por título" {...campo("q")} />
          <TextField id="buscar-nivel" select label="Nivel de formación" {...campo("nivel")}>
            <MenuItem value="">Todos</MenuItem>
            {NIVELES_FORMACION.map((n) => (
              <MenuItem key={n.id} value={n.id}>
                {n.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField id="buscar-modalidad" select label="Modalidad" {...campo("modalidad")}>
            <MenuItem value="">Todas</MenuItem>
            {MODALIDADES.map((n) => (
              <MenuItem key={n.id} value={n.id}>
                {n.nombre}
              </MenuItem>
            ))}
          </TextField>
          <TextField id="buscar-ciudad" label="Ciudad (ubicación de la práctica)" {...campo("ciudad")} />
        </Stack>
        <Button type="submit" variant="contained" sx={{ ...tactil, width: { xs: "100%", md: "auto" } }}>
          {cargando && lista ? "Buscando…" : "Buscar"}
        </Button>
      </Stack>
      {error && (
        <AvisoError
          mensaje={error}
          reintentar={() => {
            setCargando(true);
            void cargar(...ultima.current);
          }}
        />
      )}
      {!lista ? (
        !error && <Typography role="status">Cargando prácticas…</Typography>
      ) : lista.total === 0 ? (
        <EstadoVacio icono={<SearchOffRounded fontSize="large" />} mensaje="No hay prácticas abiertas con estos criterios.">
          {conFiltros && (
            <>
              <Typography color="text.secondary">Prueba con menos filtros o con otra palabra del título.</Typography>
              <Button variant="outlined" sx={tactil} onClick={() => buscar(SIN_FILTROS)}>
                Limpiar búsqueda
              </Button>
            </>
          )}
        </EstadoVacio>
      ) : (
        <>
          <Typography ref={resumen} tabIndex={-1} role="status" variant="body2" color="text.secondary" sx={{ outline: "none", scrollMarginTop: 80 }}>
            Página {lista.pagina}. {lista.total} {lista.total === 1 ? "resultado" : "resultados"}.
          </Typography>
          {lista.items.map((v) => (
            <TarjetaVacante
              key={v.id}
              titulo={v.titulo}
              datos={resumenVacante(v)}
              href={`/estudiante/vacantes/${v.id}`}
              accion="Ver requisitos"
            />
          ))}
          <Stack component="nav" aria-label="Páginas de resultados" direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
            <Button sx={tactil} disabled={cargando || lista.pagina === 1} onClick={() => paginar(lista.pagina - 1)}>
              Anterior
            </Button>
            <Box component="span" sx={{ color: "text.secondary" }}>
              Página {lista.pagina}
            </Box>
            <Button sx={tactil} disabled={cargando || lista.pagina * TAMANO_PAGINA >= lista.total} onClick={() => paginar(lista.pagina + 1)}>
              Siguiente
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}
