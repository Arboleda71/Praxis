/**
 * Comprueba correo, archivos y pagos con la configuración presente (spec 011, FR-021/FR-022).
 *   npm run verificar:proveedores [-- --correo destino@dominio]
 * Nunca imprime llaves ni el correo completo; nunca habla con pagos reales.
 */
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type Resultado = {
  proveedor: "correo" | "archivos" | "pagos";
  estado: "listo" | "falla" | "sin configurar";
  detalle: string;
  ms: number;
};
type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;
type Parcial = Omit<Resultado, "proveedor" | "ms">;
/** Lo que el script necesita de `apps/api/src/perfil/archivos.ts`: prueba el mismo código que producción. */
type Almacen = {
  guardar(clave: string, datos: Buffer): Promise<unknown>;
  copiar(origen: string, destino: string): Promise<unknown>;
  borrar(clave: string): Promise<unknown>;
  enlace(clave: string): Promise<{ url: string }>;
};

const listo = (detalle: string): Parcial => ({ estado: "listo", detalle });
const falla = (detalle: string): Parcial => ({ estado: "falla", detalle });
const SIN: Parcial = { estado: "sin configurar", detalle: "" };
const LIMITE = () => AbortSignal.timeout(10_000);
export const ocultar = (correo: string) =>
  /^.+@.+$/.test(correo) ? correo.replace(/^(.).*(@.*)$/, "$1***$2") : "***";

export async function verificarCorreo(
  env: Env,
  fetch: Fetch,
  destino?: string,
  esperaMs = 60_000,
): Promise<Parcial> {
  const clave = env.RESEND_API_KEY;
  if (!clave) return SIN;
  const remitente = env.CORREO_REMITENTE;
  if (!remitente) return falla("falta CORREO_REMITENTE");
  const cabeceras = { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" };

  const dominios = await fetch("https://api.resend.com/domains", { headers: cabeceras, signal: LIMITE() });
  let notas = "";
  if (dominios.ok) {
    const dominio = remitente.match(/@([^>\s]+)>?\s*$/)?.[1]?.toLowerCase();
    const { data = [] } = (await dominios.json()) as { data?: { name: string; status: string }[] };
    const d = data.find((x) => x.name.toLowerCase() === dominio);
    if (!d) return falla(`el dominio remitente ${dominio ?? "(ilegible)"} no está en la cuenta de Resend`);
    if (d.status !== "verified") return falla(`el dominio ${d.name} no está verificado (${d.status})`);
    notas = `llave válida, dominio ${d.name} verificado`;
  } else if (dominios.status === 401 && /restricted/.test(await dominios.text())) {
    // Una llave «solo de envío» no puede listar dominios: solo se comprueba enviando.
    if (!destino) return falla("la llave es solo de envío: ejecuta con --correo para comprobarla enviando");
    notas = "llave solo de envío";
  } else return falla(`Resend rechazó la llave (${dominios.status})`);
  if (!destino) return listo(`${notas}; usa --correo para medir la entrega`);

  const inicio = Date.now();
  const envio = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: cabeceras,
    signal: LIMITE(),
    body: JSON.stringify({
      from: remitente,
      to: destino,
      subject: "Prueba de entrega de Praxis",
      html: "<p>Correo de prueba de la verificación de proveedores de Praxis. Puedes ignorarlo.</p>",
    }),
  });
  if (!envio.ok) return falla(`Resend no aceptó el envío a ${ocultar(destino)} (${envio.status})`);
  const aceptado = Date.now() - inicio;
  const { id } = (await envio.json()) as { id: string };
  let evento = "sin consultar";
  while (Date.now() - inicio < esperaMs) {
    const res = await fetch(`https://api.resend.com/emails/${id}`, { headers: cabeceras, signal: LIMITE() });
    if (!res.ok) return listo(`${notas}; aceptado en ${aceptado} ms; la llave no permite consultar la entrega`);
    evento = ((await res.json()) as { last_event?: string }).last_event ?? "desconocido";
    if (evento === "delivered")
      return listo(`${notas}; aceptado en ${aceptado} ms, entregado en ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
    if (["bounced", "failed", "suppressed", "complained", "canceled"].includes(evento))
      return falla(`aceptado, pero el envío a ${ocultar(destino)} terminó en «${evento}»`);
    await new Promise((r) => setTimeout(r, Math.min(2000, esperaMs / 10)));
  }
  return falla(`aceptado en ${aceptado} ms, sin entrega confirmada en ${esperaMs / 1000} s (último estado: ${evento})`);
}

export async function verificarArchivos(env: Env, fetch: Fetch, crear: () => Promise<Almacen>): Promise<Parcial> {
  if (!env.S3_BUCKET) return SIN;
  const faltan = ["S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"].filter((k) => !env[k]);
  if (faltan.length) return falla(`faltan ${faltan.join(" y ")}`);
  const almacen = await crear();
  const [a, b] = [`${randomUUID()}.pdf`, `${randomUUID()}.pdf`];
  const datos = Buffer.from(`%PDF-1.4 verificación ${a}`);
  try {
    await almacen.guardar(a, datos);
    const { url } = await almacen.enlace(a);
    const firmado = await fetch(url, { signal: LIMITE() });
    if (!firmado.ok || !Buffer.from(await firmado.arrayBuffer()).equals(datos))
      return falla(`el enlace firmado no devolvió el archivo (${firmado.status})`);
    const sinFirma = await fetch(url.split("?")[0], { signal: LIMITE() });
    if (sinFirma.ok) return falla("el bucket es público: el archivo se pudo leer sin firma");
    await almacen.copiar(a, b);
    const copia = await fetch((await almacen.enlace(b)).url, { signal: LIMITE() });
    if (!copia.ok) return falla(`la copia no se pudo leer (${copia.status})`);
    return listo("guardar, enlace firmado, lectura sin firma negada, copiar y borrar");
  } finally {
    await Promise.allSettled([almacen.borrar(a), almacen.borrar(b)]);
  }
}

export async function verificarPagos(env: Env, fetch: Fetch): Promise<Parcial> {
  const llaves = [
    ["WOMPI_PUBLIC_KEY", "pub_test_"],
    ["WOMPI_INTEGRITY_SECRET", "test_integrity_"],
    ["WOMPI_EVENTS_SECRET", "test_events_"],
  ] as const;
  if (llaves.every(([k]) => !env[k])) return SIN;
  // Antes de cualquier conexión: el piloto solo admite el ambiente de pruebas (constitución, VIII).
  if (env.WOMPI_ENV !== "sandbox") return falla("WOMPI_ENV debe ser sandbox");
  const faltan = llaves.filter(([k]) => !env[k]).map(([k]) => k);
  if (faltan.length) return falla(`faltan ${faltan.join(", ")}`);
  const malas = llaves.filter(([k, p]) => !env[k]!.startsWith(p)).map(([k]) => k);
  if (malas.length) return falla(`${malas.join(", ")} no ${malas.length > 1 ? "son llaves" : "es una llave"} de pruebas`);
  const res = await fetch(`https://sandbox.wompi.co/v1/merchants/${encodeURIComponent(env.WOMPI_PUBLIC_KEY!)}`, {
    signal: LIMITE(),
  });
  if (!res.ok) return falla(`Wompi sandbox no reconoce la llave pública (${res.status})`);
  return listo("sandbox: llave pública reconocida; integridad y eventos solo se comprueban con un pago de prueba");
}

