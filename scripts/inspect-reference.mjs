import { mkdir } from 'node:fs/promises'

import { chromium } from '@playwright/test'

const browser = await chromium.launch({
  executablePath: '/opt/google/chrome/chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage']
})
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce'
})

await mkdir('/tmp/rutacreditos-references', { recursive: true })
const root = 'https://miaai-lab.github.io/Claude-Opus-5.5-100-HTML-Files/'

await page.goto(root, { waitUntil: 'networkidle' })
const links = await page
  .locator('a[href$=".html"]')
  .evaluateAll(nodes => [...new Set(nodes.map(n => n.href))])
const chosen = links.filter(l => /003-|012-|060-|bento/.test(l))

console.log('Referencias seleccionadas:', chosen)

for (const url of chosen) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.screenshot({
    path: '/tmp/rutacreditos-references/' + url.split('/').at(-1) + '.png'
  })
  console.log('Inspeccionado:', await page.title())
}

await browser.close()
