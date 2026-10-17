import type { Metadata } from "next";
import { SinAcceso } from "@/components/Aviso";
import EnConstruccion from "@/components/EnConstruccion";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function MiPerfil() {
  if (!(await requireRole("estudiante", "/estudiante/perfil"))) return <SinAcceso role="empresa" />;
  return <EnConstruccion title="Mi perfil" modulo="M3 · Perfil del estudiante" />;
}
