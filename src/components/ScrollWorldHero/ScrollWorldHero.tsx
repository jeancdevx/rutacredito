'use client'

import { ArrowDownIcon, ArrowUpRightIcon } from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import './ScrollWorldHero.css'

const chapters = [
  {
    label: 'Ubícate',
    title: 'Tu próximo paso, claro.',
    description:
      'Tu historia académica tiene conexiones. Empieza por entender las tuyas.'
  },
  {
    label: 'Entiende',
    title: 'Cada bloqueo tiene una razón.',
    description:
      'Mira qué falta, qué ya cumpliste y qué regla todavía necesita verificarse.'
  },
  {
    label: 'Elige',
    title: 'Hay más de un camino.',
    description:
      'Prueba próximos ciclos. Compara posibilidades. El siguiente paso lo eliges tú.'
  }
]

// React adaptation of scroll-world: continuous time, blob seekability,
// coalesced seeks, native portrait, first-touch priming and a still fallback.
export default function ScrollWorldHero() {
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const progress = useRef<HTMLSpanElement>(null)
  const [chapter, setChapter] = useState(0)
  const [painted, setPainted] = useState(false)
  const [staticMode, setStaticMode] = useState(false)

  useEffect(() => {
    const element = root.current,
      media = video.current

    if (!element || !media) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)')
    const portrait = matchMedia('(max-width: 700px)')
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData === true
    const abort = new AbortController()
    let frame = 0,
      target = 0,
      position = 0,
      lastFrame = 0,
      lastChapter = 0,
      url = '',
      disposed = false,
      generation = 0
    let landscapeWidth = window.innerWidth
    const update = (now = 0) => {
      frame = 0

      if (reduce.matches || saveData) return
      const span = element.offsetHeight - window.innerHeight

      target = Math.max(
        0,
        Math.min(1, -element.getBoundingClientRect().top / Math.max(1, span))
      )

      const delta = lastFrame ? Math.min(64, now - lastFrame) : 1000 / 60

      lastFrame = now
      // scroll-world's 0.18 easing, normalized for 60/120 Hz. No idle loop.
      const keyboard =
        document.documentElement.dataset.inputMethod === 'keyboard'
      const difference = target - position

      position =
        keyboard || Math.abs(difference) < 0.0005
          ? target
          : position +
            difference * (1 - Math.pow(1 - 0.18, delta / (1000 / 60)))

      if (progress.current)
        progress.current.style.transform = `scaleX(${position})`
      const nextChapter = Math.min(2, Math.floor(position * 3))

      if (lastChapter !== nextChapter) {
        lastChapter = nextChapter
        setChapter(nextChapter)
      }

      seek()

      if (Math.abs(target - position) > 0.0005)
        frame = requestAnimationFrame(update)
      else lastFrame = 0
    }

    const seek = () => {
      if (
        !media.seeking &&
        media.readyState >= 2 &&
        Number.isFinite(media.duration)
      ) {
        const time = position * Math.max(0, media.duration - 0.05)

        const epsilon = portrait.matches ? 0.02 : 0.008

        if (Math.abs(media.currentTime - time) > epsilon)
          media.currentTime = time
      }
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const settled = () => {
      if (media.readyState >= 2) setPainted(true)
      seek()
    }

    const prime = () => {
      if (media.readyState < 2) return
      void media
        .play()
        .then(() => {
          media.pause()
          seek()
        })
        .catch(() => {})
    }

    const load = () => {
      const version = ++generation

      setStaticMode(reduce.matches || saveData)

      if (reduce.matches || saveData) {
        position = 0
        target = 0
        lastChapter = 0
        setChapter(0)
        media.removeAttribute('src')
        media.load()

        return
      }

      setPainted(false)
      void fetch(`/hero/world${portrait.matches ? '-mobile' : ''}.mp4`, {
        signal: abort.signal
      })
        .then(response => {
          if (!response.ok) throw Error('Media unavailable')

          return response.blob()
        })
        .then(blob => {
          if (disposed || version !== generation) return

          if (url) URL.revokeObjectURL(url)
          url = URL.createObjectURL(blob)
          media.src = url
          media.load()
        })
        .catch(() => {
          if (!disposed) setPainted(false)
        })
    }

    const resize = () => {
      // Mobile browser chrome changes height without changing composition.
      if (window.innerWidth !== landscapeWidth) {
        landscapeWidth = window.innerWidth
        schedule()
      }
    }

    const loaded = () => {
      void media
        .play()
        .then(() => {
          media.pause()
          settled()
        })
        .catch(() => {
          seek()
        })
    }

    media.addEventListener('loadeddata', loaded)
    media.addEventListener('seeked', settled)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('touchstart', prime, { once: true, passive: true })
    reduce.addEventListener('change', load)
    portrait.addEventListener('change', load)
    load()
    update()

    return () => {
      disposed = true
      abort.abort()
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', resize)
      window.removeEventListener('touchstart', prime)
      reduce.removeEventListener('change', load)
      portrait.removeEventListener('change', load)
      media.removeEventListener('loadeddata', loaded)
      media.removeEventListener('seeked', settled)
      media.pause()
      media.removeAttribute('src')
      media.load()

      if (url) URL.revokeObjectURL(url)
    }
  }, [])

  function visit(index: number) {
    const element = root.current

    if (!element) return
    window.scrollTo({
      top:
        element.offsetTop +
        (element.offsetHeight - window.innerHeight) *
          (index / 3 + (index ? 0.08 : 0)),
      behavior: 'instant'
    })
  }

  return (
    <section
      ref={root}
      className={`scroll-world relative bg-[#211a20] ${staticMode ? 'world-static' : ''}`}
      aria-label='Tu ruta, paso a paso'
    >
      <div className='world-stage sticky top-0 isolate h-svh min-h-[640px] overflow-clip max-[700px]:min-h-[680px]'>
        <div
          className='world-media pointer-events-none absolute inset-0 z-0'
          aria-hidden='true'
        >
          <picture>
            <source
              media='(max-width: 700px)'
              srcSet='/hero/world-mobile.webp'
            />
            <Image
              src='/hero/world.webp'
              alt=''
              fill
              sizes='100vw'
              preload
              className='world-poster'
            />
          </picture>
          <video
            ref={video}
            muted
            playsInline
            preload='none'
            tabIndex={-1}
            className={painted ? 'world-film painted' : 'world-film'}
          />
        </div>
        <div className='world-content absolute z-2'>
          <div className='world-copy'>
            <p className='eyebrow world-eyebrow'>
              <span /> TU RUTA ACADÉMICA, A TU RITMO
            </p>
            <div className='world-headline-track'>
              {chapters.map((item, index) => (
                <div
                  key={item.label}
                  className='world-headline'
                  data-position={
                    index < chapter
                      ? 'before'
                      : index > chapter
                        ? 'after'
                        : 'active'
                  }
                  aria-hidden={index !== chapter}
                  inert={index !== chapter}
                >
                  {index === 0 ? (
                    <h1 aria-label='Tu próximo paso, claro.'>
                      Tu próximo
                      <br />
                      <em>paso, claro.</em>
                    </h1>
                  ) : (
                    <h2>{item.title}</h2>
                  )}
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className='world-actions'>
            <Link className='button' href='/app'>
              Explorar mi malla <ArrowUpRightIcon size={19} />
            </Link>
            <Link className='world-demo' href='/app?mode=demo'>
              Probar con un ejemplo <span aria-hidden='true'>→</span>
            </Link>
            <p>Gratis · Sin cuenta · Datos en tu navegador</p>
          </div>
        </div>
        <div className='world-route' aria-label='Momentos del recorrido'>
          {chapters.map((item, index) => (
            <button
              key={item.label}
              onClick={() => visit(index)}
              aria-label={`0${index + 1} ${item.label}`}
              aria-current={chapter === index ? 'step' : undefined}
            >
              <span className='world-route-number'>0{index + 1}</span>
              <span>{item.label}</span>
              <span className='world-route-line' />
            </button>
          ))}
        </div>
        <div className='world-bottom'>
          <span>ISIA & TRANSICIÓN ICSI · UPAO</span>
          <Link href='#vista-producto'>
            Desliza para descubrir <ArrowDownIcon size={15} />
          </Link>
          <span>ESCENA CONCEPTUAL · PROYECTO INDEPENDIENTE</span>
        </div>
        <div className='world-progress'>
          <span ref={progress} />
        </div>
      </div>
      <div className='world-static-notes'>
        <p>
          <strong>Entiende cada bloqueo.</strong> Consulta requisitos y fuentes.
        </p>
        <p>
          <strong>Elige cómo seguir.</strong> Simula ciclos sujetos a aprobación
          y disponibilidad.
        </p>
      </div>
    </section>
  )
}
