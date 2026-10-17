import type { Metadata } from "next";
import { NoEncontrada } from "@/components/Aviso";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return <NoEncontrada />;
}
