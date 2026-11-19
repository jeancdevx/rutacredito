import { spawnSync } from 'node:child_process'
import { mkdirSync, renameSync } from 'node:fs'

mkdirSync('public/hero', { recursive: true })

function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-y', ...args], { stdio: 'inherit' })

  if (result.status !== 0)
    throw Error('FFmpeg did not finish. Existing media were not validated.')
}

for (const [source, stem, crf, gop, extra] of [
  ['motion/ruta-world/renders/desktop-master.mp4', 'world', '20', '8', []],
  [
    'motion/.portrait/renders/mobile-master.mp4',
    'world-mobile',
    '23',
    '4',
    ['-vf', 'scale=720:1280']
  ]
]) {
  const encoded = source.replace('.mp4', '-web.mp4')
  const poster = source.replace('.mp4', '-web.webp')

  ffmpeg([
    '-i',
    source,
    '-an',
    ...extra,
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    crf,
    '-pix_fmt',
    'yuv420p',
    '-g',
    gop,
    '-keyint_min',
    gop,
    '-sc_threshold',
    '0',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'iec61966-2-1',
    '-colorspace',
    'bt709',
    '-color_range',
    'tv',
    '-movflags',
    '+faststart+write_colr',
    encoded
  ])
  ffmpeg(['-i', encoded, '-frames:v', '1', '-quality', '88', poster])
  renameSync(encoded, `public/hero/${stem}.mp4`)
  renameSync(poster, `public/hero/${stem}.webp`)
}
