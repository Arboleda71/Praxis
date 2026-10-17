import { BadRequestException, PipeTransform } from '@nestjs/common';

type Esquema<T> = {
  safeParse(v: unknown): { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
};

/** Valida el cuerpo con un esquema de @praxis/contracts. 400 con el primer error de cada campo. */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly esquema: Esquema<T>) {}

  transform(valor: unknown): T {
    const r = this.esquema.safeParse(valor);
    if (r.success) return r.data;
    const errores: Record<string, string> = {};
    for (const i of r.error.issues) errores[i.path.join('.') || '_'] ??= i.message;
    throw new BadRequestException({ errores });
  }
}
