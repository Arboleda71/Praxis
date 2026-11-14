import { Alert, Button, Stack, Typography } from "@mui/material";
export const metadata = { title: "Cuenta eliminada" };
export default async function Pagina({ searchParams }: { searchParams: Promise<{ pendientes?: string }> }) {
  const pendientes = (await searchParams).pendientes === "1";
  return <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto", p: 2, py: 6 }}>
    <Typography variant="h1" sx={{ fontSize: 28 }}>Tu cuenta fue eliminada</Typography>
    <Typography>Anonimizamos tus datos y cerramos todas tus sesiones. El historial se conserva sin identificarte.</Typography>
    {pendientes ? <Alert severity="warning">El almacenamiento no confirmó todos los borrados. La eliminación de archivos seguirá reintentándose; los enlaces ya emitidos pueden durar hasta cinco minutos.</Alert> : <Typography>Los archivos asociados fueron eliminados.</Typography>}
    <Button variant="contained" href="/">Volver al inicio</Button>
  </Stack>;
}
