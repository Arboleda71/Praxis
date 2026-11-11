# Quickstart: validar la spec 011

Requisitos: Docker y Node 24 (≥ 24.15). No ejecutar con la demo encendida (comparten la base de pruebas).

## 1. Entorno

```powershell
npm ci
npm exec --no --workspace api -- prisma generate
npm run db:test          # Postgres 17 y MinIO efímeros en loopback
```

## 2. Pruebas

```powershell
npm run test -w api -- --runInBand
npm run test:e2e -w api                     # incluye intentos, origen y archivos-s3
npm run test -w web
npm run test:scripts                        # verificación de proveedores con fetch sustituto
npm run test:e2e -w web -- --workers=1
```

Qué demuestra cada una:

| Prueba | Escenario de la spec |
|---|---|
| `apps/api/test/intentos.e2e-spec.ts` | US1.3 (sobrevive a otra instancia), US1.4 (50 simultáneos entre dos instancias → 5), segundos restantes |
| `apps/api/test/origen.e2e-spec.ts` | US1.1, US1.2, US1.5 |
| `apps/api/test/auth.e2e-spec.ts` | US5 (correo caído al registrar y al reenviar; el enlace anterior sigue sirviendo) |
| `apps/api/test/archivos-s3.e2e-spec.ts` | US6 |
| `apps/web/src/components/AccountMenu.test.tsx` | US2 |
| `apps/web/src/components/FormularioIngreso.test.tsx` | US3 |
| `apps/web/src/components/ConfirmacionCorreo.test.tsx` | US4 |
| `apps/web/e2e/bloqueo.spec.ts` | US1.2 a través de la web, US3.1 |
| `scripts/verificar-proveedores.test.mts` | US7 |

## 3. Verificación de proveedores

```powershell
npm run verificar:proveedores               # sin credenciales: tres «sin configurar», salida 0
```

Con credenciales en `apps/api/.env` (ver `docs/produccion.md`):

```powershell
npm run verificar:proveedores -- --correo tu-correo@dominio
```

Esperado: `correo: listo` con el tiempo hasta aceptado y hasta entregado; `archivos: listo`;
`pagos: listo (sandbox)`.

## 4. Revisión manual breve

1. Ingreso: fallar 5 veces → el aviso dice los minutos que faltan; el botón vuelve solo.
2. Abrir un enlace de confirmación con la API detenida → «No pudimos conectar», no «ya no sirve».
3. Cerrar sesión con la API detenida → aviso, y la sesión sigue visible.
