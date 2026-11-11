import assert from "node:assert/strict";
import { test } from "node:test";
import { formato, ocultar, verificar, type Resultado } from "./verificar-proveedores.mts";

// Spec 011 (US7). Sin red: `fetch` y el almacén son sustitutos.
type Ruta = (url: string, init?: RequestInit) => Response | undefined;
function red(...rutas: Ruta[]) {
  const llamadas: string[] = [];
  const fetch = (async (entrada: string | URL | Request, init?: RequestInit) => {
    const url = String(entrada);
    llamadas.push(`${init?.method ?? "GET"} ${url}`);
    for (const r of rutas) {
      const res = r(url, init);
      if (res) return res;
    }
    throw new TypeError("fetch failed");
  }) as typeof globalThis.fetch;
  return { fetch, llamadas };
}
const json = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status });
const sinAlmacen = () => Promise.reject(new Error("no debería crearse"));
const de = (rs: Resultado[], p: Resultado["proveedor"]) => rs.find((r) => r.proveedor === p)!;

const RESEND = { RESEND_API_KEY: "re_secreta_123", CORREO_REMITENTE: "Praxis <no-responder@praxis.test>" };
const WOMPI = {
  WOMPI_ENV: "sandbox",
  WOMPI_PUBLIC_KEY: "pub_test_abc",
  WOMPI_INTEGRITY_SECRET: "test_integrity_secreta",
  WOMPI_EVENTS_SECRET: "test_events_secreta",
};
const dominios: Ruta = (u) =>
  u.endsWith("/domains") ? json({ data: [{ name: "praxis.test", status: "verified" }] }) : undefined;

test("sin credenciales: todo «sin configurar» y ninguna conexión", async () => {
  const { fetch, llamadas } = red();
  const rs = await verificar({}, { fetch, almacen: sinAlmacen });
  assert.deepEqual(rs.map((r) => r.estado), ["sin configurar", "sin configurar", "sin configurar"]);
  assert.deepEqual(llamadas, []);
});

test("pagos: una llave que no es de pruebas se rechaza antes de conectar", async () => {
  for (const env of [
    { ...WOMPI, WOMPI_PUBLIC_KEY: "pub_prod_abc" },
    { ...WOMPI, WOMPI_ENV: "production" },
    { ...WOMPI, WOMPI_EVENTS_SECRET: "" },
  ]) {
    const { fetch, llamadas } = red();
    const r = de(await verificar(env, { fetch, almacen: sinAlmacen }), "pagos");
    assert.equal(r.estado, "falla");
    assert.deepEqual(llamadas, []);
  }
});

test("pagos: con llaves de pruebas solo consulta el sandbox", async () => {
  const { fetch, llamadas } = red((u) => (u.includes("/merchants/") ? json({ data: {} }) : undefined));
  const r = de(await verificar(WOMPI, { fetch, almacen: sinAlmacen }), "pagos");
  assert.equal(r.estado, "listo");
  assert.deepEqual(llamadas, ["GET https://sandbox.wompi.co/v1/merchants/pub_test_abc"]);
});

test("correo: dominio sin verificar, llave rechazada y proveedor caído son fallos con causa", async () => {
  const casos: [Ruta[], RegExp][] = [
    [[(u) => (u.endsWith("/domains") ? json({ data: [{ name: "praxis.test", status: "pending" }] }) : undefined)], /no está verificado/],
    [[(u) => (u.endsWith("/domains") ? json({ data: [] }) : undefined)], /no está en la cuenta/],
    [[() => json({ name: "validation_error" }, 401)], /rechazó la llave \(401\)/],
    [[], /sin respuesta \(TypeError\)/],
  ];
  for (const [rutas, causa] of casos) {
    const r = de(await verificar(RESEND, { ...red(...rutas), almacen: sinAlmacen }), "correo");
    assert.equal(r.estado, "falla");
    assert.match(r.detalle, causa);
  }
});

