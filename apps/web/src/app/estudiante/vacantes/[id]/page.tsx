import DetalleVacante from '@/components/DetalleVacante';
import { SinAcceso } from '@/components/Aviso';
import { requireRole } from '@/lib/session';
export const metadata = { title: 'Requisitos de la práctica' };
export default async function Detalle({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!await requireRole('estudiante', `/estudiante/vacantes/${id}`)) return <SinAcceso role="empresa" />; return <DetalleVacante id={id} />; }
