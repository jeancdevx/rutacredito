import {
  copyFileSync,
  cpSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs'

const base = new URL('../motion/ruta-world/', import.meta.url)

mkdirSync(new URL('assets/', base), { recursive: true })

for (const [from, to] of [
  ['../node_modules/three/build/three.module.js', 'three.module.min.js'],
  ['../node_modules/three/build/three.core.js', 'three.core.js'],
  ['../node_modules/gsap/dist/gsap.min.js', 'gsap.min.js']
])
  copyFileSync(new URL(from, import.meta.url), new URL(`assets/${to}`, base))

// A separate camera composition, never a centre crop of the desktop film.
const mobile = new URL('../motion/.portrait/', import.meta.url)

mkdirSync(mobile, { recursive: true })

for (const path of ['assets', 'compositions', 'meta.json', 'hyperframes.json'])
  cpSync(new URL(path, base), new URL(path, mobile), { recursive: true })

for (const path of ['index.html', 'compositions/world.html']) {
  const source = readFileSync(new URL(path, base), 'utf8')
    .replaceAll('1920', '1080')
    .replace(/(height\s*[:=]\s*['"]?)1080/g, (_, prefix) => `${prefix}1920`)

  writeFileSync(new URL(path, mobile), source)
}

console.log('Local motion assets and native portrait composition prepared.')
