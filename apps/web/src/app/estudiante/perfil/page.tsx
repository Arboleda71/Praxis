import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import RadioButtonUncheckedRounded from "@mui/icons-material/RadioButtonUncheckedRounded";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  AVANCES,
  IDIOMAS,
  JORNADAS,
  NIVELES_FORMACION,
  NIVELES_MCER,
  NOMBRES_MINIMO,
  nombreDe,
  rotuloAval,
  type CampoMinimo,
} from "@praxis/contracts";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SinAcceso } from "@/components/Aviso";
import AvisoGuardado from "@/components/perfil/AvisoGuardado";
import EncabezadoPerfil from "@/components/perfil/EncabezadoPerfil";
import FaltaInformacion from "@/components/perfil/FaltaInformacion";
import SeccionPerfil, { Campo } from "@/components/perfil/SeccionPerfil";
import SubidaArchivo from "@/components/perfil/SubidaArchivo";
import { getPerfil, urlFoto, type Perfil } from "@/lib/perfil";
import { fechaLarga } from "@/lib/perfil-cliente";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mi perfil" };

const R = "/estudiante/perfil";
const SECCION_DE: Record<CampoMinimo, string> = {
  nivelFormacion: `${R}/formacion`,
  programa: `${R}/formacion`,
  hojaDeVida: `${R}/hoja-de-vida`,
};

const lista = (nombres: string[]) =>
  nombres.length > 1
    ? `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`
    : nombres[0];

/** Primera vez: nada declarado todavía. */
const vacio = (p: Perfil) =>
  Object.values(p.formacion).every((v) => !v) &&
  !p.disponibilidad.disponibleDesde &&
  !p.disponibilidad.jornada &&
  p.disponibilidad.idiomas.length === 0 &&
  p.aval === null &&
  Object.values(p.archivos).every((a) => !a);

export default async function MiPerfil() {
  if (!(await requireRole("estudiante", R)))
    return <SinAcceso role="empresa" />;
  const perfil = await getPerfil();
  if (!perfil) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          No pudimos cargar tu perfil. Recarga la página en unos segundos.
        </Alert>
      </Box>
    );
  }
  const fotoUrl = await urlFoto(perfil);
  const primerNombre = perfil.nombre.split(" ")[0];

  return (
    <Box
      sx={{
        px: { xs: 2, md: 7 },
        py: { xs: 3, md: 5 },
        maxWidth: 1080,
        mx: "auto",
        width: "100%",
      }}
    >
      {vacio(perfil) ? (
        <Stack spacing={2.5} sx={{ maxWidth: 560, mx: "auto" }}>
          <EncabezadoPerfil
            nombre={perfil.nombre}
            titulo={`Hola, ${primerNombre}`}
            fotoUrl={fotoUrl}
          />
          <Typography color="text.secondary">
            Completa tu perfil para postularte a prácticas. Solo lo ves tú y las
            empresas a cuyas vacantes te postules.
          </Typography>
          <Guia />
          <Opcionales />
        </Stack>
      ) : (
        <Stack spacing={3}>
          <EncabezadoPerfil
            nombre={perfil.nombre}
            titulo={perfil.nombre}
            fotoUrl={fotoUrl}
          />
          <Typography color="text.secondary">
            Solo lo ves tú y las empresas a cuyas vacantes te postules.
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
              alignItems: "start",
            }}
          >
            <Resumen perfil={perfil} />
            <Secciones perfil={perfil} />
          </Box>
        </Stack>
      )}
      <Suspense>
        <AvisoGuardado />
      </Suspense>
    </Box>
  );
}

function Guia() {
  const pasos = [
    ["Nivel de formación", "Técnico, tecnólogo o universitario"],
    ["Programa", "Escríbelo como aparece en tu institución"],
    ["Hoja de vida", "Un PDF de máximo 5 MB"],
  ];
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderColor: "primary.main", borderRadius: 2 }}
    >
      <Typography variant="h2" sx={{ fontSize: 18 }}>
        Empieza por tu perfil mínimo
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Sin estos 3 datos no puedes postularte.
      </Typography>
      <Box
        component="ol"
        sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 2 }}
      >
        {pasos.map(([t, d], i) => (
          <Stack
            component="li"
            key={t}
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center" }}
          >
            <Box
              aria-hidden
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                bgcolor: "#DBEAFE",
                color: "primary.main",
                fontWeight: 600,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600 }}>{t}</Typography>
              <Typography variant="body2" color="text.secondary">
                {d}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              Falta
            </Typography>
          </Stack>
        ))}
      </Box>
      <Button
        href={`${R}/formacion`}
        variant="contained"
        fullWidth
        sx={{ mt: 2.5 }}
      >
        Completar mi formación
      </Button>
    </Paper>
  );
}

function Opcionales() {
  const filas = [
    ["Disponibilidad e idiomas", `${R}/disponibilidad`],
    ["Aval", `${R}/aval`],
  ];
  return (
    <Stack spacing={1}>
      <Typography variant="h2" sx={{ fontSize: 16 }}>
        Después, si quieres
      </Typography>
      <Typography color="text.secondary">
        Avance académico, disponibilidad, idiomas y aval. Son opcionales:
        informan a la empresa, pero no te impiden postularte.
      </Typography>
      <Paper
        variant="outlined"
        component="ul"
        sx={{ listStyle: "none", m: 0, p: 0, borderRadius: 2 }}
      >
        {filas.map(([t, href], i) => (
          <li key={t}>
            <Link
              href={href}
              underline="none"
              color="inherit"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                minHeight: 52,
                px: 2,
                borderTop: i ? 1 : 0,
                borderColor: "grey.300",
              }}
            >
              <Typography sx={{ flex: 1 }}>{t}</Typography>
              <FaltaInformacion campo={t} />
              <ChevronRightRounded aria-hidden color="action" />
            </Link>
          </li>
        ))}
      </Paper>
    </Stack>
  );
}

