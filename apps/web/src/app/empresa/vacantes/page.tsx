import type { Metadata } from "next";
import { SinAcceso } from "@/components/Aviso";
import EnConstruccion from "@/components/EnConstruccion";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mis vacantes" };

export default async function MisVacantes() {
  if (!(await requireRole("empresa", "/empresa/vacantes"))) return <SinAcceso role="estudiante" />;
  return <EnConstruccion title="Mis vacantes" modulo="M5 · Vacantes de la empresa" />;
}
