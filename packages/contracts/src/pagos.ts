import { z } from "zod";
export const PLANES = {
  basico: { nombre: "Básico", centavos: 2990000, vacantes: 4 },
  ilimitado: { nombre: "Ilimitado", centavos: 5900000, vacantes: null },
} as const;
export const compraSchema = z.strictObject({
  plan: z.enum(["basico", "ilimitado"]),
});
export type Plan = z.infer<typeof compraSchema>["plan"];
export const transaccionWompiSchema = z.looseObject({
  id: z.string().min(1).max(100),
  status: z.string().min(1).max(30),
  amount_in_cents: z.number().int().positive().max(2147483647),
  currency: z.string().length(3),
  reference: z.string().min(1).max(255),
});
export const eventoWompiSchema = z.looseObject({
  event: z.literal("transaction.updated"),
  environment: z.literal("test"),
  timestamp: z.number().int().positive().safe(),
  data: z.looseObject({ transaction: transaccionWompiSchema }),
  signature: z.strictObject({
    properties: z.array(z.string().min(1).max(150)).min(1).max(20),
    checksum: z.string().regex(/^[a-fA-F0-9]{64}$/),
  }),
});
export type EventoWompi = z.infer<typeof eventoWompiSchema>;
