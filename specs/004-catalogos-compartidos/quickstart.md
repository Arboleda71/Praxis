# Quickstart: validar Catálogos compartidos

No requiere Postgres, API ni web: todo se valida en `packages/contracts`. Desde la raíz del repo.

```powershell
npm run test -w @praxis/contracts    # pruebas de catálogos y comparación
npm run build -w @praxis/contracts   # tipos y dist/ para la web y la API
npm run build -w api; npm run build -w web   # siguen compilando con el paquete nuevo
```

## Qué deben demostrar las pruebas

| Escenario | Spec |
|---|---|
| Mismo `id` en perfil y vacante → `cumple` | US1-1 |
| Valor fuera de la lista o retirado → rechazado con «Elige una opción de la lista.» | US1-2, FR-004 |
| Los 36 pares MCER dan el resultado esperado | US2-1, SC-002 |
| Idioma no declarado → `falta_informacion` | US2-2 |
| `sem-6` cumple `sem-5`; `productiva` cumple `lectiva`; avance de otro nivel → `falta_informacion` | US2-3, FR-009 |
| Avance de otro nivel → «Este avance no corresponde al nivel elegido.» (US3 de programas, retirada por v4.0.0) | FR-009 |
| Programas solicitados: 1 a 5, sin repetidos (ignora tildes y mayúsculas), con sus tres mensajes | FR-008 |
| `REQUISITOS_EXCLUYENTES` es solo `["nivelFormacion"]` | FR-017 |
| El conjunto de catálogos es exactamente el de [data-model.md](data-model.md) | US4, FR-006 |
| `id` únicos en cada catálogo; un retirado conserva su nombre en `nombreDe` | FR-003, FR-004 |
| Idioma repetido → «Ya agregaste este idioma.» | Edge case |
| Campo vacío → `falta_informacion`, nunca `no_cumple` | FR-016 |

Sin pantallas en M2. SC-005 (encontrar el programa en < 10 s) se retiró con la constitución v4.0.0: el programa
se escribe en texto libre.