test("correo: con --correo envía una prueba y mide hasta la entrega", async () => {
  let consultas = 0;
  const { fetch, llamadas } = red(
    dominios,
    (u, i) => (u.endsWith("/emails") && i?.method === "POST" ? json({ id: "abc" }) : undefined),
    (u) => (u.endsWith("/emails/abc") ? json({ last_event: ++consultas < 2 ? "sent" : "delivered" }) : undefined),
  );
  const r = de(await verificar(RESEND, { fetch, destino: "laura@correo.co", almacen: sinAlmacen, esperaMs: 200 }), "correo");
  assert.equal(r.estado, "listo");
  assert.match(r.detalle, /aceptado en \d+ ms, entregado en [\d.]+ s/);
  assert.equal(llamadas.filter((l) => l.startsWith("POST")).length, 1);
});

test("correo: un rebote o una entrega que no llega a tiempo es fallo", async () => {
  const envio: Ruta = (u, i) => (u.endsWith("/emails") && i?.method === "POST" ? json({ id: "abc" }) : undefined);
  for (const [evento, causa] of [["bounced", /«bounced»/], ["sent", /sin entrega confirmada/]] as const) {
    const { fetch } = red(dominios, envio, (u) => (u.endsWith("/emails/abc") ? json({ last_event: evento }) : undefined));
    const r = de(await verificar(RESEND, { fetch, destino: "laura@correo.co", almacen: sinAlmacen, esperaMs: 50 }), "correo");
    assert.equal(r.estado, "falla");
    assert.match(r.detalle, causa);
  }
});

test("archivos: comprueba el ciclo completo, niega el bucket público y limpia siempre", async () => {
  const env = { S3_BUCKET: "b", S3_ACCESS_KEY_ID: "k", S3_SECRET_ACCESS_KEY: "s" };
  const almacen = (publico: boolean) => {
    const objetos = new Map<string, Buffer>();
    const ruta: Ruta = (u) => {
      const url = new URL(u);
      const dato = objetos.get(url.pathname.slice(1));
      if (!dato || (!url.searchParams.has("firma") && !publico)) return new Response(null, { status: 403 });
      return new Response(new Uint8Array(dato));
    };
    return {
      objetos,
      ruta,
      crear: async () => ({
        guardar: async (c: string, d: Buffer) => void objetos.set(c, d),
        copiar: async (o: string, d: string) => void objetos.set(d, objetos.get(o)!),
        borrar: async (c: string) => void objetos.delete(c),
        enlace: async (c: string) => ({ url: `https://almacen.test/${c}?firma=1` }),
      }),
    };
  };
  const privado = almacen(false);
  const bien = de(await verificar(env, { ...red(privado.ruta), almacen: privado.crear }), "archivos");
  assert.equal(bien.estado, "listo");
  assert.equal(privado.objetos.size, 0);

  const abierto = almacen(true);
  const mal = de(await verificar(env, { ...red(abierto.ruta), almacen: abierto.crear }), "archivos");
  assert.equal(mal.estado, "falla");
  assert.match(mal.detalle, /público/);
  assert.equal(abierto.objetos.size, 0);

  const incompleto = de(await verificar({ S3_BUCKET: "b" }, { ...red(), almacen: sinAlmacen }), "archivos");
  assert.match(incompleto.detalle, /faltan S3_ACCESS_KEY_ID y S3_SECRET_ACCESS_KEY/);
});

test("la salida nunca contiene llaves ni el correo completo", async () => {
  const destino = "laura.gomez@correo.co";
  const escenarios: Ruta[][] = [
    [],
    [() => json({ message: "API key re_secreta_123 is invalid" }, 401)],
    [dominios, () => json({ message: `cannot send to ${destino}` }, 403)],
    [dominios, (u, i) => (i?.method === "POST" ? json({ id: "abc" }) : undefined), () => json({ last_event: "bounced" })],
  ];
  for (const rutas of escenarios) {
    const rs = await verificar({ ...RESEND, ...WOMPI }, { ...red(...rutas), destino, almacen: sinAlmacen, esperaMs: 50 });
    const salida = rs.map(formato).join("\n");
    for (const secreto of ["re_secreta_123", "test_integrity_secreta", "test_events_secreta", destino, "laura.gomez"])
      assert.ok(!salida.includes(secreto), `la salida filtra «${secreto}»:\n${salida}`);
  }
  assert.equal(ocultar(destino), "l***@correo.co");
  assert.equal(ocultar("sin-arroba-laura.gomez"), "***");
});