export async function verificar(
  env: Env,
  o: { fetch: Fetch; destino?: string; almacen: () => Promise<Almacen>; esperaMs?: number },
): Promise<Resultado[]> {
  const pasos: [Resultado["proveedor"], () => Promise<Parcial>][] = [
    ["correo", () => verificarCorreo(env, o.fetch, o.destino, o.esperaMs)],
    ["archivos", () => verificarArchivos(env, o.fetch, o.almacen)],
    ["pagos", () => verificarPagos(env, o.fetch)],
  ];
  const resultados: Resultado[] = [];
  for (const [proveedor, paso] of pasos) {
    const inicio = Date.now();
    // El mensaje de un error puede traer una URL firmada o una llave: solo se muestra su tipo.
    const r = await paso().catch((e: unknown) => falla(`sin respuesta (${(e as Error)?.name ?? "error"})`));
    resultados.push({ proveedor, ...r, ms: Date.now() - inicio });
  }
  return resultados;
}

export const formato = (r: Resultado) =>
  `${r.proveedor.padEnd(9)} ${r.estado === "falla" ? `falla: ${r.detalle}` : r.detalle ? `${r.estado} (${r.detalle})` : r.estado}  [${r.ms} ms]`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  try {
    process.loadEnvFile(resolve(raiz, "apps/api/.env"));
  } catch {
    /* También admite variables del entorno. */
  }
  const i = process.argv.indexOf("--correo");
  const resultados = await verificar(process.env, {
    fetch,
    destino: i > 0 ? process.argv[i + 1] : undefined,
    almacen: async () => {
      const modulo = "../apps/api/dist/perfil/archivos.js";
      return new (await import(modulo)).Archivos() as Almacen;
    },
  });
  for (const r of resultados) console.log(formato(r));
  process.exitCode = resultados.some((r) => r.estado === "falla") ? 1 : 0;
}
