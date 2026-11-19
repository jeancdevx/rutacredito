'use client'

import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  CaretDownIcon,
  ChartPieSliceIcon,
  CloudArrowDownIcon,
  CompassIcon,
  FloppyDiskIcon,
  GearSixIcon,
  GitBranchIcon,
  GraduationCapIcon,
  GridFourIcon,
  HouseIcon,
  InfoIcon,
  ListChecksIcon,
  ListIcon,
  LockSimpleIcon,
  SignOutIcon,
  SlidersHorizontalIcon,
  TrashIcon,
  XIcon
} from '@phosphor-icons/react'
import Image from 'next/image'

import './WorkspaceFrame.css'
import Link from 'next/link'
import { useState } from 'react'
import type { ReactNode, Ref } from 'react'

import Brand from '@/components/Brand'
import { roman } from '@/components/CurriculumMap/CurriculumMap.constants'
import Dialog from '@/components/Dialog'
import Dovi from '@/components/Dovi'
import { estimateAcademicCycle, formatPeriod } from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'
import type { Workspace } from '@/helpers/validation.helpers'

export const navigation = [
  {
    id: 'dashboard',
    icon: ChartPieSliceIcon,
    label: 'Mi avance',
    group: 'Tu recorrido'
  },
  { id: 'malla', icon: GridFourIcon, label: 'Mi malla', group: 'Tu recorrido' },
  {
    id: 'history',
    icon: ListChecksIcon,
    label: 'Historial',
    group: 'Tu recorrido'
  },
  {
    id: 'planner',
    icon: GraduationCapIcon,
    label: 'Planificador',
    group: 'Lo que viene'
  },
  {
    id: 'compare',
    icon: GitBranchIcon,
    label: 'Comparar',
    group: 'Lo que viene'
  },
  {
    id: 'transition',
    icon: SlidersHorizontalIcon,
    label: 'Transición',
    group: 'Lo que viene'
  },
  {
    id: 'backups',
    icon: CloudArrowDownIcon,
    label: 'Respaldos',
    group: 'Tus datos'
  }
]

