'use client'

import { ArrowLeftIcon, ArrowRightIcon, XIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

import './GuidedTour.css'
import Dovi from '@/components/Dovi'

type TourStep = {
  id: string
  tab: string
  target: string
  dovi: 'bienvenida' | 'atento' | 'leyendo' | 'pensando' | 'alegre'
  eyebrow: string
  title: string
  body: string
}

const steps: TourStep[] = [
  {
    id: 'profile',
    tab: 'malla',
    target: '[data-tour="profile"]',
    dovi: 'bienvenida',
    eyebrow: 'PASO 1 DE 5 · TU PERFIL Y CICLO',
    title: 'Tu ciclo se calcula por tu periodo de ingreso',
    body: 'Haz clic aquí cuando quieras cambiar tu periodo de ingreso (ej. 2023-10 o 2025-10), ajustar tu ciclo actual o definir cuántos créditos prefieres llevar cada semestre.'
  },
  {
    id: 'import',
    tab: 'backups',
    target: '[data-tour="import-box"]',
    dovi: 'leyendo',
    eyebrow: 'PASO 2 DE 5 · IMPORTACIÓN RÁPIDA',
    title: 'Sube tu Reporte de Notas, Ficha de Matrícula o Excel',
    body: 'No tienes que llenar curso por curso. Sube tu Reporte de Notas PDF, tu Ficha de Matrícula PDF (cursos en curso) o un Excel (.xlsx) / CSV y confirma tus aprobados en un clic.'
  },
  {
    id: 'transition',
    tab: 'transition',
    target: '[data-tour="nav-transition"]',
    dovi: 'atento',
    eyebrow: 'PASO 3 DE 5 · TRANSICIÓN ICSI → ISIA',
    title: 'Mapea tus cursos de ICSI a la nueva malla ISIA',
    body: 'Si ingresaste cuando era ICSI, aquí puedes aplicar en un solo clic todas las correspondencias documentadas hacia ISIA 2025 para ver exactamente qué cursos ya tienes cubiertos.'
  },
  {
    id: 'malla',
    tab: 'malla',
    target: '[data-tour="malla-controls"]',
    dovi: 'pensando',
    eyebrow: 'PASO 4 DE 5 · TU MALLA INTERACTIVA',
    title: 'Filtra por estado o explora por ciclos',
    body: 'Cambia entre Conexiones, Por ciclos y Lista, o toca las etiquetas de estado para ver al instante tus cursos aprobados, en curso, disponibles y bloqueados. Tu ciclo actual aparece resaltado.'
  },
  {
    id: 'planner',
    tab: 'planner',
    target: '[data-tour="nav-planner"]',
    dovi: 'alegre',
    eyebrow: 'PASO 5 DE 5 · PLANIFICADOR AUTOMÁTICO',
    title: 'Arma automáticamente tu próximo ciclo',
    body: 'Usa «Plan automático» para que RutaCréditos sugiera tus cursos del próximo periodo electivo (ej. 2027-10) respetando prerrequisitos, equivalencias y tu límite de créditos.'
  }
]

type Rect = { top: number; left: number; width: number; height: number }

export default function GuidedTour({
  open,
  onClose,
  onNavigate
}: {
  open: boolean
  onClose: () => void
  onNavigate: (tab: string) => void
}) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const step = steps[index]

  useEffect(() => {
    if (!open) return
    onNavigate(step.tab)
    const measure = () => {
      const el = document.querySelector(step.target)

      if (!el) {
        setRect(null)

        return
      }

      const box = el.getBoundingClientRect()

      if (box.width === 0 || box.height === 0) {
        setRect(null)

        return
      }

      setRect({
        top: Math.max(8, box.top - 6),
        left: Math.max(8, box.left - 6),
        width: Math.min(window.innerWidth - 16, box.width + 12),
        height: Math.min(window.innerHeight - 16, box.height + 12)
      })
    }

    const timer = window.setTimeout(measure, 120)

    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, index, step.tab, step.target, onNavigate])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()

      if (e.key === 'ArrowRight' && index < steps.length - 1)
        setIndex(i => i + 1)

      if (e.key === 'ArrowLeft' && index > 0) setIndex(i => i - 1)
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [open, index, onClose])

  if (!open) return null

  const cardWidth = Math.min(420, window.innerWidth - 32)
  const cardHeight = 290
  let cardTop = Math.max(24, (window.innerHeight - cardHeight) / 2)
  let cardLeft = Math.max(16, (window.innerWidth - cardWidth) / 2)

  if (rect && window.innerWidth > 760) {
    const spaceRight = window.innerWidth - (rect.left + rect.width)
    const spaceBelow = window.innerHeight - (rect.top + rect.height)

    if (spaceRight >= cardWidth + 28) {
      cardLeft = rect.left + rect.width + 18
      cardTop = Math.min(
        window.innerHeight - cardHeight - 20,
        Math.max(20, rect.top)
      )
    } else if (spaceBelow >= cardHeight + 24) {
      cardTop = rect.top + rect.height + 16
      cardLeft = Math.min(
        window.innerWidth - cardWidth - 16,
        Math.max(16, rect.left)
      )
    } else if (rect.top >= cardHeight + 24) {
      cardTop = rect.top - cardHeight - 16
      cardLeft = Math.min(
        window.innerWidth - cardWidth - 16,
        Math.max(16, rect.left)
      )
    }
  }

  return (
    <>
      {!rect && (
        <button
          type='button'
          className='tour-backdrop'
          aria-label='Cerrar guía rápida'
          onClick={onClose}
        />
      )}
      {rect && (
        <div
          className='tour-spotlight'
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          }}
        />
      )}
      <dialog
        open
        className='tour-card'
        aria-label={`Guía rápida: ${step.title}`}
        style={{ top: cardTop, left: cardLeft }}
      >
        <div className='tour-card-head'>
          <Dovi state={step.dovi} />
          <div>
            <p className='eyebrow'>{step.eyebrow}</p>
            <h2>{step.title}</h2>
          </div>
          <button
            type='button'
            className='icon-button tour-close'
            aria-label='Cerrar guía rápida'
            onClick={onClose}
          >
            <XIcon size={18} />
          </button>
        </div>
        <p className='tour-body'>{step.body}</p>
        <div className='tour-dots' aria-hidden='true'>
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={i === index ? 'active' : i < index ? 'done' : ''}
            />
          ))}
        </div>
        <div className='tour-footer'>
          <button type='button' className='text-button' onClick={onClose}>
            Omitir guía
          </button>
          <div className='tour-footer-actions'>
            {index > 0 && (
              <button
                type='button'
                className='secondary'
                onClick={() => setIndex(i => i - 1)}
              >
                <ArrowLeftIcon size={14} />
                Anterior
              </button>
            )}
            {index < steps.length - 1 ? (
              <button type='button' onClick={() => setIndex(i => i + 1)}>
                Siguiente
                <ArrowRightIcon size={14} />
              </button>
            ) : (
              <button
                type='button'
                onClick={() => {
                  setIndex(0)
                  onClose()
                }}
              >
                ¡Entendido!
              </button>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
