import base from './jest.config.js';

/** @type {import('jest').Config} */
export default {
  ...base,
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  setupFiles: ['<rootDir>/test/entorno.ts'],
  globalSetup: '<rootDir>/test/migrar.ts',
  // Las suites comparten la base de pruebas: una a la vez.
  maxWorkers: 1,
};
