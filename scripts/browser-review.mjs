import { existsSync } from 'node:fs'

import { chromium } from '@playwright/test'

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ??
    (existsSync('/opt/google/chrome/chrome')
      ? '/opt/google/chrome/chrome'
      : undefined),
  args: ['--no-sandbox', '--disable-dev-shm-usage']
})
const context = await browser.newContext({
  viewport: { width: 768, height: 1024 },
  reducedMotion: 'reduce'
})
const page = await context.newPage(),
  errors = []

page.on('pageerror', e => errors.push(e.message))
await page.goto('http://127.0.0.1:3100/app?mode=demo')
await page.getByRole('heading', { name: 'Mi malla.' }).waitFor()

for (const name of [
  'Mi malla',
  'Mi avance',
  'Planificador',
  'Comparar',
  'Transición',
  'Respaldos'
]) {
  await page
    .getByRole('navigation', { name: 'Secciones de mi espacio' })
    .getByRole('button', { name, exact: true })
    .click()

  if (
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
  )
    throw Error(`Desborde en tableta: ${name}`)

  if (name === 'Mi malla' || name === 'Mi avance')
    await page.screenshot({
      path: `docs/screenshots/${name === 'Mi malla' ? 'malla' : 'avance'}-tablet.png`,
      fullPage: true
    })
}

console.log(
  JSON.stringify({ tabletSections: 6, overflow: false, pageErrors: errors })
)
await context.close()

// Optional private validation: no trace, screenshots, persistence or document
// contents are written or logged in this context. Only aggregate counts return.
if (process.argv[2]) {
  const privateContext = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  })
  const privatePage = await privateContext.newPage()

  await privatePage.goto('http://127.0.0.1:3100/app?mode=demo')
  await privatePage
    .getByRole('navigation', { name: 'Secciones de mi espacio' })
    .getByRole('button', { name: 'Respaldos', exact: true })
    .click()
  await privatePage
    .getByLabel('Elegir archivo local')
    .setInputFiles(process.argv[2])
  await privatePage.locator('.import-preview').waitFor({ timeout: 30_000 })
  const rows = await privatePage.locator('.import-preview tbody tr').count()
  const classification = await privatePage
    .locator('.import-counts')
    .evaluate(node =>
      [...node.querySelectorAll('strong')].map(n => Number(n.textContent))
    )

  console.log(
    JSON.stringify({
      privatePDFLocalOnly: true,
      extractedRows: rows,
      classificationCounts: classification,
      changesApplied: false
    })
  )
  await privateContext.close()
}

await browser.close()
