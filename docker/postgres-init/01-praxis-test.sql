-- Base separada para las pruebas de integración de la API (se vacía en cada corrida).
CREATE DATABASE praxis_test OWNER praxis;
-- Base para las pruebas E2E con Playwright (cada prueba usa correos y NIT únicos).
CREATE DATABASE praxis_e2e OWNER praxis;
