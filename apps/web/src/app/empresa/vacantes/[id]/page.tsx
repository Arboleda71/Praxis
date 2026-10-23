import FormularioVacante from '@/components/FormularioVacante';
import { SinAcceso } from '@/components/Aviso';
import { requireRole } from '@/lib/session';
export const metadata = { title: 'Editar vacante' };
export default async function Editar({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!await requireRole('empresa', `/empresa/vacantes/${id}`)) return <SinAcceso role="estudiante" />; return <FormularioVacante id={id} />; }
