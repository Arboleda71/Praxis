// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, test } from "vitest";
import { config, proxy } from "./proxy";

// Spec 011 (FR-001): lo que llega a la API en x-praxis-ip/x-praxis-proxy lo pone siempre la web.
describe("proxy", () => {
  const reenviadas = (headers: Record<string, string>, ruta = "/api/auth/login") => {
    const res = proxy(new NextRequest(`http://localhost${ruta}`, { headers }));
    const h = res.headers;
    return {
      ip: h.get("x-middleware-request-x-praxis-ip"),
      secreto: h.get("x-middleware-request-x-praxis-proxy"),
      sobrescritas: h.get("x-middleware-override-headers") ?? "",
    };
  };
  afterEach(() => {
    delete process.env.PROXY_SECRETO;
  });

  test("declara la IP del visitante y el secreto, y descarta lo que traiga el cliente", () => {
    process.env.PROXY_SECRETO = "s".repeat(32);
    const r = reenviadas({
      "x-real-ip": "203.0.113.7",
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
      "X-Praxis-Ip": "192.0.2.66",
      "x-praxis-proxy": "adivinado",
    });
    expect(r.ip).toBe("203.0.113.7");
    expect(r.secreto).toBe("s".repeat(32));
  });

  test("sin x-real-ip usa el primer salto de x-forwarded-for", () => {
    process.env.PROXY_SECRETO = "s".repeat(32);
    expect(reenviadas({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" }).ip).toBe("198.51.100.1");
  });

  test("sin secreto configurado no declara nada y aun así borra lo del cliente", () => {
    const r = reenviadas({ "x-real-ip": "203.0.113.7", "x-praxis-ip": "192.0.2.66", "x-praxis-proxy": "x" });
    expect(r.ip).toBeNull();
    expect(r.secreto).toBeNull();
    expect(r.sobrescritas).not.toMatch(/x-praxis-ip/);
  });

  test("cubre /api en cualquier combinación de mayúsculas y deja fuera los estáticos", () => {
    const patron = new RegExp(`^${config.matcher.replace("/(", "/(?:")}$`);
    for (const ruta of ["/api/auth/login", "/API/auth/login", "/Api", "/ingresar"])
      expect(patron.test(ruta), ruta).toBe(true);
    for (const ruta of ["/_next/static/chunk.js", "/_next/image", "/favicon.ico"])
      expect(patron.test(ruta), ruta).toBe(false);
  });
});
