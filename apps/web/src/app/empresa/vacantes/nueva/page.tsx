import FormularioVacante from '@/components/FormularioVacante';
import { SinAcceso } from '@/components/Aviso';
import { requireRole } from '@/lib/session';
export const metadata = { title: 'Crear vacante' };
export default async function Nueva() { if (!await requireRole('empresa', '/empresa/vacantes/nueva')) return <SinAcceso role="estudiante" />; return <FormularioVacante />; }
