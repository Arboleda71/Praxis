# M4 · Perfil de empresa

Constitución 4.0.0; rama 007-perfil-empresa. Contratos Zod compartidos, tabla Empresa ampliada por migración versionada, controlador directo Prisma, formulario MUI mobile-first. Solo la cuenta dueña accede; no se reciben identificadores de otra empresa. Datos declarados; publicación depende de correo confirmado y NIT válido, además de cupos en M5. Logo opcional aplazado: no bloquea el recorrido del MVP y no hay almacenamiento público nuevo.

Pruebas: empresa.test.ts se ejecutó fallando por módulo inexistente y luego 2/2 aprobaron. Integración de acceso 401/403 y ficha persistente; E2E con axe en ambos tamaños escritos. Resultado final pendiente. Sin proyectos ni dependencias nuevos. PR y CI remoto pendientes.

## Resultado final local · 2026-10-23

M4 incluido en 67/67 pruebas de navegador con axe, 55/55 de integración API y 83/83 contratos globales aprobados. Ficha declarada y persistencia verificadas; acceso 401/403 y propietario mediante sesión. Los tests específicos de permisos se ejecutaron después de esa parte del código; no se afirma TDD estricto de esa extensión. Logo opcional, PR y CI remoto siguen pendientes. Ver docs/mvp-entrega.md.
