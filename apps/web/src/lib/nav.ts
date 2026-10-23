import ApartmentRounded from "@mui/icons-material/ApartmentRounded";
import HomeRounded from "@mui/icons-material/HomeRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import WorkRounded from "@mui/icons-material/WorkRounded";
import type { SvgIconComponent } from "@mui/icons-material";

export type Role = "estudiante" | "empresa";
export type NavItem = { href: string; label: string; Icon: SvgIconComponent };

export const NAV: Record<Role, NavItem[]> = {
  estudiante: [
    { href: "/", label: "Inicio", Icon: HomeRounded },
    { href: "/estudiante/perfil", label: "Mi perfil", Icon: PersonRounded },
    { href: '/estudiante/vacantes', label: 'Buscar', Icon: WorkRounded },
    { href: '/estudiante/postulaciones', label: 'Postulaciones', Icon: ApartmentRounded },
  ],
  empresa: [
    { href: "/empresa/vacantes", label: "Mis vacantes", Icon: WorkRounded },
    { href: "/empresa/perfil", label: "Perfil de la empresa", Icon: ApartmentRounded },
  ],
};

/** Destino de la barra que corresponde a la ruta actual, o `false` si ninguno. */
export function currentHref(pathname: string, items: NavItem[]): string | false {
  const match = items.find(({ href }) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`),
  );
  return match?.href ?? false;
}
