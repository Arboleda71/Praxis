import { z } from 'zod';
import { AVANCES, JORNADAS, MODALIDADES, NIVELES_FORMACION, avanceDelNivel, idiomasSchema, valorDe } from './catalogos.js';
import { compararAvance, compararIdioma, estaEntre, coinciden, programasSolicitadosSchema, PROGRAMA_REVISA_EMPRESA, type Resultado } from './comparar.js';
import { perfilMinimo } from './perfil.js';

export const hoyBogota = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export const idSchema = z.uuid();
export const descripcionSchema = z.strictObject({ descripcion: z.string().trim().min(10).max(10000) });
export const vacanteSchema = z.strictObject({
  titulo: z.string().trim().min(5).max(150),
  descripcion: z.string().trim().min(10).max(10000),
  modalidad: valorDe(MODALIDADES), ciudad: z.string().trim().max(100).nullable(),
  duracionMeses: z.number().int().min(1).max(24),
  fechaInicio: z.iso.date(), vigencia: z.iso.date(),
  niveles: z.array(valorDe(NIVELES_FORMACION)).min(1).max(3).refine(a => new Set(a).size === a.length),
  programas: z.array(z.string()).max(5).refine(a => a.length === 0 || programasSolicitadosSchema.safeParse(a).success, { error: 'Escribe hasta cinco programas distintos, de 3 a 150 caracteres.' }),
  avances: z.array(z.strictObject({ nivel: valorDe(NIVELES_FORMACION), avance: valorDe(AVANCES) }).refine(a => avanceDelNivel(a.avance, a.nivel))).max(3),
  aval: z.boolean(), jornada: valorDe(JORNADAS), idiomas: idiomasSchema,
}).refine(v => v.modalidad === 'remota' || !!v.ciudad, { path: ['ciudad'], error: 'Escribe la ciudad para una práctica presencial o híbrida.' })
  .refine(v => v.vigencia > hoyBogota(), { path: ['vigencia'], error: 'La vigencia debe ser posterior a hoy.' })
  .refine(v => v.avances.every(a => v.niveles.includes(a.nivel)) && new Set(v.avances.map(a => a.nivel)).size === v.avances.length, { path: ['avances'], error: 'Declara como máximo un avance por cada nivel aceptado.' });
export type VacanteDatos = z.output<typeof vacanteSchema>;
export const busquedaSchema = z.strictObject({
  pagina: z.coerce.number().int().min(1).max(10000).default(1),
  q: z.string().trim().max(120).optional(), nivel: valorDe(NIVELES_FORMACION).optional(),
  modalidad: valorDe(MODALIDADES).optional(), ciudad: z.string().trim().max(100).optional(),
});
export type Busqueda = z.output<typeof busquedaSchema>;
export type PerfilElegible = { nivelFormacion: string | null; programa: string | null; hojaDeVida: boolean; avance: string | null; aval: boolean | null; jornada: string | null; disponibleDesde: string | null; idiomas: { idioma: string; nivel: string }[] };
export function evaluarElegibilidad(v: Pick<VacanteDatos, 'niveles' | 'programas' | 'avances' | 'aval' | 'jornada' | 'fechaInicio' | 'idiomas'>, p: PerfilElegible) {
  const requisitos: { requisito: string; excluyente: boolean; resultado: Resultado }[] = [];
  const agregar = (requisito: string, resultado: Resultado, excluyente = false) => requisitos.push({ requisito, resultado, excluyente });
  agregar('Nivel de formación', estaEntre(v.niveles, p.nivelFormacion ?? undefined), true);
  for (const a of v.avances) agregar(`Avance ${a.nivel}: ${a.avance}`, compararAvance(a, { nivel: p.nivelFormacion ?? undefined, avance: p.avance ?? undefined }));
  if (v.aval) agregar('Aval declarado', p.aval === null ? 'falta_informacion' : p.aval ? 'cumple' : 'no_cumple');
  agregar('Jornada', coinciden(v.jornada, p.jornada ?? undefined));
  agregar('Disponibilidad para la fecha de inicio', !p.disponibleDesde ? 'falta_informacion' : p.disponibleDesde <= v.fechaInicio ? 'cumple' : 'no_cumple');
  for (const i of v.idiomas) agregar(`Idioma ${i.idioma}: ${i.nivel}`, compararIdioma(i, p.idiomas));
  const minimo = perfilMinimo(p);
  return { puedePostular: minimo.completo && !requisitos.some(r => r.excluyente && r.resultado === 'no_cumple'), perfilMinimo: minimo, requisitos, programas: { solicitados: v.programas, declarado: p.programa, etiqueta: PROGRAMA_REVISA_EMPRESA } };
}
export const ESTADOS_POSTULACION = ['Enviada', 'En revisión', 'Entrevista', 'Seleccionada', 'Rechazada', 'Retirada'] as const;
export const cambioEstadoSchema = z.strictObject({ estado: z.enum(ESTADOS_POSTULACION) });
export const editarVacanteSchema = z.union([vacanteSchema, descripcionSchema]);
export const accionSchema = z.preprocess(v => v ?? {}, z.strictObject({}));
export const tipoArchivoSchema = z.enum(['hoja-de-vida', 'soporte-aval', 'foto']);
