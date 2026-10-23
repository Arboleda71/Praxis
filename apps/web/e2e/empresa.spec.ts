import { expect } from '@playwright/test';
import { crearCuenta, sinViolaciones, test } from './ayudas';
test('empresa guarda su ficha declarada y conserva los datos al recargar', async ({ page }) => {
  await crearCuenta(page.request, 'empresa');
  await page.goto('/empresa/perfil');
  await expect(page.getByRole('heading', { name: 'Perfil de la empresa' })).toBeVisible();
  await expect(page.getByLabel('Razón social')).toHaveValue('Andina Soft S.A.S.');
  await page.getByLabel('Ciudad', { exact: true }).fill('Medellín');
  await page.getByLabel('Descripción', { exact: true }).fill('Empresa ficticia que ofrece prácticas académicas.');
  await page.getByRole('button', { name: 'Guardar perfil de empresa' }).click();
  await expect(page.getByRole('status')).toHaveText('Guardamos el perfil de la empresa.');
  await page.reload();
  await expect(page.getByLabel('Ciudad', { exact: true })).toHaveValue('Medellín');
  await expect(page.getByText('Datos declarados por la empresa', { exact: true })).toBeVisible();
  await sinViolaciones(page);
});
