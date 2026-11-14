# M4 · Perfil de empresa
Mockup M4, Ficha de la empresa. Spec completada 2026-11-13. Implementada localmente, incluido logo en entrega 014; revisión del equipo pendiente.

## Aceptación
1. Empresa consulta/edita solo su ficha: razón social, NIT/DV, sector, ciudad, web, descripción y contactos. Validación Zod compartida.
2. Rotular Datos declarados por la empresa. Publicar exige correo confirmado, NIT válido y cupos en M5; no aprobación administrativa.
3. Logo opcional JPG/PNG <=2 MB, validación de contenido, reemplazo/borrado por dueño y enlace privado temporal; limpiar versión anterior.
4. Mostrar errores por campo, guardado y guía de habilitación.

## API y pruebas
GET/PUT /empresa/perfil; PUT/DELETE /empresa/logo. Solo EMPRESA y propiedad por sesión. Estudiante recibe campos públicos y logoUrl desde vacante, nunca clave del bucket.
Pruebas: empresa.e2e-spec.ts, completo.e2e-spec.ts, empresa.spec.ts y completo.spec.ts.
