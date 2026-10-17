import { defineConfig } from 'prisma/config';

// Prisma 7 no carga .env por sí solo; Node 24 lo hace sin dependencias.
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables del entorno (CI, Railway).
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DATABASE_URL ?? '' },
});
