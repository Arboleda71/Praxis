import { createHash } from 'node:crypto';
import {
  configuracionSandbox,
  firmarIntegridad,
  validarFirmaEvento,
} from './wompi.js';
describe('Wompi exclusivamente sandbox', () => {
  it('rechaza llaves de producción y configuración incompleta', () => {
    expect(() =>
      configuracionSandbox({
        WOMPI_ENV: 'production',
        WOMPI_PUBLIC_KEY: 'pub_prod_ficticia',
      }),
    ).toThrow();
    expect(() => configuracionSandbox({})).toThrow();
  });
  it('firma importe y referencia fijados por el servidor', () => {
    expect(
      firmarIntegridad('referencia', 2990000, 'test_integrity_ficticio'),
    ).toBe(
      createHash('sha256')
        .update('referencia2990000COPtest_integrity_ficticio')
        .digest('hex'),
    );
  });
  it('autentica eventos y rechaza alteraciones y firmas inválidas', () => {
    const secreto = 'test_events_ficticio';
    const e = {
      event: 'transaction.updated',
      environment: 'test',
      data: {
        transaction: {
          id: 'sandbox-123',
          status: 'APPROVED',
          amount_in_cents: 2990000,
          currency: 'COP',
          reference: 'referencia',
        },
      },
      timestamp: 1234,
      signature: {
        properties: [
          'transaction.id',
          'transaction.status',
          'transaction.amount_in_cents',
        ],
        checksum: createHash('sha256')
          .update('sandbox-123APPROVED29900001234' + secreto)
          .digest('hex'),
      },
    };
    expect(validarFirmaEvento(e, secreto)).toBe(true);
    expect(
      validarFirmaEvento(
        {
          ...e,
          data: { transaction: { ...e.data.transaction, amount_in_cents: 1 } },
        },
        secreto,
      ),
    ).toBe(false);
    expect(validarFirmaEvento({ ...e, environment: 'prod' }, secreto)).toBe(
      false,
    );
  });
});