function Resumen({ perfil }: { perfil: Perfil }) {
  const { completo, faltan } = perfil.perfilMinimo;
  return (
    <Stack spacing={2}>
      {completo ? (
        <Alert severity="success">
          <AlertTitle>Perfil mínimo completo</AlertTitle>
          Tienes nivel de formación, programa y hoja de vida. Ya puedes
          postularte.
        </Alert>
      ) : (
        <Alert severity="warning">
          <AlertTitle>Perfil mínimo incompleto</AlertTitle>
          Para postularte te falta:{" "}
          {lista(faltan.map((f) => NOMBRES_MINIMO[f]))}.
        </Alert>
      )}
      <Paper
        variant="outlined"
        sx={{ p: 2, borderRadius: 2, display: { xs: "none", md: "block" } }}
      >
        <Typography variant="h2" sx={{ fontSize: 16, mb: 1.5 }}>
          Perfil mínimo
        </Typography>
        <Stack
          component="ul"
          spacing={1.5}
          sx={{ listStyle: "none", m: 0, p: 0 }}
        >
          {(Object.keys(NOMBRES_MINIMO) as CampoMinimo[]).map((c) => {
            const listo = !faltan.includes(c);
            return (
              <Stack
                component="li"
                key={c}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center" }}
              >
                {listo ? (
                  <CheckCircleRounded aria-hidden color="success" />
                ) : (
                  <RadioButtonUncheckedRounded aria-hidden color="action" />
                )}
                <Typography
                  sx={{
                    flex: 1,
                    "&::first-letter": { textTransform: "uppercase" },
                  }}
                >
                  {NOMBRES_MINIMO[c]}
                </Typography>
                {listo ? (
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "success.dark" }}
                  >
                    Listo
                  </Typography>
                ) : (
                  <Link
                    href={SECCION_DE[c]}
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                    aria-label={`Falta. Completar ${NOMBRES_MINIMO[c]}`}
                  >
                    Falta
                  </Link>
                )}
              </Stack>
            );
          })}
        </Stack>
      </Paper>
    </Stack>
  );
}

function Secciones({ perfil }: { perfil: Perfil }) {
  const { formacion: f, disponibilidad: d, archivos } = perfil;
  const aval = rotuloAval(perfil.aval, !!archivos.soporteAval);
  return (
    <Stack spacing={2}>
      <SeccionPerfil titulo="Formación" editar={`${R}/formacion`}>
        <Campo
          etiqueta="Nivel de formación"
          valor={
            f.nivelFormacion && nombreDe(NIVELES_FORMACION, f.nivelFormacion)
          }
          completar={`${R}/formacion`}
        />
        <Campo
          etiqueta="Programa"
          valor={f.programa}
          completar={`${R}/formacion`}
        />
        <Campo
          etiqueta="Institución"
          valor={f.institucion}
          completar={`${R}/formacion`}
        />
        <Campo
          etiqueta="Avance académico"
          valor={f.avance && nombreDe(AVANCES, f.avance)}
          completar={`${R}/formacion`}
        />
      </SeccionPerfil>

      <SeccionPerfil titulo="Disponibilidad" editar={`${R}/disponibilidad`}>
        <Campo
          etiqueta="Disponible desde"
          valor={d.disponibleDesde && fechaLarga(d.disponibleDesde)}
          completar={`${R}/disponibilidad`}
        />
        <Campo
          etiqueta="Jornada"
          valor={d.jornada && nombreDe(JORNADAS, d.jornada)}
          completar={`${R}/disponibilidad`}
        />
      </SeccionPerfil>

      <SeccionPerfil titulo="Idiomas" editar={`${R}/disponibilidad`}>
        {d.idiomas.length ? (
          d.idiomas.map((i) => (
            <Campo
              key={i.idioma}
              etiqueta={nombreDe(IDIOMAS, i.idioma)!}
              valor={nombreDe(NIVELES_MCER, i.nivel)}
            />
          ))
        ) : (
          <FaltaInformacion href={`${R}/disponibilidad`} campo="idiomas" />
        )}
      </SeccionPerfil>

      <SeccionPerfil titulo="Aval" editar={`${R}/aval`}>
        {aval ? (
          <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: "center",
                px: 1,
                py: 0.25,
                border: 1,
                borderColor: "grey.400",
                borderRadius: 4,
              }}
            >
              <DescriptionOutlined
                aria-hidden
                fontSize="small"
                color="action"
              />
              <Typography variant="body2">{aval}</Typography>
            </Stack>
            {!archivos.soporteAval && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Subir el soporte es opcional, pero ayuda a la empresa a
                  revisar tu postulación.
                </Typography>
                <Link href={`${R}/aval`} sx={{ fontWeight: 600, py: 0.5 }}>
                  Subir soporte del aval
                </Link>
              </>
            )}
          </Stack>
        ) : perfil.aval === false ? (
          <Typography>No tengo aval de mi institución</Typography>
        ) : (
          <FaltaInformacion href={`${R}/aval`} campo="aval" />
        )}
      </SeccionPerfil>

      <SeccionPerfil titulo="Hoja de vida">
        {!archivos.hojaDeVida && (
          <Stack spacing={1}>
            <FaltaInformacion campo="hoja de vida" />
            <Typography variant="body2" color="text.secondary">
              Es parte del perfil mínimo. Súbela en PDF, de máximo 5 MB.
            </Typography>
          </Stack>
        )}
        <SubidaArchivo
          tipo="hoja-de-vida"
          actual={archivos.hojaDeVida}
          etiqueta="hoja de vida"
        />
      </SeccionPerfil>
    </Stack>
  );
}
