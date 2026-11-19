'use client'

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon
} from '@phosphor-icons/react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import './LandingShowcase.css'

const chapters = [
  {
    id: 'onboarding',
    index: '01',
    route: 'Configuración · Ingreso y reporte',
    title: 'Tu ciclo y tu reporte desde el primer paso',
    summary:
      'Ingresa tu periodo UPAO (2023-10 o 2025-10), calculamos tu ciclo actual y cargamos tu Reporte de Notas PDF, Ficha de Matrícula o Excel sin subir nada a servidores.',
    href: '/app',
    cta: 'Configurar mi ingreso',
    image: '/landing/onboarding.png',
    alt: 'Configuración inicial de RutaCréditos mostrando el cálculo del Ciclo VIII, la transición ICSI a ISIA y la carga local de archivos'
  },
  {
    id: 'malla',
    index: '02',
    route: 'Mi malla · Vista por ciclos',
    title: 'Tu malla por ciclos con estados y electivos claros',
    summary:
      'Recorre los diez ciclos en orden, filtra aprobados, en curso o bloqueados en un clic y revisa tus dos cupos electivos separados con su fuente oficial.',
    href: '/app?mode=demo',
    cta: 'Ver el ejemplo por ciclos',
    image: '/landing/malla-ciclos.png',
    alt: 'Malla curricular ISIA 2025 organizada por ciclos en RutaCréditos con cursos aprobados, en curso y disponibles'
  },
  {
    id: 'planner',
    index: '03',
    route: 'Planificador · Escenarios por créditos',
    title: 'Tus próximos ciclos armados según tus créditos',
    summary:
      'Convalida ICSI a ISIA en un clic, proyecta varios periodos consecutivos según tu tope de créditos (16 a 22 cr.) y compara dos cargas antes de matricularte.',
    href: '/app?mode=demo',
    cta: 'Probar el planificador',
    image: '/landing/planificador.png',
    alt: 'Planificador multiperiodo de RutaCréditos proyectando cursos sugeridos para los siguientes ciclos según el límite de créditos'
  }
]

export default function LandingShowcase() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = chapters[activeIndex] ?? chapters[0]

  const step = (delta: number) =>
    setActiveIndex(i => (i + delta + chapters.length) % chapters.length)

  return (
    <section
      id='recorrido-visual'
      className='showcase-shell'
      aria-labelledby='showcase-title'
    >
      <div className='showcase-stage'>
        <div className='showcase-inner'>
          <div className='showcase-header'>
            <div>
              <p className='showcase-eyebrow'>ASÍ SE VE POR DENTRO</p>
              <h2 id='showcase-title'>
                De tu reporte de notas
                <br />a tu próximo ciclo.
              </h2>
            </div>
            <Link className='showcase-header-link' href='/app'>
              Abrir mi espacio
              <ArrowUpRightIcon size={15} aria-hidden='true' />
            </Link>
          </div>

          <div className='showcase-grid'>
            <div className='showcase-rail'>
              <div
                className='showcase-chapters'
                role='tablist'
                aria-label='Pantallas principales de RutaCréditos'
              >
                {chapters.map((chapter, index) => {
                  const selected = index === activeIndex

                  return (
                    <button
                      key={chapter.id}
                      id={`showcase-tab-${chapter.id}`}
                      type='button'
                      role='tab'
                      aria-selected={selected}
                      aria-controls='showcase-panel'
                      className={`showcase-chapter ${selected ? 'is-active' : ''}`}
                      onClick={() => setActiveIndex(index)}
                    >
                      <span className='showcase-chapter-index'>
                        {chapter.index}
                      </span>
                      <span className='showcase-chapter-body'>
                        <strong>{chapter.title}</strong>
                        <span className='showcase-chapter-summary'>
                          {chapter.summary}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className='showcase-controls'>
                <Link className='showcase-cta' href={active.href}>
                  {active.cta}
                  <ArrowUpRightIcon size={15} aria-hidden='true' />
                </Link>
                <div className='showcase-pager'>
                  <span className='showcase-counter' aria-live='polite'>
                    {active.index} / 0{chapters.length}
                  </span>
                  <div className='showcase-arrows'>
                    <button
                      type='button'
                      className='showcase-arrow'
                      aria-label='Vista anterior'
                      onClick={() => step(-1)}
                    >
                      <ArrowLeftIcon size={15} aria-hidden='true' />
                    </button>
                    <button
                      type='button'
                      className='showcase-arrow'
                      aria-label='Siguiente vista'
                      onClick={() => step(1)}
                    >
                      <ArrowRightIcon size={15} aria-hidden='true' />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className='showcase-frame'>
              <div className='showcase-window'>
                <div className='showcase-chrome' aria-hidden='true'>
                  <span className='showcase-dots'>
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className='showcase-route'>{active.route}</span>
                </div>
                <div
                  id='showcase-panel'
                  className='showcase-viewport'
                  role='tabpanel'
                  aria-labelledby={`showcase-tab-${active.id}`}
                >
                  {chapters.map((chapter, index) => {
                    const selected = index === activeIndex

                    return (
                      <Image
                        key={chapter.id}
                        src={chapter.image}
                        fill
                        loading='eager'
                        sizes='(max-width: 960px) 100vw, 720px'
                        alt={chapter.alt}
                        aria-hidden={!selected}
                        className={selected ? 'is-visible' : ''}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
