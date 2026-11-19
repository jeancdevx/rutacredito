'use client'

import { ArrowUpRightIcon } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import Dovi from '@/components/Dovi'

export default function ClosingInvitation() {
  const copy = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = copy.current

    if (!node) return
    let animation: Animation | undefined
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return

        if (
          !matchMedia('(prefers-reduced-motion: reduce)').matches &&
          document.documentElement.dataset.inputMethod !== 'keyboard'
        )
          animation = node.animate(
            [
              { opacity: 0.4, transform: 'translateY(12px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ],
            {
              duration: 500,
              easing: getComputedStyle(document.documentElement)
                .getPropertyValue('--ease')
                .trim()
            }
          )
        observer.disconnect()
      },
      { threshold: 0.35 }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
      animation?.cancel()
    }
  }, [])

  return (
    <section
      className='closing-invitation relative isolate mx-4 overflow-hidden rounded-3xl bg-plum px-6 py-14 text-paper min-[701px]:mx-6 min-[701px]:px-14 min-[701px]:py-20'
      aria-labelledby='invitation-title'
    >
      <div className='mx-auto max-w-[1120px]'>
        <div ref={copy} className='max-w-[760px]'>
          <p className='mb-6 text-[10px] tracking-[.12em] text-peach'>
            TU RUTA CONTINÚA
          </p>
          <h2
            id='invitation-title'
            className='m-0 font-editorial text-[clamp(48px,6vw,80px)] leading-[1.02] font-semibold tracking-[-.045em]'
          >
            Lo que viene
            <br />
            <span className='text-peach'>empieza contigo.</span>
          </h2>
          <p className='mt-6 mb-0 max-w-[430px] text-[14px] leading-7 text-[#d8c8d4]'>
            Mira tu avance, entiende tus opciones y dale forma a tu próximo
            ciclo.
          </p>
        </div>
        <div className='relative z-2 mt-8 flex flex-wrap items-center gap-3 min-[701px]:gap-6'>
          <Link
            href='/app'
            className='button gap-8 rounded-full px-6 py-3.5 text-paper hover:text-paper'
          >
            Explorar mi malla
            <ArrowUpRightIcon size={18} />
          </Link>
          <Link
            href='/app?mode=demo'
            className='inline-flex min-h-12 items-center gap-4 rounded-full border border-paper/25 px-6 py-3 text-[13px] font-semibold text-paper no-underline transition-colors duration-150 hover:border-peach/60 hover:bg-paper/5 hover:text-peach'
          >
            Probar un ejemplo<span aria-hidden='true'>→</span>
          </Link>
        </div>
        <div className='mt-8 flex items-end justify-between gap-4'>
          <p className='m-0 text-[10px] text-[#c2afc4]'>
            Gratis. Sin cuenta.
            <br />
            Solo en tu navegador.
          </p>
          <Dovi
            state='bienvenida'
            className='h-32! w-32! shrink-0 min-[701px]:absolute min-[701px]:right-12 min-[701px]:bottom-12'
          />
        </div>
      </div>
    </section>
  )
}
