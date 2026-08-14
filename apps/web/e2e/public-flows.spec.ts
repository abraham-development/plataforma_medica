import { expect, test } from '@playwright/test'

test('el encabezado tiene las dos barras y acceso a registro', async ({ page }) => {
  await page.goto('/')
  const header = page.getByRole('banner')
  await expect(page.getByRole('link', { name: 'MediCerca' })).toBeVisible()
  await expect(header.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  await expect(header.getByRole('link', { name: 'Crear cuenta' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
})

test('registro ofrece OTP, roles y controles independientes de contraseña', async ({ page }) => {
  await page.goto('/registro')
  await expect(page.getByLabel('Nombre de usuario')).toBeVisible()
  await expect(page.getByLabel('Correo electrónico')).toBeVisible()
  await expect(page.getByLabel('Paciente')).toBeVisible()
  await expect(page.getByLabel('Médico')).toBeVisible()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click()
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveAttribute('type', 'text')
  await expect(page.getByText(/código OTP de 6 dígitos/i)).toBeVisible()
})

test('la propuesta muestra exactamente las dos modalidades', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Consulta virtual', exact: true }).first()).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Atención a domicilio', exact: true }).first(),
  ).toBeVisible()
  await expect(page.getByText(/consulta presencial/i)).toHaveCount(0)
})
