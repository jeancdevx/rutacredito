'use client'

import { Popover } from '@base-ui/react/popover'
import { ArrowUpRightIcon, ListIcon, XIcon } from '@phosphor-icons/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import Brand from '@/components/Brand'

const links = [
  { href: '#vista-producto', text: 'La experiencia' },
  { href: '#recorrido-visual', text: 'Vistas' },
  { href: '/fuentes', text: 'El catálogo' },
  { href: '#preguntas', text: 'Preguntas' }
]

export default function LandingNavigation() {
  const [open, setOpen] = useState(false)
  const [inWorld, setInWorld] = useState(true)

  useEffect(() => {
    const world = document.querySelector('.scroll-world')

    if (!world) return
    const observer = new IntersectionObserver(
      entries => setInWorld(entries[0].isIntersecting),
      { rootMargin: '-90px 0px 0px 0px' }
    )

    observer.observe(world)

    return () => observer.disconnect()
  }, [])

  return (
    <header
      data-surface={inWorld ? 'dark' : 'light'}
      className={`world-navigation fixed top-4 right-4 left-4 z-40 flex h-16 items-center justify-between gap-3 rounded-full border py-1.5 pr-2.5 pl-4.5 shadow-[0_8px_32px_#100c1312] backdrop-blur-xl transition-colors duration-150 motion-reduce:transition-none min-[701px]:top-5 min-[701px]:right-10 min-[701px]:left-auto min-[701px]:h-17 min-[701px]:w-max min-[701px]:max-w-[92%] min-[701px]:gap-8 min-[701px]:py-2 min-[701px]:pr-3 min-[701px]:pl-6 [&_.brand_img]:h-auto [&_.brand_img]:w-45 ${inWorld ? 'border-paper/15 bg-[#211a20]/80 text-paper' : 'border-[#dfd0c4] bg-[#fffaf2]/95 text-plum'}`}
    >
      <Brand light={inWorld} />
      <nav
        aria-label='Navegación principal'
        className='flex items-center gap-2 min-[701px]:gap-7'
      >
        <div className='hidden items-center gap-6 min-[701px]:flex'>
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`py-2 text-[11px] no-underline underline-offset-4 hover:underline focus-visible:underline ${inWorld ? 'text-[#e1d4c8] hover:text-paper' : 'text-muted hover:text-coral'}`}
            >
              {link.text}
            </Link>
          ))}
        </div>
        <Link
          href='/app'
          className='hidden min-h-10.5 items-center gap-4 rounded-full border border-transparent bg-coral px-4.5 py-2.5 text-[11px] font-semibold text-paper no-underline transition-colors duration-150 hover:bg-[#9b382a] hover:text-paper motion-reduce:transition-none min-[701px]:flex'
        >
          Mi espacio <ArrowUpRightIcon size={16} />
        </Link>
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger
            aria-label={open ? 'Cerrar navegación' : 'Abrir navegación'}
            className={`flex size-9.5 min-h-9.5 items-center justify-center rounded-full border bg-transparent p-0 min-[701px]:hidden ${inWorld ? 'border-paper/20 text-paper hover:bg-paper/10' : 'border-border text-plum hover:bg-peach/30'}`}
          >
            {open ? <XIcon size={21} /> : <ListIcon size={21} />}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={16} align='end' className='z-70'>
              <Popover.Popup
                data-motion='popover'
                className='w-[min(320px,calc(100vw-32px))] origin-(--transform-origin) rounded-2xl border border-[#decec0] bg-[#fffaf2] p-6 text-plum shadow-[0_20px_64px_#38263d20] transition-[opacity,transform] duration-150 ease-fluid outline-none data-[ending-style]:-translate-y-1 data-[ending-style]:scale-97 data-[ending-style]:opacity-0 data-[starting-style]:-translate-y-1 data-[starting-style]:scale-97 data-[starting-style]:opacity-0 motion-reduce:transition-opacity motion-reduce:duration-150 motion-reduce:data-[ending-style]:translate-y-0 motion-reduce:data-[ending-style]:scale-100 motion-reduce:data-[starting-style]:translate-y-0 motion-reduce:data-[starting-style]:scale-100'
              >
                <Popover.Title className='mb-5 font-editorial text-[28px] leading-tight font-semibold'>
                  Encuentra tu siguiente paso.
                </Popover.Title>
                {[
                  ...links,
                  { href: '/app?mode=demo', text: 'Explorar un ejemplo' }
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className='flex min-h-12 items-center justify-between gap-4 border-t border-[#e9ddd0] text-[13px] no-underline hover:text-coral'
                  >
                    {link.text}
                    <ArrowUpRightIcon size={16} />
                  </Link>
                ))}
                <p className='mt-5 mb-0 text-[10px] text-muted'>
                  Gratis. Sin cuenta. A tu ritmo.
                </p>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </nav>
    </header>
  )
}
