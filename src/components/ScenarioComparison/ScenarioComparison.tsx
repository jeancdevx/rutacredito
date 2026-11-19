'use client'

import { useState } from 'react'

import Dovi from '@/components/Dovi'
import Select, { SelectOption } from '@/components/Select'
import { formatPeriod, simulate } from '@/helpers/academic.helpers'
import { catalog, courseName } from '@/helpers/curriculum.helpers'
import type { Workspace } from '@/helpers/validation.helpers'

export default function ScenarioComparison({
  data,
  onPlanner
}: {
  data: Workspace
  onPlanner: () => void
}) {
  const [left, setLeft] = useState(data.scenarios[0]?.id ?? ''),
    [right, setRight] = useState(data.scenarios[1]?.id ?? '')
  const a = data.scenarios.find(s => s.id === left) ?? data.scenarios[0],
    b = data.scenarios.find(s => s.id === right) ?? data.scenarios[1]
  const sa = a ? simulate(a, data, catalog) : null,
    sb = b ? simulate(b, data, catalog) : null
  const union = new Set([
    ...(a?.periods.flatMap(p => p.courses) ?? []),
    ...(b?.periods.flatMap(p => p.courses) ?? [])
  ])
  const difference = [...union].filter(
    code =>
      JSON.stringify(
        a?.periods.filter(p => p.courses.includes(code)).map(p => p.period)
      ) !==
      JSON.stringify(
        b?.periods.filter(p => p.courses.includes(code)).map(p => p.period)
      )
  )

  return (
    <>
      <div className='page-title'>
        <div>
          <p className='eyebrow'>DOS CAMINOS, MÁS PERSPECTIVA</p>
          <h1>
            Comparar escenarios<span className='coral'>.</span>
          </h1>
          <p>Cambia la carga. Mira qué se cubre y qué se habilita.</p>
        </div>
        <button className='secondary' onClick={onPlanner}>
          Ir al planificador
        </button>
      </div>
      {!a || !b ? (
        <div className='empty-state'>
          <Dovi state='pensando' />
          <h2>Necesitas dos posibilidades para comparar.</h2>
          <p>Crea dos escenarios o duplica el primero y cambia su selección.</p>
          <button onClick={onPlanner}>Crear escenarios</button>
        </div>
      ) : (
        <>
          <div className='compare-intro'>
            <Dovi state='pensando' />
            <div>
              <strong>
                {difference.length} cursos con ubicación diferente
              </strong>
              <p>
                La diferencia mide selección y periodo. Todos los resultados se
                recalculan con tu historial y el catálogo actual.
              </p>
            </div>
          </div>
          <div className='comparison-grid'>
            {[
              {
                scenario: a,
                result: sa!,
                value: left,
                set: setLeft,
                label: 'Escenario A'
              },
              {
                scenario: b,
                result: sb!,
                value: right,
                set: setRight,
                label: 'Escenario B'
              }
            ].map(({ scenario, result, value, set, label }) => (
              <section className='comparison-column' key={label}>
                <label>
                  {label}
                  <Select
                    value={value || scenario.id}
                    onValueChange={value => set(value)}
                    aria-label={[label].join(' ')}
                  >
                    {data.scenarios.map(s => (
                      <SelectOption key={s.id} value={s.id}>
                        {s.name}
                      </SelectOption>
                    ))}
                  </Select>
                </label>
                <h2>{scenario.name}</h2>
                <div className='comparison-numbers'>
                  <div>
                    <strong>+{result.coveredCredits}</strong>
                    <small>créditos de requisitos cubiertos</small>
                  </div>
                  <div>
                    <strong>{result.unlocked.length}</strong>
                    <small>cursos habilitados al final</small>
                  </div>
                </div>
                {result.periods.map(p => (
                  <div className='comparison-period' key={p.period}>
                    <h3>
                      {formatPeriod(p.period)} <span>{p.credits} cr.</span>
                    </h3>
                    <ul>
                      {p.items.map((i, index) => (
                        <li
                          key={i.code + index}
                          className={
                            difference.includes(i.code) ? 'different' : ''
                          }
                        >
                          <span>
                            {i.conflicts.length ? '!' : '✓'}{' '}
                            {courseName(i.code)}
                          </span>
                          <small>{i.course?.credits ?? '?'} cr.</small>
                        </li>
                      ))}
                    </ul>
                    {!p.items.length && (
                      <p className='caption'>Sin cursos seleccionados.</p>
                    )}
                    {p.warnings.map((w, i) => (
                      <p className='error' key={i}>
                        {w}
                      </p>
                    ))}
                  </div>
                ))}
                <details>
                  <summary>
                    Cursos que se habilitan ({result.unlocked.length})
                  </summary>
                  <ul>
                    {result.unlocked.map(c => (
                      <li key={c.code}>{c.name}</li>
                    ))}
                  </ul>
                </details>
                <div className='notice'>
                  <strong>
                    {result.conflicts.length
                      ? `${result.conflicts.length} conflictos por revisar`
                      : 'Sin conflictos conocidos en la selección'}
                  </strong>
                  {result.conflicts.map((w, i) => (
                    <p className='error' key={i}>
                      {w}
                    </p>
                  ))}
                  {result.warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                  <p>Condicional a disponibilidad y aprobación.</p>
                </div>
              </section>
            ))}
          </div>
          {a.id === b.id && (
            <p className='notice'>
              Estás comparando el mismo escenario. Selecciona otro para ver
              diferencias.
            </p>
          )}
          <p className='comparison-delta'>
            Diferencia B − A:{' '}
            <strong>
              {sb!.coveredCredits - sa!.coveredCredits >= 0 ? '+' : ''}
              {sb!.coveredCredits - sa!.coveredCredits} créditos de requisitos
            </strong>{' '}
            ·{' '}
            <strong>
              {sb!.unlocked.length - sa!.unlocked.length >= 0 ? '+' : ''}
              {sb!.unlocked.length - sa!.unlocked.length} cursos habilitados
            </strong>
            . Las opciones con cambios están marcadas.
          </p>
        </>
      )}
    </>
  )
}
