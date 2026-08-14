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
  const navigation = page.getByRole('navigation', { name: 'Navegación principal' })
  const menuButton = navigation.getByRole('button', { name: /menú/i })

  await menuButton.click()
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  await navigation.getByRole('link', { name: 'Buscar médicos' }).click()
  await expect(page).toHaveURL(/\/medicos/)
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')

  await menuButton.click()
  await page.keyboard.press('Escape')
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')

  await menuButton.click()
  await page.getByRole('heading', { name: /Encuentra a tu médico/ }).click()
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
})
