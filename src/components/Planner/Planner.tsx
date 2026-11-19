'use client'

import { SparkleIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import Confirm from '@/components/ConfirmDialog'
import { roman } from '@/components/CurriculumMap/CurriculumMap.constants'
import Dovi from '@/components/Dovi'
import Select, { SelectOption } from '@/components/Select'
import {
  account,
  applyDocumentedRecognitions,
  buildAutoScenario,
  evaluate,
  formatPeriod,
  inferNextPlanningPeriod,
  isProvisionallyEligible,
  normalizePeriod,
  references,
  simulate,
  suggest,
  suggestAllPeriods
} from '@/helpers/academic.helpers'
import { catalog, courseName } from '@/helpers/curriculum.helpers'
import { newScenario } from '@/helpers/storage.helpers'
import { csv, download } from '@/helpers/transfer.helpers'
import type { Scenario, Workspace } from '@/helpers/validation.helpers'

import { nextPeriod } from './Planner.helpers'

export default function Planner({
  data,
  onChange,
  notify,
  onCompare
}: {
  data: Workspace
  onChange: (d: Workspace, m: string) => void
  notify: (s: string) => void
  onCompare: () => void
}) {
  const [selected, setSelected] = useState(data.scenarios[0]?.id ?? '')
  const [periodIndex, setPeriodIndex] = useState(0),
    [search, setSearch] = useState(''),
    [confirm, setConfirm] = useState<'delete' | null>(null)
  const progress = account(data, catalog)
  const scenario =
    data.scenarios.find(s => s.id === selected) ?? data.scenarios[0]
  const evaluation = scenario ? simulate(scenario, data, catalog) : null
  const safeIndex = scenario
    ? Math.min(periodIndex, scenario.periods.length - 1)
    : 0
  const active = scenario?.periods[safeIndex]
  const activeResult = evaluation?.periods.find(
    p => p.period === active?.period
  )

  function update(
    s: Scenario,
    message = 'Escenario guardado. Todas las dependencias se recalcularon.'
  ) {
    onChange(
      {
        ...data,
        scenarios: data.scenarios.map(old =>
          old.id === s.id ? { ...s, catalogVersion: catalog.version } : old
        )
      },
      message
    )
  }

  function create() {
    const startPeriod = inferNextPlanningPeriod(data.attempts)
    const s = newScenario(`Escenario ${data.scenarios.length + 1}`)

    s.creditLimit = data.profile.preferredCredits ?? 20
    s.assumeInProgress = data.attempts.some(a => a.result === 'in-progress')
    s.includeUnverified = true
    s.periods = [{ period: startPeriod, courses: [] }]
    onChange(
      { ...data, scenarios: [...data.scenarios, s] },
      'Escenario creado.'
    )
    setSelected(s.id)
    setPeriodIndex(0)
  }

  function createAutoPlan(periodCount = 2) {
    let baseData = data
    let convalidatedNote = ''

    if (progress.pendingRecognition.length > 0) {
      const mapped = applyDocumentedRecognitions(data, catalog, {
        includePending: true
      })

      if (mapped.added > 0) {
        baseData = { ...data, recognitions: mapped.recognitions }
        convalidatedNote = ` Se convalidaron ${mapped.added} cursos ICSI → ISIA antes de planificar.`
      }
    }

    const s = buildAutoScenario(baseData, catalog, {
      name: `Plan automático ${baseData.scenarios.length + 1}`,
      periodCount
    })

    onChange(
      { ...baseData, scenarios: [...baseData.scenarios, s] },
      `Plan automático generado desde ${formatPeriod(s.periods[0].period)} según tu límite de ${s.creditLimit} créditos.${convalidatedNote}`
    )
    setSelected(s.id)
    setPeriodIndex(0)
  }

  function setCourses(courses: string[]) {
    if (!scenario || !active) return
    update({
      ...scenario,
      periods: scenario.periods.map((p, i) =>
        i === safeIndex ? { ...p, courses } : p
      )
    })
  }

  return (
    <>
      <div className='page-title'>
        <div>
          <p className='eyebrow'>PLANIFICACIÓN AUTOMÁTICA POR CRÉDITOS</p>
          <h1>
            Mis próximos ciclos<span className='coral'>.</span>
          </h1>
          <p>
            Calcula automáticamente qué cursos llevar en tu próximo periodo
            electivo según tus aprobados, equivalencias y límite de créditos.
          </p>
        </div>
        <div className='actions'>
          <button className='secondary' onClick={onCompare}>
            Comparar
          </button>
          <button
            className='secondary'
            onClick={() => createAutoPlan(2)}
            disabled={data.scenarios.length >= 30}
          >
            <SparkleIcon size={16} />
            Plan automático
          </button>
          <button onClick={create} disabled={data.scenarios.length >= 30}>
            + Nuevo escenario
          </button>
        </div>
      </div>
      {progress.pendingRecognition.length > 0 && (
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
              ICSI sin convalidar todavía en ISIA 2025
            </strong>
            <p style={{ color: '#e6dce8', marginTop: 6, marginBottom: 0 }}>
              Ej.:{' '}
              {progress.pendingRecognition
                .slice(0, 3)
                .map(eq => courseName(eq.to[0]))
                .join(', ')}
              . Convalídalos para que el planificador no te sugiera cursos de
              ciclos anteriores que ya llevaste.
            </p>
          </div>
          <button
            type='button'
            onClick={() => {
              const mapped = applyDocumentedRecognitions(data, catalog, {
                includePending: true
              })
              const nextData = { ...data, recognitions: mapped.recognitions }
              const nextScenarios = scenario
                ? nextData.scenarios.map(s =>
                    s.id === scenario.id
                      ? suggestAllPeriods(s, nextData, catalog)
                      : s
                  )
                : nextData.scenarios

              onChange(
                { ...nextData, scenarios: nextScenarios },
                `${mapped.added} cursos convalidados de ICSI → ISIA y escenario recalculado.`
              )
            }}
          >
            Convalidar y actualizar plan
          </button>
        </div>
      )}
      {!scenario ? (
        <div className='empty-state'>
          <Dovi state='pensando' />
          <h2>Un próximo ciclo empieza con una posibilidad.</h2>
          <p>
            Genera automáticamente tu próximo ciclo desde{' '}
            <strong>
              {formatPeriod(inferNextPlanningPeriod(data.attempts))}
            </strong>{' '}
            o crea un escenario manual desde cero.
          </p>
          <div className='actions' style={{ justifyContent: 'center' }}>
            <button onClick={() => createAutoPlan(2)}>
              <SparkleIcon size={16} />
              Planificar automáticamente mis próximos ciclos
            </button>
            <button className='secondary' onClick={create}>
              Crear mi primer escenario
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className='scenario-toolbar'>
            <label>
              Escenario guardado
              <Select
                value={scenario.id}
                onValueChange={value => {
                  setSelected(value)
                  setPeriodIndex(0)
                }}
                aria-label={['Escenario guardado'].join(' ')}
              >
                {data.scenarios.map(s => (
                  <SelectOption key={s.id} value={s.id}>
                    {s.name}
                  </SelectOption>
                ))}
              </Select>
            </label>
            <label>
              Nombre
              <input
                key={scenario.id + scenario.name}
                aria-label='Nombre del escenario'
                defaultValue={scenario.name}
                maxLength={80}
                onBlur={e => {
                  const name = e.target.value.trim()

                  if (name && name !== scenario.name)
                    update({ ...scenario, name }, 'Escenario renombrado.')
                  else e.target.value = scenario.name
                }}
              />
            </label>
            <button
              className='secondary small'
              disabled={data.scenarios.length >= 30}
              onClick={() => {
                const s = {
                  ...structuredClone(scenario),
                  id: crypto.randomUUID(),
                  name: `${scenario.name.slice(0, 65)} · copia`
                }

                onChange(
                  { ...data, scenarios: [...data.scenarios, s] },
                  'Escenario duplicado.'
                )
                setSelected(s.id)
              }}
            >
              Duplicar
            </button>
            <button
              className='text-button danger'
              onClick={() => setConfirm('delete')}
            >
              Eliminar
            </button>
          </div>
          <div className='planner-layout'>
            <div className='planner-main'>
              <div className='period-strip' aria-label='Periodos del escenario'>
                {scenario.periods.map((p, i) => (
                  <button
                    className={safeIndex === i ? 'active' : ''}
                    key={p.period}
                    aria-pressed={safeIndex === i}
                    onClick={() => setPeriodIndex(i)}
                  >
                    <small>PERIODO {i + 1}</small>
                    <strong>{formatPeriod(p.period)}</strong>
                    <span>{p.courses.length} cursos</span>
                  </button>
                ))}
                <button
                  className='add-period'
                  disabled={scenario.periods.length >= 12}
                  onClick={() => {
                    const last = scenario.periods.at(-1)!

                    update(
                      {
                        ...scenario,
                        periods: [
                          ...scenario.periods,
                          { period: nextPeriod(last.period), courses: [] }
                        ]
                      },
                      'Periodo añadido. Máximo 12 por escenario.'
                    )
                    setPeriodIndex(scenario.periods.length)
                  }}
                >
                  + Añadir periodo
                </button>
              </div>
              {active && activeResult && (
                <>
                  <div className='period-heading'>
                    <label>
                      Periodo que estás explorando
                      <input
                        aria-label='Periodo del escenario'
                        key={active.period}
                        defaultValue={formatPeriod(active.period)}
                        maxLength={7}
                        onBlur={e => {
                          const period = normalizePeriod(e.target.value)

                          if (
                            !/^20\d{2}(10|20|30)$/.test(period) ||
                            scenario.periods.some(
                              (p, i) => i !== safeIndex && p.period === period
                            )
                          ) {
                            e.target.value = formatPeriod(active.period)
                            notify(
                              'Periodo inválido o duplicado. Usa, por ejemplo, 2027-10.'
                            )

                            return
                          }

                          e.target.value = formatPeriod(period)

                          if (period !== active.period) {
                            const periods = scenario.periods
                              .map((p, i) =>
                                i === safeIndex ? { ...p, period } : p
                              )
                              .sort((a, b) => a.period.localeCompare(b.period))

                            update(
                              { ...scenario, periods },
                              'Periodo actualizado y escenario recalculado.'
                            )
                            setPeriodIndex(
                              periods.findIndex(p => p.period === period)
                            )
                          }
                        }}
                      />
                    </label>
                    <strong className='load-number'>
                      {activeResult.credits}
                      <small> / {scenario.creditLimit} cr.</small>
                    </strong>
                    {scenario.periods.length > 1 && (
                      <button
                        className='text-button danger'
                        onClick={() => {
                          update(
                            {
                              ...scenario,
                              periods: scenario.periods.filter(
                                (_, i) => i !== safeIndex
                              )
                            },
                            'Periodo eliminado.'
                          )
                          setPeriodIndex(Math.max(0, safeIndex - 1))
                        }}
                      >
                        Quitar periodo
                      </button>
                    )}
                  </div>
                  <div className='selected-courses'>
                    {activeResult.items.length ? (
                      activeResult.items.map((item, i) => (
                        <article
                          className={`planned-course ${item.conflicts.length ? 'has-conflict' : ''}`}
                          key={`${item.code}:${i}`}
                        >
                          <div>
                            <small>
                              {item.code} · {item.course?.credits ?? '?'} cr.
                              {item.course
                                ? ` · Ciclo ${roman[item.course.cycle - 1]}`
                                : ''}
                            </small>
                            <h3>{courseName(item.code)}</h3>
                            {item.conflicts.length ? (
                              <ul className='error'>
                                {item.conflicts.map((c, idx) => (
                                  <li key={idx}>{c}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className='caption'>
                                {item.provisional
                                  ? '✓ Proyectado al inicio del periodo · confirma requisito con UPAO · aprobación futura supuesta'
                                  : '✓ Cumple al inicio del periodo · aprobación futura supuesta'}
                              </p>
                            )}
                          </div>
                          <button
                            className='icon-button'
                            aria-label={`Quitar ${item.code}`}
                            onClick={() =>
                              setCourses(
                                active.courses.filter((_, j) => i !== j)
                              )
                            }
                          >
                            ×
                          </button>
                        </article>
                      ))
                    ) : (
                      <div className='empty-state compact'>
                        <p>Este periodo está abierto.</p>
                        <p className='muted'>
                          Añade un curso elegible o usa la sugerencia automática
                          según tus créditos.
                        </p>
                      </div>
                    )}
                  </div>
                  {activeResult.warnings.map((w, i) => (
                    <p className='notice' key={i}>
                      {w}
                    </p>
                  ))}
                  <div className='section-heading'>
                    <div>
                      <p className='eyebrow'>
                        DISPONIBLES AL INICIO DE {formatPeriod(active.period)}
                      </p>
                      <h2>Opciones para este periodo</h2>
                    </div>
                    <div className='actions'>
                      {scenario.periods.length > 1 && (
                        <button
                          className='secondary small'
                          onClick={() => {
                            const filled = suggestAllPeriods(
                              scenario,
                              data,
                              catalog
                            )

                            update(
                              filled,
                              'Todos los periodos del escenario se completaron automáticamente según tu límite de créditos.'
                            )
                          }}
                        >
                          <SparkleIcon size={14} />
                          Autocompletar todos
                        </button>
                      )}
                      <button
                        className='secondary small'
                        onClick={() => {
                          const codes = suggest(
                            scenario,
                            data,
                            catalog,
                            safeIndex
                          )

                          if (!codes.length) {
                            notify(
                              'No hay una sugerencia verificable con estas preferencias. Revisa las reglas pendientes o los periodos anteriores.'
                            )

                            return
                          }

                          setCourses(codes)
                        }}
                      >
                        ↗ Usar sugerencia
                      </button>
                    </div>
                  </div>
                  <p className='caption'>
                    La sugerencia prioriza obligatorios pendientes, conexiones
                    que desbloquean otros cursos, ciclo y código respetando tu
                    límite de créditos.
                  </p>
                  <label className='search-label'>
                    <span aria-hidden='true'>⌕</span>
                    <input
                      type='search'
                      aria-label='Buscar opciones del periodo'
                      placeholder='Buscar curso disponible'
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </label>
                  <div className='option-list'>
                    {catalog.courses
                      .filter(
                        c =>
                          !activeResult.context.passed.has(c.code) &&
                          !active.courses.includes(c.code) &&
                          (scenario.includeUnverified
                            ? isProvisionallyEligible(c, activeResult.context)
                            : evaluate(c.prerequisite, activeResult.context)
                                .verdict === 'cumple') &&
                          `${c.name} ${c.code}`
                            .toLowerCase()
                            .includes(search.toLowerCase())
                      )
                      .map(c => {
                        const isProvisional =
                          evaluate(c.prerequisite, activeResult.context)
                            .verdict !== 'cumple'

                        return (
                          <div key={c.code}>
                            <div>
                              <small>
                                {c.code} · Ciclo {roman[c.cycle - 1]} ·{' '}
                                {c.credits} cr.{' '}
                                {!c.required ? '· Electivo' : ''}{' '}
                                {isProvisional ? '· Por confirmar' : ''}
                              </small>
                              <strong>{c.name}</strong>
                              <small>
                                {
                                  catalog.courses.filter(d =>
                                    references(d.prerequisite).includes(c.code)
                                  ).length
                                }{' '}
                                conexiones posteriores
                              </small>
                            </div>
                            <button
                              className='secondary small'
                              aria-label={`Añadir ${c.code}`}
                              onClick={() =>
                                setCourses([...active.courses, c.code])
                              }
                            >
                              + Añadir
                            </button>
                          </div>
                        )
                      })}
                  </div>
                  {!catalog.courses.some(
                    c =>
                      !activeResult.context.passed.has(c.code) &&
                      !active.courses.includes(c.code) &&
                      (scenario.includeUnverified
                        ? isProvisionallyEligible(c, activeResult.context)
                        : evaluate(c.prerequisite, activeResult.context)
                            .verdict === 'cumple')
                  ) && (
                    <p className='notice'>
                      No hay más cursos elegibles al inicio de este periodo. Los
                      cursos del mismo periodo no satisfacen prerrequisitos
                      entre sí. Revisa los electivos o cursos por confirmar
                      abajo, o continúa en un periodo posterior.
                    </p>
                  )}
                  {(() => {
                    const pendingRuleCourses = catalog.courses
                      .filter(
                        c =>
                          !activeResult.context.passed.has(c.code) &&
                          !active.courses.includes(c.code) &&
                          evaluate(c.prerequisite, activeResult.context)
                            .verdict === 'no verificable' &&
                          !(
                            scenario.includeUnverified &&
                            isProvisionallyEligible(c, activeResult.context)
                          ) &&
                          `${c.name} ${c.code}`
                            .toLowerCase()
                            .includes(search.toLowerCase())
                      )
                      .sort(
                        (a, b) =>
                          Number(Boolean(b.electiveGroup)) -
                            Number(Boolean(a.electiveGroup)) ||
                          b.cycle - a.cycle
                      )

                    if (!pendingRuleCourses.length) return null

                    return (
                      <details style={{ marginTop: 20 }}>
                        <summary>
                          Electivos y cursos con regla por confirmar con UPAO (
                          {pendingRuleCourses.length})
                        </summary>
                        <p className='caption' style={{ marginTop: 8 }}>
                          Estos cursos (incluidos los electivos de Ciclo X,
                          Taller integrador I y Prácticas preprofesionales)
                          tienen requisitos sin confirmar en el PDF oficial.
                          Puedes consultarlos o añadirlos bajo tu revisión.
                        </p>
                        <div className='option-list'>
                          {pendingRuleCourses.map(c => (
                            <div key={c.code}>
                              <div>
                                <small>
                                  {c.code} · Ciclo {roman[c.cycle - 1]} ·{' '}
                                  {c.credits} cr.{' '}
                                  {c.electiveGroup === 'electivo-1'
                                    ? '· Electivo I (1 cupo)'
                                    : c.electiveGroup === 'electivo-2'
                                      ? '· Electivo II (1 cupo)'
                                      : '· Por confirmar'}
                                </small>
                                <strong>{c.name}</strong>
                              </div>
                              <button
                                className='secondary small'
                                aria-label={`Añadir ${c.code}`}
                                onClick={() =>
                                  setCourses([...active.courses, c.code])
                                }
                              >
                                + Añadir
                              </button>
                            </div>
                          ))}
                        </div>
                      </details>
                    )
                  })()}
                </>
              )}
            </div>
            <aside className='planner-aside' data-tour='planner-aside'>
              <p className='eyebrow'>TU PREFERENCIA DE CARGA</p>
              <h2>A tu ritmo.</h2>
              <div className='form-grid'>
                <label>
                  Máximo de créditos
                  <input
                    type='number'
                    min='1'
                    max='40'
                    value={scenario.creditLimit}
                    onChange={e => {
                      const n = Number(e.target.value)

                      if (n >= 1 && n <= 40)
                        update({ ...scenario, creditLimit: n })
                    }}
                  />
                </label>
                <label>
                  Máximo de cursos
                  <input
                    type='number'
                    min='1'
                    max='12'
                    value={scenario.courseLimit}
                    onChange={e => {
                      const n = Number(e.target.value)

                      if (n >= 1 && n <= 12)
                        update({ ...scenario, courseLimit: n })
                    }}
                  />
                </label>
              </div>
              <div
                className='actions'
                style={{ gap: 6, marginBottom: 12 }}
                aria-label='Atajos de créditos'
              >
                {[16, 18, 20, 22].map(cr => (
                  <button
                    type='button'
                    key={cr}
                    className={
                      scenario.creditLimit === cr ? 'small' : 'secondary small'
                    }
                    style={{
                      minHeight: 28,
                      padding: '4px 10px',
                      fontSize: 11
                    }}
                    onClick={() => update({ ...scenario, creditLimit: cr })}
                  >
                    {cr} cr.
                  </button>
                ))}
              </div>
              <p className='caption'>
                Preferencias para organizarte. No son límites oficiales de UPAO.
              </p>
              <label className='checkbox-row'>
                <input
                  type='checkbox'
                  checked={scenario.assumeInProgress}
                  onChange={e =>
                    update({ ...scenario, assumeInProgress: e.target.checked })
                  }
                />
                Suponer aprobados los cursos en progreso de periodos anteriores
              </label>
              <p className='caption'>
                Supuesto exclusivo de este escenario. No cambia el historial ni
                habilita cursos dentro del mismo periodo.
              </p>
              <label className='checkbox-row'>
                <input
                  type='checkbox'
                  checked={Boolean(scenario.includeUnverified)}
                  onChange={e =>
                    update({
                      ...scenario,
                      includeUnverified: e.target.checked
                    })
                  }
                />
                Incluir cursos sin prerrequisito explícito en el PDF (por
                confirmar con UPAO)
              </label>
              <p className='caption'>
                Permite proyectar ciclos completos (ej. Redes y SO, Aprendizaje
                estadístico) asumiendo aprobación entre periodos consecutivos.
              </p>
              <hr />
              <div className='summary-stat'>
                <span>Créditos de requisitos cubiertos</span>
                <strong>+{evaluation?.coveredCredits ?? 0}</strong>
              </div>
              <div className='summary-stat'>
                <span>Cursos que se habilitan al final</span>
                <strong>{evaluation?.unlocked.length ?? 0}</strong>
              </div>
              <details>
                <summary>Ver cursos habilitados</summary>
                <ul>
                  {evaluation?.unlocked.map(c => (
                    <li key={c.code}>{c.name}</li>
                  ))}
                </ul>
                {!evaluation?.unlocked.length && (
                  <p>No se habilitan cursos adicionales con esta selección.</p>
                )}
              </details>
              <div className='planner-warning'>
                <strong>Una posibilidad, con condiciones.</strong>
                <p>
                  Todos los periodos suponen disponibilidad de cursos y
                  aprobación. No contamos con horarios, vacantes ni oferta real.
                </p>
                {evaluation?.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
              <button
                className='full'
                onClick={() =>
                  update(
                    scenario,
                    'Escenario guardado en este navegador y revalidado.'
                  )
                }
              >
                Guardar escenario
              </button>
              <button
                className='secondary full'
                onClick={() => {
                  if (!evaluation) return
                  download(
                    'rutacreditos-escenario.csv',
                    csv([
                      [
                        'escenario',
                        'periodo',
                        'codigo',
                        'curso',
                        'creditos',
                        'validacion'
                      ],
                      ...evaluation.periods.flatMap(p =>
                        p.items.map(i => [
                          scenario.name,
                          formatPeriod(p.period),
                          i.code,
                          i.course?.name,
                          i.course?.credits,
                          i.conflicts.length
                            ? i.conflicts.join(' ')
                            : 'Condicional: requiere oferta y aprobación'
                        ])
                      )
                    ]),
                    'text/csv;charset=utf-8'
                  )
                }}
              >
                Exportar escenario CSV
              </button>
            </aside>
          </div>
        </>
      )}
      {confirm && scenario && (
        <Confirm
          title='Eliminar este escenario'
          label='Eliminar escenario'
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            onChange(
              {
                ...data,
                scenarios: data.scenarios.filter(s => s.id !== scenario.id)
              },
              'Escenario eliminado. Puedes deshacer el cambio.'
            )
            setSelected('')
            setPeriodIndex(0)
          }}
        >
          Se eliminará «{scenario.name}» y sus {scenario.periods.length}{' '}
          periodos. Tu historial permanece guardado.
        </Confirm>
      )}
    </>
  )
}
