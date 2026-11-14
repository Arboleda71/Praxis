# Praxis

Portal de prácticas académicas: cuentas, perfiles, vacantes, elegibilidad,
postulación, seguimiento, notificaciones y planes sandbox. Incluye los mockups
de reemplazo de CV, supresión de cuenta y administración limitada al acceso.

## Ejecutar localmente

Requisitos: Node 24.22.1 (mínimo 24.15 dentro de Node 24), npm y Docker Desktop.
Desde la raíz:

```powershell
npm ci
npm exec --no --workspace api -- prisma generate
npm run demo:db
```

En dos terminales: `npm run demo:api` y `npm run demo:web`. Web en
http://localhost:3000 y API en 3001; los lanzadores aceptan PRAXIS_DEMO_WEB_PORT y
PRAXIS_DEMO_API_PORT si están ocupados. Solo datos ficticios, archivos privados
y correo local. Wompi queda sin conectar por decisión del equipo/usuario.
No ejecutar demo y Playwright a la vez: comparten compilación y bandeja de correo.

## Validación y alcance

- [Estado de entrega y bloqueos](docs/cierre-mvp.md)
- [Backlog y specs de cada mockup](docs/backlog-specs.md)
- [Alcance integral y tareas](specs/014-praxis-completo/spec.md)
- [Proveedores y despliegue](docs/produccion.md)
- [Revisión manual de accesibilidad pendiente](docs/accesibilidad-2026-11-13.md)

Para pruebas: `npm run db:test`, `npm run test:e2e -w api` y luego
`npm run test:e2e -w web -- --workers=1`. Las guardas impiden usar bases remotas
o de desarrollo. La validación de providers reales y CI remoto requiere accesos.

## Administrador

No existe registro público ni credencial predefinida. Tras migrar y compilar la
API, el responsable configura DATABASE_URL del entorno autorizado, ADMIN_CORREO
y ADMIN_CONTRASENA (mínimo 16 caracteres), y ejecuta `node scripts/crear-admin.mts`.
El comando no promueve cuentas existentes ni imprime la contraseña. Para la demo,
usar exclusivamente praxis_demo en el Postgres aislado del puerto 55432.

## Publicar la entrega

Con Git Credential Manager autenticado: `git push -u origin 013-cierre-mvp`.
`node scripts/github-entrega.mts pr` abre el PR con el cuerpo preparado y
`node scripts/github-entrega.mts ci` consulta Actions para el commit actual.
La revisión de otro integrante y la enmienda de alcance siguen siendo necesarias.
