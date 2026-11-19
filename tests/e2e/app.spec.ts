import { readFileSync } from 'node:fs'

import { expect, test } from '@playwright/test'

async function selectValue(
  page: import('@playwright/test').Page,
  control: import('@playwright/test').Locator,
  value: string
) {
  await control.click()
  await page.locator(`.ui-select-item[data-value="${value}"]`).click()
}

async function nav(page: import('@playwright/test').Page, name: string) {
  await page.locator('.product-shell').waitFor()
  const menu = page.getByRole('button', { name: 'Abrir menú de navegación' })

  if (await menu.isVisible()) await menu.click()
  await page
    .getByRole('navigation', { name: 'Secciones de mi espacio' })
    .getByRole('button', { name, exact: true })
    .click()
}

test('demo → detalle → plan guardado → comparación → respaldo y recuperación', async ({
  page
}, info) => {
  const errors: string[] = []

  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Tu próximo paso, claro.' })
  ).toBeVisible()
  await page.screenshot({
    path: `docs/screenshots/landing-${info.project.name}.png`,
    fullPage: true
  })
  await page
    .getByRole('link', { name: 'Probar con un ejemplo', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Mi malla.' })).toBeVisible()
  await expect(
    page.getByText('Estás explorando un ejemplo ficticio.', { exact: true })
  ).toBeVisible()
  await page.screenshot({
    path: `docs/screenshots/malla-${info.project.name}.png`,
    fullPage: true
  })
  await page
    .getByRole('searchbox', { name: 'Buscar curso en la malla' })
    .fill('Base de datos')
  await page.getByRole('button', { name: /Base de datos, ICSI-673/ }).click()
  const dialog = page.getByRole('dialog')

  await expect(
    dialog.getByRole('heading', { name: 'Por qué aparece así' })
  ).toBeVisible()
  await expect(
    dialog.getByText('Falta aprobar: ICSI-671.', { exact: true })
  ).toBeVisible()
  await page.screenshot({
    path: `docs/screenshots/detalle-${info.project.name}.png`
  })
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await nav(page, 'Mi avance')
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '55')
  await page.screenshot({
    path: `docs/screenshots/avance-${info.project.name}.png`,
    fullPage: true
  })
  await nav(page, 'Planificador')
  await page.getByRole('button', { name: 'Crear mi primer escenario' }).click()
  await page.getByRole('button', { name: 'Usar sugerencia' }).click()
  await page
    .getByRole('button', { name: 'Guardar escenario', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('Escenario guardado')
  await page
    .getByRole('button', { name: '+ Añadir periodo', exact: true })
    .click()
  await page.getByRole('button', { name: 'Usar sugerencia' }).click()
  await page.screenshot({
    path: `docs/screenshots/planificador-${info.project.name}.png`,
    fullPage: true
  })
  await page.getByRole('button', { name: 'Duplicar', exact: true }).click()
  await page.getByRole('spinbutton', { name: 'Máximo de créditos' }).fill('12')
  await page.getByRole('button', { name: 'Usar sugerencia' }).click()
  await page
    .getByRole('button', { name: 'Comparar', exact: true })
    .first()
    .click()
  await expect(
    page.getByText('Diferencia B − A:', { exact: false })
  ).toBeVisible()
  await page.screenshot({
    path: `docs/screenshots/comparador-${info.project.name}.png`,
    fullPage: true
  })
  await nav(page, 'Respaldos')
  const downloading = page.waitForEvent('download')

  await page.getByRole('button', { name: 'Exportar respaldo JSON' }).click()
  const dl = await downloading
  const file = await dl.path()

  expect(file).toBeTruthy()
  const backup = JSON.parse(readFileSync(file!, 'utf8'))

  expect(backup.data.scenarios).toHaveLength(2)
  // Download file path has no extension in Playwright; use explicit file metadata.
  await page.getByLabel('Elegir archivo local').setInputFiles({
    name: 'respaldo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup))
  })
  await expect(
    page.getByRole('heading', { name: /Revisar respaldo.json/ })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Revisar reemplazo del espacio' })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reemplazar este espacio' })
    .click()
  await page.reload()
  await nav(page, 'Planificador')
  await page
    .getByRole('combobox', { name: 'Escenario guardado', exact: true })
    .click()
  await expect(page.locator('.ui-select-item')).toHaveCount(2)
  await page.keyboard.press('Escape')
  await page.evaluate(() =>
    localStorage.setItem('rutacreditos:v1:demo', '{corrupt')
  )
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Recuperemos tu punto de partida.' })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Recuperar copia anterior válida' })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Confirmar', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Mi malla.' })).toBeVisible()
  expect(errors).toEqual([])
})

