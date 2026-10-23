import { periodoGratis, sumarMeses } from './vacantes.service.js';
describe('periodos de seis meses', () => {
  it('ajusta el último día del mes sin desbordar', () => {
    expect(sumarMeses(new Date('2024-08-31T12:00:00Z'), 6).toISOString()).toBe(
      '2025-02-28T12:00:00.000Z',
    );
  });
  it('cada periodo conserva el ancla de creación después de febrero', () => {
    expect(
      periodoGratis(
        new Date('2024-08-31T12:00:00Z'),
        new Date('2025-09-01T12:00:00Z'),
      ).toISOString(),
    ).toBe('2025-08-31T12:00:00.000Z');
  });
});
