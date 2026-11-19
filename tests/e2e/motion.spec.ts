import { expect, test } from '@playwright/test'

test('movimiento reducido evita vídeo y el acordeón responde al teclado sin transición', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const videoRequests: string[] = []

  page.on('request', request => {
    if (request.url().endsWith('.mp4')) videoRequests.push(request.url())
  })
  await page.goto('/')
  await expect(page.locator('.world-static')).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Lo que viene empieza contigo.' })
  ).toBeAttached()
  const question = page.getByRole('button', {
    name: '¿Necesito una cuenta?',
    exact: true
  })

  await question.focus()
  await page.keyboard.press('Enter')
  await expect(question).toHaveAttribute('aria-expanded', 'true')
  const panel = page
    .locator('[data-motion="accordion"]')
    .filter({ hasText: 'No. Puedes probar el ejemplo ficticio' })

  await expect(panel).toBeVisible()
  expect(
    await panel.evaluate(el => getComputedStyle(el).transitionDuration)
  ).toBe('0s')
  await page.keyboard.press('Enter')
  await expect(question).toHaveAttribute('aria-expanded', 'false')
  expect(videoRequests).toEqual([])
})

test('panel con movimiento por puntero y cierre inmediato por teclado conserva foco', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/app?mode=demo')
  await page
    .getByRole('searchbox', { name: 'Buscar curso en la malla' })
    .fill('Aprendizaje estadístico')
  const course = page.getByRole('button', {
    name: /Aprendizaje estadístico, ISIA-106/
  })

  await course.click()
  const dialog = page.getByRole('dialog')

  await expect(dialog).toBeVisible()
  expect(
    await dialog.evaluate(el => getComputedStyle(el).transitionDuration)
  ).toContain('0.3s')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(course).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(dialog).toBeVisible()
  expect(
    await dialog.evaluate(el => getComputedStyle(el).transitionDuration)
  ).toBe('0s')
  await page.keyboard.press('Escape')
  await expect(course).toBeFocused()
})
