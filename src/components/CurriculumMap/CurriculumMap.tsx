'use client'

import {
  ArrowRightIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  SparkleIcon
} from '@phosphor-icons/react'
import Link from 'next/link'

import './CurriculumMap.css'
import { useMemo, useState } from 'react'

import CourseRoute from '@/components/CourseRoute'
import Select, { SelectOption } from '@/components/Select'
import StatusBadge from '@/components/StatusBadge'
import {
  account,
  applyDocumentedRecognitions,
  courseStatus,
  estimateAcademicCycle,
  formatPeriod,
  references
} from '@/helpers/academic.helpers'
import type { Status } from '@/helpers/academic.helpers'
import { catalog, courseByCode, courseName } from '@/helpers/curriculum.helpers'
import type { Course, Workspace } from '@/helpers/validation.helpers'

import CourseDetail from './CourseDetail'
import { roman } from './CurriculumMap.constants'

export default function CurriculumMap({
  data,
  initialCourse = null,
  onEdit,
  onChange
}: {
  data: Workspace
  initialCourse?: string | null
  onEdit: (code: string) => void
  onChange?: (next: Workspace, message: string) => void
}) {
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [view, setView] = useState<'route' | 'grid' | 'list'>('route'),
    [selected, setSelected] = useState<string | null>(initialCourse)
  const progress = useMemo(() => account(data, catalog), [data])
  const currentCycle =
    data.profile.currentCycle ?? estimateAcademicCycle(data.profile.cohort)
  const states = useMemo(
    () =>
      new Map(
        catalog.courses.map(c => [
          c.code,
          courseStatus(c, data, catalog, progress.context)
        ])
      ),
    [data, progress]
  )
  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = {
      passed: 0,
      'in-progress': 0,
      available: 0,
      blocked: 0,
      unknown: 0
    }

    for (const c of catalog.courses) {
      const s = states.get(c.code)?.status

      if (s) counts[s]++
    }

    return counts
  }, [states])
  const courses = catalog.courses.filter(
    c =>
      `${c.code} ${c.name}`
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .includes(
          search
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
        ) &&
      (filter === 'all' ||
        (filter === 'elective'
          ? !c.required
          : states.get(c.code)?.status === filter))
  )
  const selectedCourse = selected ? courseByCode.get(selected) : undefined
  const related = new Set(
    selectedCourse
      ? [
          ...references(selectedCourse.prerequisite),
          ...catalog.courses
            .filter(c =>
              references(c.prerequisite).includes(selectedCourse.code)
            )
            .map(c => c.code)
        ]
      : []
  )

  const mandatoryCourses = courses.filter(c => c.required)
  const electiveCourses = courses.filter(c => !c.required)
  const elective1 = electiveCourses.filter(
    c => c.electiveGroup === 'electivo-1'
  )
  const elective2 = electiveCourses.filter(
    c => c.electiveGroup === 'electivo-2'
  )

  function renderCourseButton(course: Course, compact = false) {
    const state = states.get(course.code)!

    return (
      <button
        className={`course course-${state.status} ${compact ? 'course-compact' : ''} ${related.has(course.code) ? 'related' : ''}`}
        key={course.code}
        onClick={() => setSelected(course.code)}
        aria-label={`${course.name}, ${course.code}, ${state.status === 'passed' ? 'aprobado' : state.evaluation.verdict}`}
      >
        <span className='course-code'>
          {course.code}
          <span>{course.credits} cr.</span>
        </span>
        <strong>{course.name}</strong>
        <div>
          <StatusBadge status={state.status} />
          {!course.required && <span className='elective-tag'>E</span>}
        </div>
      </button>
    )
  }

  return (
    <>
      <div className='page-title'>
        <div>
          <p className='eyebrow'>
            TU PANORAMA ACADÉMICO · CICLO {roman[currentCycle - 1]} (INGRESO{' '}
            {formatPeriod(data.profile.cohort)})
          </p>
          <h1>
            Mi malla<span className='coral'>.</span>
          </h1>
          <p>Ubica tu avance. Abre un curso para entender su siguiente paso.</p>
        </div>
        <span className='plan-chip'>
          ISIA · 2025 <span aria-hidden='true'>↗</span>
        </span>
      </div>
      <section className='malla-overview' aria-label='Resumen de tu malla'>
        <div className='overview-progress'>
          <svg viewBox='0 0 64 64' aria-hidden='true'>
            <circle className='ring-track' cx='32' cy='32' r='27' />
            <circle
              className='ring-value'
              cx='32'
              cy='32'
              r='27'
              pathLength='100'
              strokeDasharray={`${progress.percent} 100`}
            />
          </svg>
          <GraduationCapIcon size={23} />
          <div>
            <strong>
              {progress.recognizedCredits}
              <span> / 205 cr.</span>
            </strong>
            <small>Reconocidos en ISIA</small>
          </div>
        </div>
        <div className='overview-metric'>
          <span className='overview-icon approved'>
            <CheckCircleIcon size={20} />
          </span>
          <div>
            <strong>
              {progress.passed.size}
              <span> cursos</span>
            </strong>
            <small>Aprobados o reconocidos</small>
          </div>
        </div>
        <div className='overview-metric'>
          <span className='overview-icon available'>
            <SparkleIcon size={20} />
          </span>
          <div>
            <strong>
              {statusCounts.available}
              <span> opciones</span>
            </strong>
            <small>Con requisitos verificados</small>
          </div>
        </div>
        <Link className='overview-source' href='/fuentes'>
          Tu plan,
          <br />
          con referencias
          <ArrowRightIcon size={18} />
        </Link>
      </section>
      {progress.pendingRecognition.length > 0 && onChange && (
        <div
          className='notice'
          style={{
            background: '#38263d',
            borderColor: '#38263d',
            color: '#f6f0e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong style={{ color: '#f7d4c2' }}>
              <SparkleIcon
                size={15}
                style={{ display: 'inline', marginRight: 6 }}
              />
              Tienes {progress.pendingRecognition.length} cursos aprobados de
              ICSI pendientes de convalidar a ISIA 2025
            </strong>
            <p style={{ color: '#e6dce8', marginTop: 6, marginBottom: 0 }}>
              Incluye:{' '}
              {progress.pendingRecognition
                .slice(0, 3)
                .map(eq => courseName(eq.to[0]))
                .join(', ')}
              {progress.pendingRecognition.length > 3 ? '…' : ''}. Convalídalos
              en un clic para que tu malla y planificador reflejen tu ciclo
              real.
            </p>
          </div>
          <button
            type='button'
            onClick={() => {
              const mapped = applyDocumentedRecognitions(data, catalog, {
                includePending: true
              })

              onChange(
                { ...data, recognitions: mapped.recognitions },
                `${mapped.added} cursos convalidados de ICSI → ISIA. Tu malla y planificador se actualizaron.`
              )
            }}
          >
            Convalidar ahora en 1 clic
          </button>
        </div>
      )}
      <div className='toolbar' data-tour='malla-controls'>
        <label className='search-label'>
          <span aria-hidden='true'>⌕</span>
          <input
            type='search'
            placeholder='Buscar por nombre o código'
            aria-label='Buscar curso en la malla'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <label className='filter-label'>
          Estado
          <Select
            value={filter}
            onValueChange={value => setFilter(value)}
            aria-label={['Estado'].join(' ')}
          >
            <SelectOption value='all'>Todos los cursos</SelectOption>
            {Object.entries({
              passed: 'Aprobados',
              'in-progress': 'En curso',
              available: 'Disponibles',
              blocked: 'Bloqueados',
              unknown: 'Por verificar',
              elective: 'Electivos'
            }).map(([v, l]) => (
              <SelectOption key={v} value={v}>
                {l}
              </SelectOption>
            ))}
          </Select>
        </label>
        <div className='segmented' aria-label='Vista de malla'>
          <button
            className={view === 'route' ? 'selected' : ''}
            aria-pressed={view === 'route'}
            onClick={() => setView('route')}
          >
            Conexiones
          </button>
          <button
            className={view === 'grid' ? 'selected' : ''}
            aria-pressed={view === 'grid'}
            onClick={() => setView('grid')}
          >
            Por ciclos
          </button>
          <button
            className={view === 'list' ? 'selected' : ''}
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            Lista
          </button>
        </div>
      </div>
      <div className='malla-legend' aria-label='Filtrar rápidamente por estado'>
        {(
          [
            'passed',
            'in-progress',
            'available',
            'blocked',
            'unknown'
          ] as Status[]
        ).map(s => (
          <button
            type='button'
            key={s}
            className={`legend-filter ${filter === s ? 'active' : ''}`}
            aria-pressed={filter === s}
            onClick={() => {
              const next = filter === s ? 'all' : s

              setFilter(next)

              if (next !== 'all' && view === 'route') setView('grid')
            }}
          >
            <StatusBadge status={s} />
            <span className='legend-count'>{statusCounts[s]}</span>
          </button>
        ))}
        <span className='caption'>E · opción electiva</span>
      </div>
      {view === 'route' && !search && filter === 'all' ? (
        <CourseRoute data={data} onInspect={setSelected} />
      ) : (
        <>
          <div
            className={`malla-board ${view === 'list' ? 'list-view' : ''}`}
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- A scrollable curriculum must be keyboard focusable.
            tabIndex={0}
            aria-label='Malla por ciclos. Desplazamiento horizontal contenido en este panel.'
          >
            <div className='malla-columns'>
              {roman.map((n, index) => {
                const cycleNumber = index + 1
                const items =
                  view === 'grid'
                    ? mandatoryCourses.filter(c => c.cycle === cycleNumber)
                    : courses.filter(c => c.cycle === cycleNumber)
                const isCurrent = cycleNumber === currentCycle

                return (
                  items.length > 0 && (
                    <section
                      className={`cycle-column ${isCurrent ? 'is-current-cycle' : ''}`}
                      key={n}
                    >
                      <div className='cycle-heading'>
                        <div>
                          <h2>Ciclo {n}</h2>
                          {isCurrent && (
                            <span className='current-cycle-pill'>
                              Tu ciclo actual
                            </span>
                          )}
                        </div>
                        <small>
                          {items.reduce((sum, c) => sum + c.credits, 0)} cr.{' '}
                          {index === 9 && view === 'list' ? 'en catálogo' : ''}
                        </small>
                      </div>
                      <div className='cycle-courses'>
                        {items.map(course => renderCourseButton(course))}
                      </div>
                    </section>
                  )
                )
              })}
              {view === 'grid' && electiveCourses.length > 0 && (
                <section className='cycle-column elective-column'>
                  <div className='cycle-heading'>
                    <div>
                      <h2>Electivos</h2>
                      <span className='elective-slot-pill'>
                        2 cupos · 8 cr.
                      </span>
                    </div>
                    <small>1 por grupo</small>
                  </div>
                  <div className='elective-stack'>
                    {elective1.length > 0 && (
                      <div className='elective-sub'>
                        <p className='elective-sub-title'>
                          Electivo I · elige 1 (4 cr.)
                        </p>
                        <div className='cycle-courses'>
                          {elective1.map(course =>
                            renderCourseButton(course, true)
                          )}
                        </div>
                      </div>
                    )}
                    {elective2.length > 0 && (
                      <div className='elective-sub'>
                        <p className='elective-sub-title'>
                          Electivo II · elige 1 (4 cr.)
                        </p>
                        <div className='cycle-courses'>
                          {elective2.map(course =>
                            renderCourseButton(course, true)
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
              {!courses.length && (
                <div className='empty-state'>
                  <h2>No encontramos cursos con ese filtro.</h2>
                  <button
                    className='secondary'
                    onClick={() => {
                      setSearch('')
                      setFilter('all')
                    }}
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className='caption malla-note'>
            ↔ Desplázate horizontalmente para recorrer los ciclos o cambia a
            Lista. Los electivos muestran todas las alternativas de Ciclo X; se
            contabiliza un curso de 4 cr. por cada grupo.{' '}
            <Link href='/fuentes#incidencias'>Revisar cobertura y reglas</Link>
          </p>
        </>
      )}
      {selectedCourse && (
        <CourseDetail
          course={selectedCourse}
          data={data}
          onClose={() => setSelected(null)}
          onSelect={setSelected}
          onEdit={code => {
            setSelected(null)
            onEdit(code)
          }}
        />
      )}
    </>
  )
}
