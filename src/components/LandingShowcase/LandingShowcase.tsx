'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import './LandingShowcase.css'

const chapters = [
  {
    id: 'onboarding',
    index: '01',
    title: 'Tu ciclo y tu reporte desde el primer paso',
    summary:
      'Ingresa tu periodo UPAO (como 2023-10 o 2025-10) para calcular tu ciclo actual y cargar tu Reporte de Notas PDF, Ficha de Matrícula o Excel.',
    image: '/landing/onboarding.png',
    alt: 'Configuración inicial de RutaCréditos mostrando el cálculo del Ciclo VIII, la transición ICSI a ISIA y la carga local de archivos'
  },
  {
    id: 'malla',
    index: '02',
    title: 'Tu malla por ciclos con reglas y electivos claros',
    summary:
      'Recorre los diez ciclos, filtra por estado en un clic, ubica tu ciclo actual resaltado y consulta tus dos cupos electivos separados.',
    image: '/landing/malla-ciclos.png',
    alt: 'Malla curricular ISIA 2025 organizada por ciclos en RutaCréditos con filtros por estado'
  },
  {
    id: 'planner',
    index: '03',
    title: 'Tus próximos ciclos armados según tus créditos',
    summary:
      'Convalida ICSI a ISIA en un clic, proyecta varios periodos consecutivos según tu límite de créditos y compara dos cargas antes de matricularte.',
    image: '/landing/planificador.png',
    alt: 'Planificador multiperiodo de RutaCréditos proyectando cursos sugeridos para los siguientes ciclos según el límite de créditos'
  }
]

export default function LandingShowcase() {
  const [activeId, setActiveId] = useState(chapters[0].id)
  const active = chapters.find(c => c.id === activeId) ?? chapters[0]

  return (
    <section
      id='recorrido-visual'
      className='showcase-section wrap'
      aria-labelledby='showcase-title'
    >
      <div className='showcase-header'>
        <div>
          <p className='eyebrow'>ASÍ SE VE POR DENTRO</p>
          <h2 id='showcase-title'>
            De tu reporte de notas a tu próximo ciclo, sin hojas sueltas.
          </h2>
        </div>
        <Link className='text-link' href='/app'>
          Abrir mi espacio →
        </Link>
      </div>
      <div className='showcase-surface'>
        <div
          id='showcase-panel'
          className='showcase-viewport'
          role='tabpanel'
          aria-labelledby={`showcase-tab-${active.id}`}
        >
          {chapters.map(chapter => {
            const selected = chapter.id === active.id

            return (
              <Image
                key={chapter.id}
                src={chapter.image}
                fill
                loading='eager'
                sizes='(max-width: 900px) 100vw, 1184px'
                alt={chapter.alt}
                aria-hidden={!selected}
                className={selected ? 'is-visible' : ''}
              />
            )
          })}
        </div>
        <div
          className='showcase-chapters'
          role='tablist'
          aria-label='Pantallas principales de RutaCréditos'
        >
          {chapters.map(chapter => {
            const selected = chapter.id === active.id

            return (
              <button
                key={chapter.id}
                id={`showcase-tab-${chapter.id}`}
                type='button'
                role='tab'
                aria-selected={selected}
                aria-controls='showcase-panel'
                className={`showcase-chapter ${selected ? 'is-active' : ''}`}
                onClick={() => setActiveId(chapter.id)}
              >
                <span className='showcase-chapter-index'>{chapter.index}</span>
                <strong>{chapter.title}</strong>
                <span>{chapter.summary}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
