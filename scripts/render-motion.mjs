import { spawnSync } from 'node:child_process'

// Authoring only. The website serves the committed renders without this CLI.
// A pinned CLI is fetched through pnpm; generated images are already in assets.
for (const [dir, output] of [
  ['motion/ruta-world', 'renders/desktop-master.mp4'],
  ['motion/.portrait', 'renders/mobile-master.mp4']
]) {
  for (const args of [
    ['check', '--json'],
    ['snapshot', '--review'],
    ['render', '--quality', 'delivery', '--fps', '30', '--output', output]
  ]) {
    const result = spawnSync('pnpm', ['dlx', 'hyperframes@0.9.65', ...args], {
      cwd: dir,
      stdio: 'inherit'
    })

    if (result.status !== 0)
      throw Error(`Motion step failed: ${args[0]} in ${dir}`)
  }
}
