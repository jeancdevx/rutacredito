'use client'

import { useState } from 'react'

import Confirm from '@/components/ConfirmDialog'
import Dialog from '@/components/Dialog'
import Select, { SelectOption } from '@/components/Select'
import { formatPeriod, normalizePeriod } from '@/helpers/academic.helpers'
import {
  catalog,
  courseName,
  normalizeCode
} from '@/helpers/curriculum.helpers'
import { resultLabels } from '@/helpers/transfer.helpers'
import type { Attempt, Workspace } from '@/helpers/validation.helpers'
import { attemptSchema } from '@/helpers/validation.helpers'

export default function AttemptEditor({
  data,
  initialCode,
  existing,
  onSave,
  onClose
}: {
  data: Workspace
  initialCode?: string
  existing?: Attempt
  onSave: (attempt: Attempt) => void
  onClose: () => void
}) {
  const [planId, setPlanId] = useState<Attempt['planId']>(
    existing?.planId ??
      (initialCode
        ? 'isia-2025'
        : data.profile.entryPlan === 'icsi-2022'
          ? 'icsi-2022'
          : 'isia-2025')
  )
  const [search, setSearch] = useState('')
  const [code, setCode] = useState(existing?.code ?? initialCode ?? '')
  const options = planId === 'isia-2025' ? catalog.courses : catalog.origins
  const [period, setPeriod] = useState(existing?.period ?? '202620'),
    [result, setResult] = useState<Attempt['result']>(
      existing?.result ?? 'pending'
    ),
    [credits, setCredits] = useState(
      existing?.originCredits?.toString() ??
        (initialCode
          ? (catalog.courses
              .find(c => c.code === initialCode)
              ?.credits.toString() ?? '')
          : '')
    ),
    [grade, setGrade] = useState(existing?.grade?.toString() ?? ''),
    [error, setError] = useState('')
  const [pending, setPending] = useState<Attempt | null>(null)

  return (
    <Dialog
      title={existing ? 'Editar intento' : 'Registrar intento'}
      onClose={onClose}
    >
      <form
        onSubmit={e => {
          e.preventDefault()
          const c = normalizeCode(code)
          const parsed = attemptSchema.safeParse({
            id: existing?.id ?? crypto.randomUUID(),
            planId,
            code: c,
            period: normalizePeriod(period),
            result,
            originCredits: credits ? Number(credits) : null,
            ...(grade ? { grade: Number(grade) } : {})
          })

          if (!parsed.success) {
            setError(
              'Revisa el código, periodo, créditos y nota. No se guardó el intento.'
            )

            return
          }

          if (!options.some(o => o.code === c)) {
            setError('Selecciona un curso del catálogo de este plan.')

            return
          }

          if (
            planId === 'isia-2025' &&
            parsed.data.originCredits !== null &&
            parsed.data.originCredits !==
              catalog.courses.find(item => item.code === c)?.credits
          ) {
            setError(
              'Para ISIA conserva los créditos de esta versión del catálogo.'
            )

            return
          }

          const old = data.attempts.find(
            a =>
              a.id !== existing?.id &&
              a.planId === planId &&
              a.code === c &&
              a.period === parsed.data.period
          )

          if (old) {
            setError(
              'Ya existe un intento de ese curso en ese periodo. Edítalo desde el historial.'
            )

            return
          }

          setPending(parsed.data)
        }}
      >
        <label>
          Plan del curso
          <Select
            value={planId}
            onValueChange={value => {
              setPlanId(value as Attempt['planId'])
              setCode('')
              setCredits('')
            }}
            aria-label={['Plan del curso'].join(' ')}
          >
            <SelectOption value='isia-2025'>ISIA 2025 · destino</SelectOption>
            <SelectOption value='icsi-2022'>
              ICSI 2022 · origen parcial
            </SelectOption>
          </Select>
        </label>
        <label>
          Buscar una asignatura
          <input
            type='search'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Nombre o código'
          />
        </label>
        <label>
          Asignatura
          <Select
            required
            value={code}
            onValueChange={value => {
              setCode(value)
              setCredits(
                options.find(c => c.code === value)?.credits?.toString() ?? ''
              )
            }}
            aria-label={['Asignatura'].join(' ')}
          >
            <SelectOption value=''>Seleccionar curso</SelectOption>
            {options
              .filter(
                c =>
                  c.code === code ||
                  `${c.code} ${c.name}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
              )
              .map(c => (
                <SelectOption key={c.code} value={c.code}>
                  {c.code} · {c.name}
                </SelectOption>
              ))}
          </Select>
        </label>
        <div className='form-grid'>
          <label>
            Periodo
            <input
              required
              placeholder='2026-20 o 202620'
              value={period}
              onChange={e => setPeriod(e.target.value)}
            />
          </label>
          <label>
            Resultado
            <Select
              value={result}
              onValueChange={value => setResult(value as Attempt['result'])}
              aria-label={['Resultado'].join(' ')}
            >
              {Object.entries(resultLabels).map(([v, l]) => (
                <SelectOption key={v} value={v}>
                  {l}
                </SelectOption>
              ))}
            </Select>
          </label>
          <label>
            Créditos de origen
            <input
              type='number'
              min='0.5'
              max='30'
              step='0.5'
              value={credits}
              onChange={e => setCredits(e.target.value)}
              readOnly={planId === 'isia-2025'}
            />
            <small>
              {planId === 'isia-2025'
                ? 'Créditos de esta versión del catálogo.'
                : 'Si no constan, deja el campo vacío. No se usarán los créditos de destino.'}
            </small>
          </label>
          <label>
            Nota (opcional)
            <input
              type='number'
              min='0'
              max='20'
              step='0.01'
              value={grade}
              onChange={e => setGrade(e.target.value)}
            />
            <small>La nota no determina el resultado automáticamente.</small>
          </label>
        </div>
        {error && (
          <p role='alert' className='error'>
            {error}
          </p>
        )}
        <div className='actions end'>
          <button type='button' className='secondary' onClick={onClose}>
            Cancelar
          </button>
          <button type='submit'>Revisar cambio</button>
        </div>
      </form>
      {pending && (
        <Confirm
          title='Confirmar intento'
          onClose={() => setPending(null)}
          label='Guardar intento'
          onConfirm={() => {
            onSave(pending)
            onClose()
          }}
        >
          {courseName(pending.code)} · {formatPeriod(pending.period)} ·{' '}
          {resultLabels[pending.result]}. Se recalcularán el avance y todos los
          escenarios.
        </Confirm>
      )}
    </Dialog>
  )
}
