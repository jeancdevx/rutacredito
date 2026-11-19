import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'

// The PDF worker is served locally, never from a CDN.
if (existsSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs')) {
  copyFileSync(
    'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
    'public/pdf.worker.min.mjs'
  )
}

if (existsSync('.git') && !process.env.CI) {
  const result = spawnSync('husky', { stdio: 'inherit', shell: true })

  if (result.status)
    console.warn(
      'Husky pendiente: ejecuta pnpm exec husky en el checkout autorizado.'
    )
}