test('perfil personal aislado, edición, lote, deshacer y persistencia', async ({
  page
}) => {
  await page.goto('/app')
  await page.getByLabel('Periodo de ingreso').fill('202510')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Abrir mi malla' }).click()
  await nav(page, 'Historial')
  await page
    .getByRole('button', { name: '+ Registrar intento', exact: true })
    .click()
  await selectValue(
    page,
    page.getByRole('combobox', { name: 'Asignatura', exact: true }),
    'ICSI-506'
  )
  await page.getByLabel('Periodo', { exact: true }).fill('202510')
  await selectValue(
    page,
    page.getByRole('combobox', { name: 'Resultado', exact: true }),
    'passed'
  )
  await page.getByRole('button', { name: 'Revisar cambio' }).click()
  await page
    .getByRole('button', { name: 'Guardar intento', exact: true })
    .click()
  await expect(
    page.getByRole('cell', { name: 'Aprobado', exact: true })
  ).toBeVisible()
  await page
    .getByRole('checkbox', { name: 'Seleccionar ICSI-506 202510' })
    .check()
  await selectValue(page, page.getByLabel('Nuevo resultado'), 'failed')
  await page.getByRole('button', { name: 'Revisar edición por lote' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Aplicar cambios' })
    .click()
  await expect(
    page.getByRole('cell', { name: 'Desaprobado', exact: true })
  ).toBeVisible()
  await page.getByRole('button', { name: /Deshacer/ }).click()
  await expect(
    page.getByRole('cell', { name: 'Aprobado', exact: true })
  ).toBeVisible()
  const personal = await page.evaluate(() =>
    localStorage.getItem('rutacreditos:v1:personal')
  )

  await page.goto('/app?mode=demo')
  await expect(page.getByRole('heading', { name: 'Mi malla.' })).toBeVisible()
  const mobileMenu = page.getByRole('button', {
    name: 'Abrir menú de navegación'
  })

  if (await mobileMenu.isVisible()) await mobileMenu.click()
  const settings = page
    .getByRole('dialog')
    .filter({ hasText: 'Tu espacio de RutaCréditos' })

  if (await settings.isVisible())
    await settings
      .getByText('Opciones de este espacio', { exact: true })
      .click()
  else await page.getByText('Opciones de este espacio', { exact: true }).click()
  await page
    .getByRole('button', { name: 'Restablecer demo', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Restablecer demo', exact: true })
    .click()
  expect(
    await page.evaluate(() => localStorage.getItem('rutacreditos:v1:personal'))
  ).toBe(personal)
  await page.goto('/app')
  await nav(page, 'Historial')
  await expect(
    page.getByRole('cell', { name: 'Aprobado', exact: true })
  ).toBeVisible()
})

test('importación CSV con revisión; referencias de transición y cero desborde', async ({
  page
}) => {
  await page.goto('/app?mode=demo')
  await nav(page, 'Respaldos')
  await page.getByLabel('Elegir archivo local').setInputFiles({
    name: 'sintetico.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(
      'plan,codigo,periodo,resultado,creditos\nicsi-2022,CIEN-397,202310,Aprobado,4\n,ICSI-509,202320,Pendiente,4\nisia-2025,VOID-999,202310,Aprobado,4'
    )
  })
  await expect(page.getByText('Ambiguo', { exact: true })).toBeVisible()
  await selectValue(page, page.getByLabel('Plan de ICSI-509'), 'icsi-2022')
  await page
    .getByRole('button', { name: 'Importar 2 intentos revisados' })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Aplicar intentos revisados' })
    .click()
  await nav(page, 'Transición')
  await page
    .getByRole('searchbox', { name: 'Buscar correspondencia' })
    .fill('CIEN-397')
  await expect(
    page.getByText('CIEN-397 · 4 cr.', { exact: true })
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Registrar reconocimiento individual' })
    .click()
  await page
    .getByLabel('Procedencia del reconocimiento')
    .fill('Ejemplo sintético de una revisión individual.')
  await page.getByRole('dialog').getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Guardar declaración' }).click()
  await expect(
    page.getByText('Reconocimiento declarado por ti', { exact: true })
  ).toBeVisible()

  for (const name of [
    'Mi avance',
    'Mi malla',
    'Planificador',
    'Comparar',
    'Respaldos'
  ]) {
    await nav(page, name)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBeTruthy()
  }
})

test('teclado, foco de diálogo y navegación móvil', async ({ page }) => {
  await page.goto('/app?mode=demo')
  await page
    .getByRole('searchbox', { name: 'Buscar curso en la malla' })
    .fill('Aprendizaje estadístico')
  const course = page.getByRole('button', {
    name: /Aprendizaje estadístico, ISIA-106/
  })

  await course.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(
    page.getByRole('dialog').getByText('no verificable', { exact: true })
  ).toBeVisible()

  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab')
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest('[role="dialog"]'))
      )
    ).toBeTruthy()
  }

  await page.keyboard.press('Escape')
  await expect(course).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBeTruthy()
})

