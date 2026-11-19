'use client'

import { useState } from 'react'

import Confirm from '@/components/ConfirmDialog'
import Select, { SelectOption } from '@/components/Select'
import { applyDocumentedRecognitions } from '@/helpers/academic.helpers'
import { catalog, courseName } from '@/helpers/curriculum.helpers'
import { resultLabels } from '@/helpers/transfer.helpers'
import type { Attempt, Workspace } from '@/helpers/validation.helpers'

export default function History({
  data,
  onChange,
  onAdd,
  onEdit
}: {
  data: Workspace
  onChange: (data: Workspace, message: string) => void
  onAdd: () => void
  onEdit: (attempt: Attempt) => void
}) {
  const [search, setSearch] = useState(''),
    [selected, setSelected] = useState<string[]>([]),
    [bulkResult, setBulkResult] = useState<Attempt['result']>('passed'),
    [confirm, setConfirm] = useState<'bulk' | 'delete' | null>(null)
  const rows = data.attempts
    .filter(a =>
      `${a.code} ${courseName(a.code)} ${a.period}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort(
      (a, b) => b.period.localeCompare(a.period) || a.code.localeCompare(b.code)
    )

  const pendingPassing = data.attempts.filter(
    a => a.result === 'pending' && (a.grade ?? 0) >= 11
  )

  return (
    <>
      <div className='page-title'>
        <div>
          <p className='eyebrow'>LO QUE YA RECORRISTE</p>
          <h1>
            Mi historial<span className='coral'>.</span>
          </h1>
          <p>Conserva cada intento, su resultado y los créditos de origen.</p>
        </div>
        <button onClick={onAdd}>+ Registrar intento</button>
      </div>
      {pendingPassing.length > 0 && (
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
              Tienes {pendingPassing.length} cursos pendientes con nota ≥ 11
            </strong>
            <p style={{ color: '#e6dce8', marginTop: 6, marginBottom: 0 }}>
              Confírmalos como «Aprobado» y convalida tus equivalencias ICSI →
              ISIA en un solo clic.
            </p>
          </div>
          <button
            type='button'
            onClick={() => {
              const updatedAttempts = data.attempts.map(a =>
                a.result === 'pending' && a.grade !== undefined
                  ? {
                      ...a,
                      result: (a.grade >= 11
                        ? 'passed'
                        : 'failed') as Attempt['result']
                    }
                  : a
              )
              const withPassed = { ...data, attempts: updatedAttempts }
              const mapped = applyDocumentedRecognitions(withPassed, catalog, {
                includePending: true
              })

              onChange(
                { ...withPassed, recognitions: mapped.recognitions },
                `${pendingPassing.length} cursos confirmados como aprobados${mapped.added ? ` y ${mapped.added} convalidados a ISIA 2025` : ''}.`
              )
            }}
          >
            Confirmar aprobados y convalidar
          </button>
        </div>
      )}
      <div className='toolbar'>
        <label className='search-label'>
          <span aria-hidden='true'>⌕</span>
          <input
            type='search'
            aria-label='Buscar en el historial'
            placeholder='Nombre, código o periodo'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <button
          className='secondary small'
          onClick={() =>
            setSelected(
              rows.every(r => selected.includes(r.id))
                ? []
                : rows.map(r => r.id)
            )
          }
        >
          {rows.every(r => selected.includes(r.id)) && rows.length
            ? 'Quitar selección'
            : 'Seleccionar resultados'}
        </button>
      </div>
      {selected.length > 0 && (
        <div className='bulk-bar'>
          <strong>{selected.length} intentos seleccionados</strong>
          <label>
            Nuevo resultado
            <Select
              value={bulkResult}
              onValueChange={value => setBulkResult(value as Attempt['result'])}
              aria-label={['Nuevo resultado'].join(' ')}
            >
              {Object.entries(resultLabels).map(([v, l]) => (
                <SelectOption value={v} key={v}>
                  {l}
                </SelectOption>
              ))}
            </Select>
          </label>
          <button onClick={() => setConfirm('bulk')}>
            Revisar edición por lote
          </button>
          <button className='secondary' onClick={() => setConfirm('delete')}>
            Eliminar seleccionados
          </button>
        </div>
      )}
      {rows.length ? (
        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>
                  <span className='sr-only'>Seleccionar</span>
                </th>
                <th>Asignatura</th>
                <th>Plan / periodo</th>
                <th>Resultado</th>
                <th>Créditos origen</th>
                <th>Nota</th>
                <th>Editar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => (
                <tr key={a.id}>
                  <td>
                    <input
                      type='checkbox'
                      checked={selected.includes(a.id)}
                      aria-label={`Seleccionar ${a.code} ${a.period}`}
                      onChange={e =>
                        setSelected(
                          e.target.checked
                            ? [...selected, a.id]
                            : selected.filter(id => id !== a.id)
                        )
                      }
                    />
                  </td>
                  <td>
                    <strong>{courseName(a.code)}</strong>
                    <small>{a.code}</small>
                  </td>
                  <td>
                    {a.planId === 'isia-2025' ? 'ISIA 2025' : 'ICSI 2022'}
                    <small>{a.period}</small>
                  </td>
                  <td>
                    <span className={`result result-${a.result}`}>
                      {resultLabels[a.result]}
                    </span>
                  </td>
                  <td>{a.originCredits ?? 'Por verificar'}</td>
                  <td>{a.grade ?? '—'}</td>
                  <td>
                    <button
                      className='secondary small'
                      onClick={() => onEdit(a)}
                      aria-label={`Editar ${a.code} ${a.period}`}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='empty-state'>
          <h2>
            {data.attempts.length
              ? 'Sin coincidencias'
              : 'Aquí empieza tu recorrido.'}
          </h2>
          <p>
            {data.attempts.length
              ? 'Prueba otro nombre o código.'
              : 'Registra un curso o importa tu historial desde Respaldos.'}
          </p>
          <button onClick={onAdd}>Registrar un intento</button>
        </div>
      )}
      <p className='caption'>
        Aprobado es un resultado que registras explícitamente. Repetir un curso
        en periodos distintos conserva los intentos sin duplicar sus créditos
        aprobados.
      </p>
      {confirm && (
        <Confirm
          title={
            confirm === 'bulk'
              ? 'Resumen de edición por lote'
              : 'Eliminar intentos seleccionados'
          }
          label={confirm === 'bulk' ? 'Aplicar cambios' : 'Eliminar intentos'}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            onChange(
              {
                ...data,
                attempts:
                  confirm === 'bulk'
                    ? data.attempts.map(a =>
                        selected.includes(a.id)
                          ? { ...a, result: bulkResult }
                          : a
                      )
                    : data.attempts.filter(a => !selected.includes(a.id))
              },
              confirm === 'bulk'
                ? 'Resultados actualizados. Escenarios recalculados.'
                : 'Intentos eliminados. Puedes deshacer el cambio.'
            )
            setSelected([])
          }}
        >
          {confirm === 'bulk'
            ? `${selected.length} intentos pasarán a «${resultLabels[bulkResult]}».`
            : `Se eliminarán ${selected.length} intentos.`}{' '}
          Se recalcularán los reconocimientos válidos, el avance y los
          escenarios.{' '}
          {selected
            .map(id => {
              const a = data.attempts.find(a => a.id === id)

              return a ? `${a.code} (${a.period})` : ''
            })
            .join(', ')}
        </Confirm>
      )}
    </>
  )
}
