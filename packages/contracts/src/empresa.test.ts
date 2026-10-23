import { describe, expect, it } from 'vitest';
import { empresaSchema } from './empresa.js';
const ficha = { razonSocial: 'Empresa Ficticia', nit: '900123456-8', sector: 'tecnologia', ciudad: 'Medellín', sitioWeb: 'https://example.test', descripcion: 'Prácticas de tecnología', correoContacto: 'contacto@example.test', telefono: '+57 300 000 0000' };
describe('M4: ficha declarada', () => {
  it('valida el NIT real por algoritmo y normaliza', () => {
    expect(empresaSchema.parse(ficha).nit).toBe('900123456');
    expect(empresaSchema.safeParse({ ...ficha, nit: '900123456-7' }).success).toBe(false);
  });
  it('rechaza sectores ajenos y enlaces ejecutables', () => {
    expect(empresaSchema.safeParse({ ...ficha, sector: 'inventado' }).success).toBe(false);
    expect(empresaSchema.safeParse({ ...ficha, sitioWeb: 'javascript:alert(1)' }).success).toBe(false);
  });
});