export default function WorkspaceFrame({
  data,
  tab,
  onNavigate,
  onConfig,
  onTour,
  onClear,
  onReset,
  onUndo,
  undoCount,
  externalChange,
  mainRef,
  children
}: {
  data: Workspace
  tab: string
  onNavigate: (tab: string) => void
  onConfig: () => void
  onTour: () => void
  onClear: () => void
  onReset: () => void
  onUndo: () => void
  undoCount: number
  externalChange: boolean
  mainRef: Ref<HTMLElement>
  children: ReactNode
}) {
  const [menu, setMenu] = useState(false)
  const [quickStartDismissed, setQuickStartDismissed] = useState(false)
  const current = navigation.find(n => n.id === tab)
  const currentCycle =
    data.profile.currentCycle ?? estimateAcademicCycle(data.profile.cohort)

  function navigate(next: string) {
    setMenu(false)
    onNavigate(next)
  }

  function navItems() {
    return (
      <nav aria-label='Secciones de mi espacio'>
        {['Tu recorrido', 'Lo que viene', 'Tus datos'].map(group => (
          <div className='nav-group' key={group}>
            <p>{group}</p>
            {navigation
              .filter(n => n.group === group)
              .map(({ id, icon: NavIcon, label }) => (
                <button
                  key={id}
                  data-tour={`nav-${id}`}
                  aria-label={label}
                  className={tab === id ? 'nav-item active' : 'nav-item'}
                  aria-current={tab === id ? 'page' : undefined}
                  onClick={() => navigate(id)}
                >
                  <NavIcon size={20} weight={tab === id ? 'fill' : 'regular'} />
                  <span>{label}</span>
                  {id === 'planner' && data.scenarios.length > 0 && (
                    <span className='nav-count'>{data.scenarios.length}</span>
                  )}
                  {tab === id && <span className='nav-active-dot' />}
                </button>
              ))}
          </div>
        ))}
      </nav>
    )
  }

  function utilities() {
    return (
      <div className='sidebar-utilities'>
        <button
          onClick={() => {
            setMenu(false)
            onConfig()
          }}
        >
          <GearSixIcon size={18} />
          Revisar configuración
        </button>
        <Link href='/fuentes'>
          <InfoIcon size={18} />
          Fuentes y ayuda
          <ArrowRightIcon size={14} />
        </Link>
        <Link href={data.mode === 'demo' ? '/app' : '/app?mode=demo'}>
          <SignOutIcon size={18} />
          {data.mode === 'demo'
            ? 'Ir a mi espacio personal'
            : 'Probar el ejemplo'}
        </Link>
        <details className='space-settings'>
          <summary>
            <span>Opciones de este espacio</span>
            <CaretDownIcon size={14} />
          </summary>
          <div>
            {data.mode === 'demo' && (
              <button
                onClick={() => {
                  setMenu(false)
                  onReset()
                }}
              >
                <ArrowCounterClockwiseIcon size={16} />
                Restablecer demo
              </button>
            )}
            <button
              className='danger'
              onClick={() => {
                setMenu(false)
                onClear()
              }}
            >
              <TrashIcon size={16} />
              Borrar este espacio
            </button>
            <Link href='/privacidad'>Privacidad y condiciones</Link>
          </div>
        </details>
      </div>
    )
  }

  return (
    <div className='product-shell'>
      <aside className='app-sidebar'>
        <div className='sidebar-brand'>
          <Brand light />
          <span className='edition-mark'>TU COMPAÑERO DE RUTA</span>
        </div>
        <button
          className='workspace-switch'
          data-tour='profile'
          onClick={onConfig}
        >
          <span className='workspace-avatar'>
            <GraduationCapIcon size={20} />
          </span>
          <span>
            <strong>
              {data.mode === 'demo'
                ? 'Espacio de ejemplo'
                : `Ciclo ${roman[currentCycle - 1]} · ${formatPeriod(data.profile.cohort)}`}
            </strong>
            <small>
              {data.profile.transition === 'transition'
                ? 'ICSI → ISIA 2025'
                : 'ISIA 2025'}{' '}
              <span>·</span>{' '}
              {data.mode === 'demo' ? 'Demo ficticio' : 'Guardado local'}
            </small>
          </span>
          <CaretDownIcon size={14} />
        </button>
        <div className='sidebar-scroll'>{navItems()}</div>
        <div className='sidebar-bottom-section'>
          {utilities()}
          <div className='sidebar-local'>
            <span className='local-dot' />
            <span>Tu información se queda contigo.</span>
            <LockSimpleIcon size={13} />
          </div>
        </div>
      </aside>
      <div className='product-content'>
        <header className='product-header'>
          <div className='desktop-breadcrumb'>
            <Link href='/' aria-label='Volver al inicio'>
              <HouseIcon size={18} />
            </Link>
            <span>/</span>
            <span>Mi espacio</span>
            <span>/</span>
            <strong>{current?.label}</strong>
          </div>
          <div className='mobile-brand'>
            <Brand />
          </div>
          <div className='product-header-actions'>
            <span className='saved-indicator'>
              <span className='local-dot' />
              Datos locales
            </span>
            <button
              type='button'
              className='header-tour'
              aria-label='Guía rápida'
              onClick={onTour}
              title='Iniciar recorrido guiado paso a paso'
            >
              <CompassIcon size={16} />
              <span>Guía rápida</span>
            </button>
            <button
              className='header-undo'
              aria-label={`Deshacer ${undoCount ? `(${undoCount})` : ''}`}
              disabled={!undoCount || externalChange}
              onClick={onUndo}
              title='Deshacer último cambio'
            >
              <ArrowCounterClockwiseIcon size={18} />
              <span>Deshacer</span>
            </button>
            <button
              className='header-backup'
              onClick={() => navigate('backups')}
            >
              <FloppyDiskIcon size={16} />
              <span>Respaldar</span>
            </button>
            <button
              className='mobile-menu-button'
              aria-label='Abrir menú de navegación'
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <ListIcon size={22} />
            </button>
          </div>
        </header>
        <div
          className={`context-banner ${data.mode === 'demo' ? 'is-demo' : ''}`}
        >
          <div>
            <span className='banner-marker'>
              {data.mode === 'demo' ? 'DEMO' : 'LOCAL'}
            </span>
            <span>
              {data.mode === 'demo' ? (
                <>
                  <strong>Estás explorando un ejemplo ficticio.</strong>
                  <span className='banner-extra'>
                    {' '}
                    Todo está listo para que pruebes.
                  </span>
                </>
              ) : (
                <>
                  Tus datos, en este navegador.
                  <span className='banner-extra'>
                    {' '}
                    Conserva una copia para volver cuando quieras.
                  </span>
                </>
              )}
            </span>
          </div>
          <Link href={data.mode === 'demo' ? '/app' : '/privacidad'}>
            {data.mode === 'demo' ? 'Crear mi espacio' : 'Cómo se guardan'}
            <ArrowRightIcon size={16} />
          </Link>
        </div>
        {externalChange && (
          <div className='error conflict-banner' role='alert'>
            Este espacio cambió en otra pestaña. Recarga para usar la versión
            más reciente.
            <button onClick={() => window.location.reload()}>
              Recargar datos
            </button>
          </div>
        )}
        <main id='main' className='workspace-main' ref={mainRef} tabIndex={-1}>
          {data.mode === 'personal' &&
            data.attempts.length === 0 &&
            !quickStartDismissed &&
            tab !== 'backups' && (
              <section className='quickstart-banner' aria-label='Inicio rápido'>
                <div className='quickstart-banner-copy'>
                  <Dovi state='bienvenida' />
                  <div>
                    <strong>
                      Empieza en 30 segundos sin digitar curso por curso
                    </strong>
                    <span>
                      Sube tu Reporte de Notas PDF, Ficha de Matrícula o Excel
                      (.xlsx), o sigue nuestra guía rápida de 5 pasos.
                    </span>
                  </div>
                </div>
                <div className='quickstart-banner-actions'>
                  <button type='button' onClick={() => navigate('backups')}>
                    Subir PDF / Excel
                  </button>
                  <button type='button' className='secondary' onClick={onTour}>
                    Ver guía (5 pasos)
                  </button>
                  <button
                    type='button'
                    className='icon-button'
                    style={{ color: '#f6f0e6' }}
                    aria-label='Ocultar aviso de inicio rápido'
                    onClick={() => setQuickStartDismissed(true)}
                  >
                    <XIcon size={18} />
                  </button>
                </div>
              </section>
            )}
          <div key={tab} className='workspace-view'>
            {children}
          </div>
        </main>
        <footer className='product-footer'>
          <span>
            <Image
              src='/brand/rc-simbolo-color.svg'
              width='24'
              height='24'
              alt=''
            />
            Tu próximo paso, claro.
          </span>
          <Link href='/fuentes'>
            Datos {catalog.version}
            <ArrowRightIcon size={14} />
          </Link>
          <small>
            Proyecto independiente. No es un sistema oficial de UPAO.
          </small>
        </footer>
      </div>
      <nav className='mobile-bottom-nav' aria-label='Accesos rápidos'>
        {navigation
          .filter(n =>
            ['dashboard', 'malla', 'planner', 'compare'].includes(n.id)
          )
          .map(({ id, icon: NavIcon, label }) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => navigate(id)}
              aria-current={tab === id ? 'page' : undefined}
            >
              <NavIcon size={20} weight={tab === id ? 'fill' : 'regular'} />
              <span>{label}</span>
            </button>
          ))}
        <button onClick={() => setMenu(true)}>
          <ListIcon size={20} />
          <span>Más</span>
        </button>
      </nav>
      {menu && (
        <Dialog
          title='Tu espacio de RutaCréditos'
          className='navigation-dialog'
          onClose={() => setMenu(false)}
        >
          {navItems()}
          {utilities()}
        </Dialog>
      )}
    </div>
  )
}
