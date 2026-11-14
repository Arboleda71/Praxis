import { expect, type APIRequestContext } from '@playwright/test';
import { CONTRASENA, crearCuenta, sinViolaciones, test, tokenDe } from './ayudas';

const futura = () => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
async function publicar(req: APIRequestContext) {
  const correo = await crearCuenta(req, 'empresa');
  expect((await req.post('/api/auth/confirmar-correo', { data: { token: tokenDe(correo) } })).ok()).toBe(true);
  const v = await req.post('/api/empresa/vacantes', { data: { titulo: `Práctica del recorrido completo ${Date.now()}`, descripcion: 'Prueba académica ficticia', modalidad: 'remota', ciudad: null, duracionMeses: 6, fechaInicio: futura(), vigencia: futura(), niveles: ['tecnologo'], programas: [], avances: [], aval: false, jornada: 'tiempo-completo', idiomas: [] } });
  expect(v.status()).toBe(201);
  const id = (await v.json()).id as string;
  expect((await req.post(`/api/empresa/vacantes/${id}/publicar`)).status()).toBe(201);
  return { id, correo };
}
test('S4: cancelar conserva la cuenta; confirmar elimina y cierra todas las sesiones', async ({ page }) => {
  await crearCuenta(page.request, 'estudiante');
  await page.goto('/estudiante/perfil');
  await page.getByRole('link', { name: 'Eliminar mi cuenta', exact: true }).click();
  await page.getByLabel('Contraseña actual').fill(CONTRASENA);
  await page.getByLabel('Entiendo que no se puede deshacer').check();
  await page.getByRole('button', { name: 'Eliminar mi cuenta', exact: true }).click();
  await sinViolaciones(page);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect((await page.request.get('/api/auth/sesion')).status()).toBe(200);
  await page.getByRole('button', { name: 'Eliminar mi cuenta', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page.getByRole('heading', { name: 'Tu cuenta fue eliminada' })).toBeVisible();
  expect((await page.request.get('/api/auth/sesion')).status()).toBe(401);
  await sinViolaciones(page);
});
test('S3: cambia el CV de la candidatura; la revisión lo bloquea y ambas partes ven el historial', async ({ page, browser, baseURL }) => {
  test.setTimeout(90000);
  const empresa = await browser.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } });
  try {
    const { id } = await publicar(empresa.request);
    await crearCuenta(page.request, 'estudiante');
    expect((await page.request.put('/api/perfil/formacion', { data: { nivelFormacion: 'tecnologo', programa: 'Desarrollo de software', institucion: null, avance: null } })).ok()).toBe(true);
    expect((await page.request.put('/api/perfil/archivos/hoja-de-vida', { multipart: { archivo: { name: 'original.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nOriginal') } } })).ok()).toBe(true);
    const p = await page.request.post(`/api/vacantes/${id}/postulaciones`);
    expect(p.status()).toBe(201); const postId = (await p.json()).id;
    await page.goto('/estudiante/postulaciones');
    await page.getByRole('link', { name: 'Cambiar CV de esta postulación' }).click();
    await page.getByLabel('CV nuevo · PDF de máximo 5 MB').setInputFiles({ name: 'nuevo.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nNuevo CV') });
    await sinViolaciones(page);
    await page.getByRole('button', { name: 'Guardar nuevo CV' }).click();
    await expect(page.getByRole('heading', { name: 'Mis postulaciones', exact: true })).toBeVisible();
    await expect(page.getByText(/CV reemplazado ·/)).toBeVisible();
    const compania = await empresa.newPage();
    await compania.goto(`/empresa/postulaciones/${postId}`);
    await expect(compania.getByText('En revisión', { exact: true })).toBeVisible();
    await expect(compania.getByText(/Hoja de vida reemplazada/)).toBeVisible();
    await sinViolaciones(compania);
    await page.reload();
    await expect(page.getByRole('link', { name: 'Cambiar CV de esta postulación' })).toHaveCount(0);
    await page.goto(`/estudiante/postulaciones/${postId}/cv`);
    await expect(page.getByText(/El CV enviado ya no se puede cambiar/)).toBeVisible();
    await sinViolaciones(page);
  } finally { await empresa.close(); }
});
test('Administrador: buscar, revocar con motivo, impedir acceso y restaurar', async ({ page, browser, baseURL }) => {
  test.setTimeout(90000);
  expect((await page.request.post('/api/__pruebas/admin', { headers: { 'x-praxis-test': process.env.PRAXIS_TEST_CONTROL_SECRET! } })).status()).toBe(204);
  const usuario = await browser.newContext({ baseURL, extraHTTPHeaders: { Origin: baseURL! } });
  try {
    const correo = await crearCuenta(usuario.request, 'estudiante');
    await page.goto('/ingresar');
    await page.getByLabel('Correo', { exact: true }).fill('admin@praxis.example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill(CONTRASENA);
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Cuentas registradas' })).toBeVisible();
    await page.getByLabel('Buscar por correo, empresa o NIT').fill(correo);
    await page.getByRole('button', { name: 'Buscar cuentas' }).click();
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.getByRole('link', { name: 'Ver cuenta' }).click();
    await page.getByRole('button', { name: 'Revocar acceso', exact: true }).click();
    await page.getByRole('textbox', { name: 'Motivo', exact: true }).fill('Requerimiento legal ficticio de prueba');
    await sinViolaciones(page);
    await page.getByRole('button', { name: 'Confirmar cambio de acceso' }).click();
    await expect(page.getByText('Acceso revocado', { exact: true })).toBeVisible();
    expect((await usuario.request.get('/api/auth/sesion')).status()).toBe(401);
    const acceso = await usuario.request.post('/api/auth/login', { data: { correo, contrasena: CONTRASENA } });
    expect(acceso.status()).toBe(403); expect(JSON.stringify(await acceso.json())).not.toContain('Requerimiento');
    await page.getByRole('button', { name: 'Restaurar acceso', exact: true }).click();
    await page.getByRole('textbox', { name: 'Motivo', exact: true }).fill('Requerimiento ficticio resuelto');
    await page.getByRole('button', { name: 'Confirmar cambio de acceso' }).click();
    await expect(page.getByText('Acceso activo', { exact: true })).toBeVisible();
    expect((await usuario.request.post('/api/auth/login', { data: { correo, contrasena: CONTRASENA } })).status()).toBe(200);
    await sinViolaciones(page);
  } finally { await usuario.close(); }
});
test('S2 y logo: aviso previo, aviso al vencer, renovación manual y logo opcional', async ({ page }) => {
  const { correo } = await publicar(page.request);
  const configurar = async (dias: number) => expect((await page.request.post('/api/__pruebas/plan', { headers: { 'x-praxis-test': process.env.PRAXIS_TEST_CONTROL_SECRET! }, data: { correo, dias } })).status()).toBe(204);
  await configurar(6); await page.goto('/empresa/vacantes');
  await expect(page.getByRole('alert').filter({ hasText: 'Tu plan Básico vence' })).toBeVisible();
  await configurar(-1); await page.reload();
  await expect(page.getByRole('alert').filter({ hasText: 'Tu plan Básico venció' })).toBeVisible();
  await page.goto('/empresa/planes');
  await expect(page.getByText(/Tus vacantes abiertas no se cierran/)).toBeVisible();
  await sinViolaciones(page);
  await page.goto('/empresa/perfil');
  await page.getByLabel('Elige una imagen JPG o PNG de máximo 2 MB.').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1sAAAAASUVORK5CYII=', 'base64') });
  await page.getByRole('button', { name: 'Guardar logo' }).click();
  await expect(page.getByAltText('Logo actual de la empresa')).toBeVisible();
  await page.getByRole('button', { name: 'Quitar logo' }).click();
  await expect(page.getByAltText('Logo actual de la empresa')).toHaveCount(0);
  await page.getByRole('link', { name: 'Eliminar la cuenta de la empresa' }).click();
  await page.getByLabel('Contraseña actual').fill(CONTRASENA);
  await page.getByLabel('Entiendo que no se puede deshacer').check();
  await page.getByRole('button', { name: 'Eliminar mi cuenta', exact: true }).click();
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page.getByRole('heading', { name: 'Tu cuenta fue eliminada' })).toBeVisible();
});
