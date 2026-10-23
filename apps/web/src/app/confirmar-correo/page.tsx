import ConfirmacionCorreo from '@/components/ConfirmacionCorreo';
export const metadata = { title: 'Confirmar correo' };
export default async function ConfirmarCorreo({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return <ConfirmacionCorreo token={(await searchParams).token} />;
}
