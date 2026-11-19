import { expect, test } from '@playwright/test'

test('CTA con contraste al hover, clic libre y navegación Next entre espacios', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const navigation = await page.locator('.world-navigation').boundingBox()

  expect(navigation).not.toBeNull()
  expect(navigation!.x).toBeGreaterThanOrEqual(0)
  expect(navigation!.x + navigation!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width
  )
  const primary = page
    .getByRole('link', { name: 'Explorar mi malla', exact: true })
    .first()

  await primary.hover()
  const colors = await primary.evaluate(el => ({
    color: getComputedStyle(el).color,
    background: getComputedStyle(el).backgroundColor
  }))

  expect(colors.color).not.toBe(colors.background)
  const luminance = (color: string) => {
    const channels = color
      .match(/\d+/g)!
      .slice(0, 3)
      .map(Number)
      .map(channel => {
        const value = channel / 255

        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4
      })

    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }

  const foreground = luminance(colors.color),
    background = luminance(colors.background)

  expect(
    (Math.max(foreground, background) + 0.05) /
      (Math.min(foreground, background) + 0.05)
  ).toBeGreaterThanOrEqual(4.5)
  await primary.click({ trial: true })
  await page
    .getByRole('link', { name: 'Probar con un ejemplo', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Mi malla.' })).toBeVisible()
  await page
    .getByRole('link', { name: 'Crear mi espacio', exact: true })
    .click()
  await expect(page.getByLabel('Periodo de ingreso')).toBeVisible()
  await page
    .getByRole('link', { name: /Probar con un ejemplo ficticio/ })
    .click()
  await expect(page.getByRole('heading', { name: 'Mi malla.' })).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.getItem('rutacreditos:v1:personal'))
  ).toBeNull()
})

test('recorrido local: vídeo seekable, scroll reversible y controles sin bloqueo', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const video = page.locator('video').first()

  await expect
    .poll(() => video.evaluate(el => (el as HTMLVideoElement).readyState), {
      timeout: 20000
    })
    .toBeGreaterThanOrEqual(2)
  expect(
    await video.evaluate(el => (el as HTMLVideoElement).seekable.end(0))
  ).toBeGreaterThan(11)
  await page.getByRole('button', { name: '02 Entiende' }).click()
  await expect(
    page.getByRole('heading', { name: 'Cada bloqueo tiene una razón.' })
  ).toBeVisible()
  await expect
    .poll(() => video.evaluate(el => (el as HTMLVideoElement).currentTime))
    .toBeGreaterThan(4)
  await page.getByRole('button', { name: '01 Ubícate' }).click()
  await expect
    .poll(() => video.evaluate(el => (el as HTMLVideoElement).currentTime))
    .toBeLessThan(0.1)
  await page
    .getByRole('link', { name: 'Probar con un ejemplo', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Mi malla.' })).toBeVisible()
})

test('vitrina visual de la landing cambia capítulos sin superposición ni desborde', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const section = page.locator('#recorrido-visual')

  await section.scrollIntoViewIfNeeded()
  const viewport = section.locator('.showcase-viewport')
  const chapters = section.locator('.showcase-chapters')
  const tabs = section.getByRole('tab')

  await expect(tabs).toHaveCount(3)

  for (let i = 0; i < 3; i += 1) {
    const tab = tabs.nth(i)

    await tab.click()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
    const [viewportBox, chaptersBox, imageBox] = await Promise.all([
      viewport.boundingBox(),
      chapters.boundingBox(),
      viewport.locator('img.is-visible').boundingBox()
    ])

    expect(viewportBox).not.toBeNull()
    expect(chaptersBox).not.toBeNull()
    expect(imageBox).not.toBeNull()
    await expect
      .poll(() =>
        viewport
          .locator('img.is-visible')
          .evaluate(el => (el as HTMLImageElement).naturalWidth)
      )
      .toBeGreaterThan(0)
    expect(imageBox!.width).toBeLessThanOrEqual(viewportBox!.width + 1)
    expect(imageBox!.height).toBeLessThanOrEqual(viewportBox!.height + 1)
    expect(viewportBox!.y + viewportBox!.height).toBeLessThanOrEqual(
      chaptersBox!.y + 1
    )
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1
    )
  ).toBe(true)
})
