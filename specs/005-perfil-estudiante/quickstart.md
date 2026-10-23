# Quickstart: validar Perfil del estudiante

Requisitos: Postgres local con `praxis`, `praxis_test` y `praxis_e2e` (como en M1); `apps/api/.env` con
`ARCHIVOS_SECRETO` (ver `.env.example`). Todo desde la raíz.

```powershell
npm run build -w @praxis/contracts
npm exec --no --workspace api -- prisma migrate dev     # aplica la migración `perfil`
npm run test -w @praxis/contracts                       # perfil mínimo, esquemas, tipo por contenido
npm run test:e2e -w api                                 # /perfil contra praxis_test
npm run test:e2e -w web -- --workers=2                  # recorrido y axe a 360 y 1080 px
```

## Qué deben demostrar

| Escenario | Spec |
|---|---|
| Cuenta nueva: guía con 3 pasos «Falta»; tras nivel + programa + CV, «Perfil mínimo completo» | US1, FR-003 |
| Avance de otro nivel, idioma repetido, valor fuera de catálogo → 400 con el mensaje de M2; programa de menos de 3 caracteres → «Escribe el nombre completo de tu programa.» | US2, FR-005, FR-009 |
| Cambiar el nivel vacía solo el avance; el programa escrito se conserva | Edge case (v4.0.0) |
| .docx renombrado a .pdf → rechazado por contenido; PDF de 6 MB → 413 con el límite | US3, FR-011/012 |
| Reemplazar CV: el enlace del anterior deja de servir | FR-015 |
| `DELETE` de la hoja de vida → 400 | FR-014 |
| Aval Sí sin soporte → «sin soporte»; con soporte → «con soporte»; «No» → borra el soporte | US4 |
| Foto subida, cambiada y quitada: `perfilMinimo` no cambia | US5, SC-004 |
| Empresa → 403 en todo `/perfil/*`; sin sesión → 401; firma alterada o vencida → 403 | FR-001/002, SC-003 |
| axe sin errores en las pantallas de M3 a 360 y 1080 px | SC-005 |
