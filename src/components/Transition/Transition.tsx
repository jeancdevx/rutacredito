'use client'

import { SparkleIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import Confirm from '@/components/ConfirmDialog'
import Dialog from '@/components/Dialog'
import Dovi from '@/components/Dovi'
import EvidenceList from '@/components/EvidenceList'
import Select, { SelectOption } from '@/components/Select'
import {
  account,
  applyDocumentedRecognitions
} from '@/helpers/academic.helpers'
import { catalog, courseName } from '@/helpers/curriculum.helpers'
import type { Workspace } from '@/helpers/validation.helpers'

export default function Transition({
  data,
  onChange
}: {
  data: Workspace
  onChange: (d: Workspace, m: string) => void
}) {
  const [filter, setFilter] = useState('all'),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState<string | null>(null),
    [note, setNote] = useState(''),
    [bulkConfirm, setBulkConfirm] = useState<'documented' | 'all' | null>(null)
  const progress = account(data, catalog)
  const eq = selected
    ? catalog.equivalences.find(e => e.id === selected)
    : undefined
  const sourcePassed = (planId: string, code: string) =>
    data.attempts.some(
      a => a.planId === planId && a.code === code && a.result === 'passed'
    )
  const documentedPending = progress.pendingRecognition.filter(
    e => e.verification === 'documented'
  )
  const alternativePending = progress.pendingRecognition.filter(
    e => e.verification === 'pending'
  )
  const rows = catalog.equivalences
    .filter(
      eq =>
        (filter === 'all' ||
          (filter === 'ready'
            ? eq.from.every(c => sourcePassed(eq.fromPlan, c))
            : filter === eq.verification)) &&
        `${eq.from.join(' ')} ${eq.from.map(courseName).join(' ')} ${eq.to.join(' ')} ${eq.to.map(courseName).join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aReady =
        a.from.every(c => sourcePassed(a.fromPlan, c)) &&
        !data.recognitions.some(r => r.equivalenceId === a.id)
      const bReady =
        b.from.every(c => sourcePassed(b.fromPlan, c)) &&
        !data.recognitions.some(r => r.equivalenceId === b.id)

      return Number(bReady) - Number(aReady)
    })
  const missing = catalog.courses.filter(
    c =>
      !catalog.equivalences.some(eq => eq.to.includes(c.code)) &&
      `${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className='page-title'>
        <div>
          <p className='eyebrow'>DEL ORIGEN A TU NUEVA RUTA</p>
          <h1>
            Transición ICSI → ISIA<span className='coral'>.</span>
          </h1>
          <p>
            Mapea tus cursos aprobados de ICSI hacia la nueva malla ISIA 2025
            para planificar automáticamente tus próximos ciclos.
          </p>
        </div>
        <Dovi state='atento' />
      </div>
      {progress.pendingRecognition.length > 0 && (
        <div
          className='notice'
          style={{
            background: '#38263d',
            borderColor: '#38263d',
            color: '#f6f0e6'
          }}
        >
          <strong style={{ color: '#f7d4c2' }}>
            <SparkleIcon
              size={15}
              style={{ display: 'inline', marginRight: 6 }}
            />
            Mapeo rápido disponible para tus cursos aprobados
          </strong>
          <p style={{ color: '#e6dce8', marginTop: 8 }}>
            Detectamos{' '}
            <strong>
              {documentedPending.length} correspondencias documentadas
            </strong>
            {alternativePending.length > 0
              ? ` y ${alternativePending.length} alternativas por confirmar`
              : ''}{' '}
            de cursos ICSI que ya aprobaste. Aplícalas en un clic para
            desbloquear tus cursos reales en Mi malla y el Planificador.
          </p>
          <div className='actions' style={{ marginTop: 12 }}>
            {documentedPending.length > 0 && (
              <button onClick={() => setBulkConfirm('documented')}>
                Aplicar {documentedPending.length} documentadas en 1 clic
              </button>
            )}
            {alternativePending.length > 0 && (
              <button
                className='secondary'
                style={{
                  color: '#f6f0e6',
                  borderColor: '#ffffff45'
                }}
                onClick={() => setBulkConfirm('all')}
              >
                Aplicar todas ({progress.pendingRecognition.length}) incluida
                revisión alternativa
              </button>
            )}
          </div>
        </div>
      )}
      <div className='notice'>
        <strong>Tu malla de ingreso también cuenta.</strong>
        <p>
          La presentación de implementación indica cumplir los créditos de la
          malla de ingreso. El avance de destino y los créditos originales se
          muestran por separado. Registrar declaraciones personales facilita tu
          planificación pero no sustituye una resolución oficial de UPAO.
        </p>
      </div>
      <div className='toolbar'>
        <label className='search-label'>
          <span aria-hidden='true'>⌕</span>
          <input
            type='search'
            aria-label='Buscar correspondencia'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Nombre o código de origen o destino'
          />
        </label>
        <label>
          Revisión
          <Select
            value={filter}
            onValueChange={value => setFilter(value)}
            aria-label={['Revisión'].join(' ')}
          >
            <SelectOption value='all'>Todas las correspondencias</SelectOption>
            <SelectOption value='ready'>
              Solo mis cursos ICSI aprobados
            </SelectOption>
            <SelectOption value='documented'>Documentadas</SelectOption>
            <SelectOption value='pending'>
              Pendientes de confirmación
            </SelectOption>
            <SelectOption value='none'>
              Sin correspondencia encontrada
            </SelectOption>
          </Select>
        </label>
      </div>
      {filter === 'none' ? (
        <div className='option-list'>
          {missing.map(c => (
            <div key={c.code}>
              <div>
                <small>
                  {c.code} · {c.credits} créditos destino
                </small>
                <strong>{c.name}</strong>
                <p>
                  No se encontró correspondencia ICSI en las fuentes procesadas.
                </p>
              </div>
            </div>
          ))}
          {!missing.length && <p>Sin coincidencias con esa búsqueda.</p>}
        </div>
      ) : (
        <div className='transition-list'>
          {rows.map(eq => {
            const recognition = data.recognitions.find(
              r => r.equivalenceId === eq.id
            )
            const fulfilled = eq.from.every(c => sourcePassed(eq.fromPlan, c))

            return (
              <article className='transition-row' key={eq.id}>
                <div className='transition-pair'>
                  <div>
                    <p className='eyebrow'>ORIGEN · ICSI 2022</p>
                    {eq.from.map(code => (
                      <div key={code}>
                        <strong>{courseName(code)}</strong>
                        <small>
                          {code} ·{' '}
                          {catalog.origins.find(c => c.code === code)
                            ?.credits ?? 'Créditos por verificar'}
                          {catalog.origins.find(c => c.code === code)?.credits
                            ? ' cr.'
                            : ''}
                        </small>
                        <span
                          className={
                            sourcePassed(eq.fromPlan, code)
                              ? 'positive'
                              : 'muted'
                          }
                        >
                          {sourcePassed(eq.fromPlan, code)
                            ? '✓ Aprobación registrada'
                            : 'Sin aprobación de origen registrada'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className='transition-arrow' aria-hidden='true'>
                    →
                  </span>
                  <div>
                    <p className='eyebrow'>DESTINO · ISIA 2025</p>
                    {eq.to.map(code => (
                      <div key={code}>
                        <strong>{courseName(code)}</strong>
                        <small>
                          {code} ·{' '}
                          {catalog.courses.find(c => c.code === code)?.credits}{' '}
                          cr. de destino
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
                <div className='transition-evidence'>
                  <span
                    className={`review-badge ${eq.verification === 'pending' ? 'pending' : ''}`}
                  >
                    {eq.verification === 'documented'
                      ? '✓ Correspondencia documentada'
                      : '? Pendiente de confirmación'}
                  </span>
                  <EvidenceList items={eq.evidence} />
                  {recognition ? (
                    <>
                      <p className={fulfilled ? 'positive' : 'error'}>
                        {fulfilled
                          ? 'Reconocimiento declarado por ti'
                          : 'Declaración conservada; falta aprobación de origen, no cuenta en avance'}
                      </p>
                      <p className='caption'>{recognition.note}</p>
                      <button
                        className='text-button danger'
                        onClick={() =>
                          onChange(
                            {
                              ...data,
                              recognitions: data.recognitions.filter(
                                r => r.id !== recognition.id
                              )
                            },
                            'Declaración retirada. Avance y escenarios recalculados.'
                          )
                        }
                      >
                        Retirar declaración
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className='secondary small'
                        disabled={!fulfilled}
                        onClick={() => {
                          setSelected(eq.id)
                          setNote('')
                        }}
                      >
                        Registrar reconocimiento individual
                      </button>
                      {!fulfilled && (
                        <small>
                          Primero registra aprobado el curso de origen en tu
                          historial.
                        </small>
                      )}
                    </>
                  )}
                </div>
              </article>
            )
          })}
          {!rows.length && (
            <p className='empty-state'>
              No hay correspondencias con estos filtros.
            </p>
          )}
        </div>
      )}
      {bulkConfirm && (
        <Confirm
          title='Aplicar correspondencias ICSI → ISIA'
          label='Aplicar correspondencias'
          onClose={() => setBulkConfirm(null)}
          onConfirm={() => {
            const { recognitions, added } = applyDocumentedRecognitions(
              data,
              catalog,
              { includePending: bulkConfirm === 'all' }
            )

            onChange(
              { ...data, recognitions },
              `${added} correspondencias aplicadas. Tu malla y planificador se actualizaron.`
            )
          }}
        >
          Se registrarán como declaración personal de planificación{' '}
          {bulkConfirm === 'all'
            ? progress.pendingRecognition.length
            : documentedPending.length}{' '}
          correspondencias de tus cursos ICSI aprobados hacia ISIA 2025. Esto no
          sustituye una convalidación oficial de UPAO y puedes retirar cualquier
          curso de forma individual o deshacer el cambio.
        </Confirm>
      )}
      {eq && (
        <Dialog
          title='Declarar reconocimiento individual'
          onClose={() => setSelected(null)}
        >
          <p>
            <strong>
              {eq.from.join(' + ')} → {eq.to.join(' + ')}
            </strong>
          </p>
          <p>{eq.conditions}</p>
          {eq.verification === 'pending' && (
            <p className='notice'>
              Esta correspondencia tiene diferencias entre fuentes. Solo
              registra el reconocimiento si cuentas con información individual
              que lo respalde.
            </p>
          )}
          <form
            onSubmit={e => {
              e.preventDefault()
              onChange(
                {
                  ...data,
                  recognitions: [
                    ...data.recognitions,
                    {
                      id: crypto.randomUUID(),
                      equivalenceId: eq.id,
                      note: note.trim()
                    }
                  ]
                },
                'Declaración personal guardada. No es una validación de UPAO.'
              )
              setSelected(null)
            }}
          >
            <label>
              Procedencia del reconocimiento
              <textarea
                required
                minLength={3}
                maxLength={1000}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder='Describe qué documento o revisión individual respalda lo que registras. No incluyas tu ID ni datos personales.'
              />
            </label>
            <label className='checkbox-row'>
              <input type='checkbox' required />
              Confirmo que es una declaración personal y no una convalidación
              emitida por RutaCréditos.
            </label>
            <div className='actions end'>
              <button
                type='button'
                className='secondary'
                onClick={() => setSelected(null)}
              >
                Cancelar
              </button>
              <button type='submit'>Guardar declaración</button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  )
}