test('PDF sintético local, PDF no interpretable y resumen imprimible', async ({
  page
}) => {
  const { syntheticPDF } = await import('./pdf.helpers')
  const externalRequests: string[] = []

  page.on('request', request => {
    if (
      !request.url().startsWith('http://127.0.0.1:3100') &&
      !request.url().startsWith('blob:')
    )
      externalRequests.push(request.url())
  })
  await page.goto('/app?mode=demo')
  await nav(page, 'Respaldos')
  await page.getByLabel('Elegir archivo local').setInputFiles({
    name: 'reporte-sintetico.pdf',
    mimeType: 'application/pdf',
    buffer: syntheticPDF([
      'REPORTE DE NOTAS - DATOS SINTETICOS',
      '01 CIEN - 397 CURSO SINTETICO 4 202310 OE 18',
      '01 CIEN - 532 FISICA GENERAL 4 202310 OE 14',
      '02 ICSI - 506 OTRO CURSO SINTETICO 4 202510 OE 12'
    ])
  })
  await expect(
    page.getByText(
      'El PDF no declara un resultado inequívoco por asignatura.',
      { exact: false }
    )
  ).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('0 ambiguos')).toBeVisible()
  await expect(page.getByText('0 desconocidos')).toBeVisible()
  await expect(page.getByLabel('Plan de ICSI-506')).toBeVisible()
  const tableBox = await page
    .locator('.import-preview .table-scroll')
    .boundingBox()

  expect(tableBox).not.toBeNull()
  const beforeScroll = await page.evaluate(() => window.scrollY)

  await page.mouse.move(
    tableBox!.x + tableBox!.width / 2,
    tableBox!.y + Math.min(80, tableBox!.height / 2)
  )
  await page.mouse.wheel(0, 400)
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(beforeScroll)
  await page.getByRole('button', { name: 'Descartar archivo' }).click()
  await page.getByLabel('Elegir archivo local').setInputFiles({
    name: 'escaneado-sintetico.pdf',
    mimeType: 'application/pdf',
    buffer: syntheticPDF(['SIN FILAS RECONOCIBLES'])
  })
  await expect(
    page.getByRole('alert').filter({ hasText: 'No se pudo interpretar' })
  ).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(
    page.getByRole('heading', { name: 'RutaCréditos', exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Historial', exact: true })
  ).toBeVisible()
  await page.emulateMedia({ media: 'screen' })
  expect(externalRequests).toEqual([])
})

test('ciclo automático por ingreso, malla por ciclos sin vacío, guía rápida y plan automático', async ({
  page
}, info) => {
  await page.goto('/app')
  await page.getByLabel('Periodo de ingreso').fill('2023-10')
  await expect(page.getByText('Ciclo VIII', { exact: true })).toBeVisible()
  await expect(
    page.getByText('ICSI 2022 → ISIA 2025', { exact: true })
  ).toBeVisible()
  await page.screenshot({
    path: `docs/screenshots/onboarding-${info.project.name}.png`,
    fullPage: true
  })
  await page.getByRole('checkbox').last().check()
  await page.getByRole('button', { name: 'Abrir mi malla' }).click()
  await expect(page.getByRole('heading', { name: 'Mi malla.' })).toBeVisible()
  await page.getByRole('button', { name: 'Por ciclos', exact: true }).click()
  const verticalSlack = await page
    .locator('.malla-board')
    .evaluate(el => el.scrollHeight - el.clientHeight)

  expect(verticalSlack).toBeLessThanOrEqual(4)
  await page.screenshot({
    path: `docs/screenshots/malla-ciclos-${info.project.name}.png`,
    fullPage: true
  })
  await page.getByRole('button', { name: /Guía rápida/ }).click()
  const tourDialog = page.getByRole('dialog', { name: /Guía rápida/ })

  await expect(tourDialog).toBeVisible()
  await page.screenshot({
    path: `docs/screenshots/tour-${info.project.name}.png`
  })
  await tourDialog.getByRole('button', { name: 'Siguiente' }).click()
  await expect(
    page.getByRole('heading', {
      name: /Sube tu Reporte de Notas/
    })
  ).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(tourDialog).not.toBeVisible()
  await nav(page, 'Planificador')
  await page
    .getByRole('button', {
      name: 'Planificar automáticamente mis próximos ciclos'
    })
    .click()
  await expect(page.getByRole('status')).toContainText('Plan automático')
})
