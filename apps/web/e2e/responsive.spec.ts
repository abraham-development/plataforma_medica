import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'móvil compacto', width: 320, height: 740 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'escritorio', width: 1440, height: 1000 },
]

const publicPages = [
  { name: 'inicio', path: '/' },
  { name: 'registro', path: '/registro' },
  { name: 'buscador', path: '/medicos?especialidad=pediatria' },
  { name: 'perfil médico', path: '/medicos/demo-alejandro-rios' },
]

for (const viewport of viewports) {
  for (const pageDefinition of publicPages) {
    test(`${pageDefinition.name} no desborda en ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(pageDefinition.path)
      await expect(page.locator('body')).toBeVisible()

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
    })
  }
}

test('el menú público móvil conserva accesos táctiles', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()
  await page.getByText('Menú', { exact: true }).click()
  await expect(
    page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Buscar médicos' }),
  ).toBeVisible()
})
