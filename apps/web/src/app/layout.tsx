import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import AvisoConfirmar from "@/components/AvisoConfirmar";
import BottomNav from "@/components/BottomNav";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/session";
import MuiProvider from "./mui-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Praxis", template: "%s · Praxis" },
  description: "Portal especializado de prácticas profesionales",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html
      lang="es"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      {/* La barra inferior fija ocupa 56 px en móvil: el pie no queda debajo. */}
      <body className={`min-h-full flex flex-col ${session ? "pb-14 md:pb-0" : ""}`}>
        <MuiProvider>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-[#1E40AF] focus:outline-2"
          >
            Saltar al contenido
          </a>
          <SiteHeader session={session} />
          {session && !session.correoConfirmado && <AvisoConfirmar correo={session.correo} rol={session.rol} />}
          <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <SiteFooter />
          {session && <BottomNav role={session.rol} />}
        </MuiProvider>
      </body>
    </html>
  );
}
