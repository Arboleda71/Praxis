// Nest 12 es solo ESM: Jest corre en modo ESM nativo (--experimental-vm-modules) y SWC compila TS
// conservando la metadata de decoradores que usa la inyección de dependencias.
/** @type {import('jest').Config} */
const config = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  // Los imports relativos llevan `.js` (nodenext); Jest resuelve el `.ts`.
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: 'es2023',
        },
      },
    ],
  },
};

export default config;
