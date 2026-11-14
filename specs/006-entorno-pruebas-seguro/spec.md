# Entorno de pruebas aislado
Estado: implementado y verificado localmente. Spec documental completada 2026-11-13 sobre el plan histórico; no se afirma que precedió al código.

## Aceptación
- Validar destino antes de conectar, migrar o truncar: loopback, puerto 55432 y praxis_test/praxis_e2e/praxis_demo según cada uso.
- Rechazar remoto, desarrollo, parámetros y fragmentos sin revelar URL.
- Postgres efímero y S3 compatible local; fixtures ficticias y sin credenciales reales.
- API y navegador usan bases distintas. Cada corrida de API exige su base libre; navegador no reutiliza puertos ocupados.

Evidencia: 17 casos en apps/api/test/seguridad/base-pruebas.test.ts; guardas, test/migrar.ts, playwright.config.ts y Compose de pruebas.
