import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

import { chromium } from '@playwright/test'

const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ??
    (existsSync('/usr/bin/google-chrome-stable')
      ? '/usr/bin/google-chrome-stable'
      : undefined),
  args: ['--no-sandbox', '--disable-dev-shm-usage']
})
const results = []

mkdirSync('docs/screenshots', { recursive: true })

for (const [name, width, height, rate] of [
  ['desktop', 1440, 1000, 1],
  ['mobile', 360, 800, 4]
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: name === 'mobile',
    hasTouch: name === 'mobile',
    reducedMotion: 'no-preference'
  })
  const page = await context.newPage()
  const errors = []

  page.on('pageerror', error => errors.push(error.message))
  const cdp = await context.newCDPSession(page)

  await cdp.send('Emulation.setCPUThrottlingRate', { rate })
  await page.addInitScript(() => {
    window.__motionAudit = { frames: 0, tasks: [] }
    const original = window.requestAnimationFrame.bind(window)

    window.requestAnimationFrame = callback => {
      window.__motionAudit.frames++

      return original(callback)
    }

    new PerformanceObserver(list => {
      for (const entry of list.getEntries())
        window.__motionAudit.tasks.push({
          start: Math.round(entry.startTime),
          duration: Math.round(entry.duration)
        })
    }).observe({ type: 'longtask', buffered: true })
  })
  await page.goto('http://127.0.0.1:3100')
  const video = page.locator('video').first()

  await page.waitForFunction(
    () => document.querySelector('video')?.readyState >= 2
  )
  await page.screenshot({ path: `docs/screenshots/hero-cinematic-${name}.png` })
  const start = await page.evaluate(() => performance.now())

  // Reverse direction while the decoder is still working; no wheel hijacking.
  for (const fraction of [0.25, 0.7, 0.35, 0.9, 0]) {
    await page.evaluate(f => {
      const world = document.querySelector('.scroll-world')

      window.scrollTo({
        top: (world.offsetHeight - innerHeight) * f,
        behavior: 'instant'
      })
    }, fraction)
    await page.waitForTimeout(90)
  }

  await page.waitForTimeout(1100)
  const settledTime = await video.evaluate(el => el.currentTime)
  const beforeIdle = await page.evaluate(() => window.__motionAudit.frames)

  await page.waitForTimeout(500)
  const idleRAF =
    (await page.evaluate(() => window.__motionAudit.frames)) - beforeIdle
  const longTasks = await page.evaluate(
    s => window.__motionAudit.tasks.filter(task => task.start >= s),
    start
  )
  const seekable = await video.evaluate(el => ({
    until: el.seekable.end(0),
    width: el.videoWidth,
    height: el.videoHeight
  }))

  if (settledTime > 0.15 || errors.length)
    throw Error(`${name}: scroll did not settle or browser errors occurred`)
  await page.locator('.closing-invitation').scrollIntoViewIfNeeded()
  await page.waitForTimeout(650)
  await page.screenshot({
    path: `docs/screenshots/closing-invitation-${name}.png`
  })
  const cta = page
    .locator('.closing-invitation')
    .getByRole('link', { name: 'Explorar mi malla', exact: true })

  await cta.click({ trial: true })
  results.push({
    viewport: `${width}x${height}`,
    cpuThrottle: rate,
    settledTime,
    idleRAF,
    longTasks,
    seekable,
    pageErrors: errors,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    )
  })
  await context.close()
}

await browser.close()
writeFileSync(
  'docs/MOTION_METRICS.json',
  JSON.stringify(
    {
      measuredAt: new Date().toISOString(),
      environment:
        'Chromium headless; desktop GPU and CPU throttling, not a physical phone',
      results
    },
    null,
    2
  ) + '\n'
)
console.log(JSON.stringify(results))
