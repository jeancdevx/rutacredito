'use client'

import { useEffect, useRef, useState } from 'react'

import './TaglineReveal.css'

const statement =
  'Sube tu reporte de notas, convalida tus cursos de ICSI a ISIA en un clic y proyecta tus próximos ciclos con cada regla explicada.'
const words = statement.split(' ')

export default function TaglineReveal() {
  const sectionRef = useRef<HTMLElement>(null)
  const [litCount, setLitCount] = useState(words.length)

  useEffect(() => {
    const node = sectionRef.current

    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // oxlint-disable-next-line react/set-state-in-effect -- Instant reveal under reduced motion.
      setLitCount(words.length)

      return
    }

    let active = false
    let rafId = 0

    const update = () => {
      rafId = 0
      const rect = node.getBoundingClientRect()
      const vh = window.innerHeight || 800
      const start = vh * 0.88
      const end = vh * 0.28
      const progress = Math.max(
        0,
        Math.min(1, (start - rect.top) / Math.max(1, start - end))
      )

      setLitCount(Math.max(1, Math.round(progress * words.length)))
    }

    const onScroll = () => {
      if (!active || rafId) return
      rafId = window.requestAnimationFrame(update)
    }

    const observer = new IntersectionObserver(
      entries => {
        active = entries.some(e => e.isIntersecting)

        if (active) update()
      },
      { rootMargin: '120px 0px 120px 0px' }
    )

    observer.observe(node)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)

      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className='reveal-band wrap'
      aria-label='Propuesta principal de RutaCréditos'
    >
      <div className='reveal-band-inner'>
        <p className='eyebrow'>CLARIDAD ANTES DE CADA MATRÍCULA</p>
        <p className='reveal-statement'>
          {words.map((word, idx) => (
            <span
              key={`${word}-${idx}`}
              className={`reveal-word ${idx < litCount ? 'is-lit' : ''}`}
            >
              {word}
              {idx < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
