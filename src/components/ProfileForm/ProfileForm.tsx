'use client'

import { FileArrowUpIcon, SparkleIcon } from '@phosphor-icons/react'
import { useState } from 'react'

import './ProfileForm.css'
import Dovi from '@/components/Dovi'
import Select, { SelectOption } from '@/components/Select'
import {
  account,
  currentRegularPeriod,
  estimateAcademicCycle,
  formatPeriod,
  nextRegularPeriod,
  normalizePeriod
} from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'
import {
  applyGradeThreshold,
  previewCSV,
  readPDF,
  readXLSX,
  resolveAmbiguousRows
} from '@/helpers/transfer.helpers'
import type { ImportRow } from '@/helpers/transfer.helpers'
import type { Profile, Workspace } from '@/helpers/validation.helpers'
import { profileSchema } from '@/helpers/validation.helpers'

const quickCohorts = [
  '202220',
  '202310',
  '202320',
  '202410',
  '202420',
  '202510',
  '202520',
  '202610',
  '202620'
]

const romanCycles = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X'
]

export type QuickImportPayload = {
  rows: ImportRow[]
  fileName: string
  autoMapEquivalences: boolean
  autoPlan: boolean
}

function suggestPlanForCohort(
  cohort: string
): Pick<Profile, 'entryPlan' | 'transition'> {
  if (cohort >= '202510')
    return { entryPlan: 'isia-2025', transition: 'direct' }

  if (cohort >= '202220')
    return { entryPlan: 'icsi-2022', transition: 'transition' }

  return { entryPlan: 'unconfirmed', transition: 'unconfirmed' }
}

export default function ProfileForm({
  data,
  onSave,
  onCancel,
  allowQuickImport = false
}: {
  data: Workspace
  onSave: (profile: Profile, quickImport?: QuickImportPayload) => void
  onCancel?: () => void
  allowQuickImport?: boolean
}) {
  const [cohortInput, setCohortInput] = useState(
    formatPeriod(data.profile.cohort)
  )
  const [profile, setProfile] = useState<Profile>({
    ...data.profile,
    currentCycle:
      data.profile.currentCycle ?? estimateAcademicCycle(data.profile.cohort),
    preferredCredits: data.profile.preferredCredits ?? 20
  })
  const [manualCycle, setManualCycle] = useState(
    Boolean(data.profile.currentCycle)
  )
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importedFile, setImportedFile] = useState<{
    name: string
    kind: string
    rows: ImportRow[]
  } | null>(null)
  const [applyGrades, setApplyGrades] = useState(true)
  const [autoMapEquivalences, setAutoMapEquivalences] = useState(true)
  const [autoPlan, setAutoPlan] = useState(true)

  const currentPeriod = currentRegularPeriod()
  const nextPeriod = nextRegularPeriod(currentPeriod)
  const normalizedCohort = normalizePeriod(cohortInput)
  const validCohort = /^20\d{2}(10|20|30)$/.test(normalizedCohort)
  const effectiveProfile: Profile = {
    ...profile,
    cohort: validCohort ? normalizedCohort : profile.cohort
  }
  const effectiveCycle =
    effectiveProfile.currentCycle ??
    estimateAcademicCycle(effectiveProfile.cohort, currentPeriod)
  const preview = account({ ...data, profile: effectiveProfile }, catalog)
  const previous = account(data, catalog)

  function handleCohortChange(raw: string) {
    setCohortInput(raw)
    setError('')
    const normalized = normalizePeriod(raw)

    if (/^20\d{2}(10|20|30)$/.test(normalized)) {
      const inferred = suggestPlanForCohort(normalized)
      const estimated = estimateAcademicCycle(normalized, currentPeriod)

      setProfile(prev => ({
        ...prev,
        cohort: normalized,
        ...inferred,
        currentCycle: manualCycle ? prev.currentCycle : estimated
      }))
    }
  }

  async function handleQuickFile(file: File) {
    setImportError('')
    setImporting(true)

    try {
      const lower = file.name.toLowerCase()
      let rows: ImportRow[] = []
      let kind = 'archivo'
      let detectedPlan: 'icsi-2022' | 'isia-2025' | undefined

      if (lower.endsWith('.pdf')) {
        const res = await readPDF(file)

        rows = res.rows
        kind =
          res.kind === 'matricula' ? 'Ficha de matrícula' : 'Reporte de notas'
        detectedPlan = res.detectedPlan
      } else if (lower.endsWith('.xlsx')) {
        rows = await readXLSX(file)
        kind = 'Excel (.xlsx)'
      } else if (lower.endsWith('.csv')) {
        rows = previewCSV(await file.text())
        kind = 'CSV'
      } else {
        throw new Error(
          'Formato no admitido. Sube tu Reporte de Notas PDF, Ficha de Matrícula PDF, Excel (.xlsx) o CSV.'
        )
      }

      if (detectedPlan && detectedPlan !== profile.entryPlan) {
        setProfile(prev => ({
          ...prev,
          entryPlan: detectedPlan,
          transition: detectedPlan === 'isia-2025' ? 'direct' : 'transition'
        }))
      }

      setImportedFile({ name: file.name, kind, rows })
    } catch (e) {
      setImportError(
        e instanceof Error
          ? e.message
          : 'No pudimos leer este archivo. Prueba con otro PDF, Excel (.xlsx) o CSV.'
      )
    } finally {
      setImporting(false)
    }
  }

  const readyRows = importedFile
    ? (() => {
        let processed = resolveAmbiguousRows(
          importedFile.rows,
          effectiveProfile.entryPlan
        )

        if (applyGrades) processed = applyGradeThreshold(processed, 11)

        return processed
      })()
    : []
  const recognizedCount = readyRows.filter(
    r => r.classification === 'recognized'
  ).length

  return (
    <form
      className='profile-form'
      onSubmit={e => {
        e.preventDefault()
        const normalized = normalizePeriod(cohortInput)
        const candidate: Profile = {
          ...profile,
          cohort: normalized,
          currentCycle: effectiveCycle,
          preferredCredits: profile.preferredCredits ?? 20
        }
        const result = profileSchema.safeParse(candidate)

        if (!result.success) {
          setError(result.error.issues[0].message)

          return
        }

        onSave(
          result.data,
          importedFile && recognizedCount > 0
            ? {
                rows: readyRows,
                fileName: importedFile.name,
                autoMapEquivalences,
                autoPlan
              }
            : undefined
        )
      }}
    >
      <div className='welcome-row'>
        <Dovi state='bienvenida' />
        <div>
          <p className='eyebrow'>TU PUNTO DE PARTIDA EN 1 PASO</p>
          <h2>Ubiquemos tu ciclo y tu plan.</h2>
          <p>
            Indica tu periodo de ingreso (por ejemplo, <strong>2023-10</strong>{' '}
            o <strong>2025-10</strong>). Calculamos tu ciclo actual, detectamos
            si vienes de ICSI o ISIA y dejamos listo tu planificador.
          </p>
        </div>
      </div>

      <div className='form-grid'>
        <label>
          Periodo de ingreso
          <input
            required
            placeholder='2023-10 o 2025-10'
            title='Ejemplo: 2023-10, 202310 o 2025-10'
            value={cohortInput}
            onChange={e => handleCohortChange(e.target.value)}
          />
          <small>Acepta formato con guion (2023-10) o compacto (202310).</small>
          <div className='cohort-chips' aria-label='Periodos frecuentes'>
            {quickCohorts.map(c => (
              <button
                type='button'
                key={c}
                className={`cohort-chip ${normalizedCohort === c ? 'active' : ''}`}
                onClick={() => handleCohortChange(formatPeriod(c))}
              >
                {formatPeriod(c)}
              </button>
            ))}
          </div>
        </label>

        <div>
          <label>
            Ciclo actual (calculado automáticamente)
            <Select
              value={String(effectiveCycle)}
              onValueChange={value => {
                setManualCycle(true)
                setProfile({ ...profile, currentCycle: Number(value) })
              }}
              aria-label='Ciclo actual'
            >
              {romanCycles.map((r, i) => (
                <SelectOption key={r} value={String(i + 1)}>
                  Ciclo {r} ({i + 1}.º ciclo)
                </SelectOption>
              ))}
            </Select>
            <small>
              Calculado al periodo actual {formatPeriod(currentPeriod)}. Puedes
              ajustarlo si llevaste cursos adelantados o hiciste reserva.
            </small>
          </label>
          <label style={{ marginTop: 16 }}>
            Créditos objetivo para tu próximo ciclo
            <input
              type='number'
              min={4}
              max={30}
              value={profile.preferredCredits ?? 20}
              onChange={e => {
                const n = Number(e.target.value)

                if (n >= 1 && n <= 40)
                  setProfile({ ...profile, preferredCredits: n })
              }}
            />
            <div className='cohort-chips' aria-label='Cargas frecuentes'>
              {[16, 18, 20, 22].map(cr => (
                <button
                  type='button'
                  key={cr}
                  className={`cohort-chip ${(profile.preferredCredits ?? 20) === cr ? 'active' : ''}`}
                  onClick={() =>
                    setProfile({ ...profile, preferredCredits: cr })
                  }
                >
                  {cr} créditos
                </button>
              ))}
            </div>
          </label>
        </div>
      </div>

      <div className='profile-summary-card' aria-live='polite'>
        <div>
          <small>Tu ciclo estimado</small>
          <strong>Ciclo {romanCycles[effectiveCycle - 1]}</strong>
          <span>Periodo actual {formatPeriod(currentPeriod)}</span>
        </div>
        <div>
          <small>Ruta detectada</small>
          <strong>
            {effectiveProfile.transition === 'direct'
              ? 'ISIA 2025 directo'
              : effectiveProfile.transition === 'transition'
                ? 'ICSI 2022 → ISIA 2025'
                : 'Por confirmar'}
          </strong>
          <span>Malla destino: ISIA 2025</span>
        </div>
        <div>
          <small>Próximo ciclo electivo</small>
          <strong>{formatPeriod(nextPeriod)}</strong>
          <span>Hasta {profile.preferredCredits ?? 20} cr. por ciclo</span>
        </div>
      </div>

      {allowQuickImport && (
        <div className='profile-quick-import'>
          <div className='profile-quick-import-head'>
            <div>
              <h3>
                <SparkleIcon
                  size={16}
                  style={{ display: 'inline', marginRight: 6 }}
                />
                Opcional: sube tu Reporte de Notas, Ficha de Matrícula o Excel
              </h3>
              <p>
                Leemos tus cursos aprobados o en curso directo en tu navegador,
                mapeamos tus equivalencias ICSI → ISIA y armamos tu próximo
                ciclo automáticamente.
              </p>
            </div>
            <label className='profile-quick-import-label'>
              <FileArrowUpIcon size={16} />
              {importing ? 'Leyendo archivo…' : 'Subir PDF / Excel / CSV'}
              <input
                type='file'
                accept='.pdf,.xlsx,.csv'
                disabled={importing}
                onChange={e => {
                  const file = e.target.files?.[0]

                  if (file) void handleQuickFile(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          {importError && (
            <p className='error' role='alert' style={{ marginTop: 12 }}>
              {importError}
            </p>
          )}
          {importedFile && (
            <div className='profile-import-ready'>
              <div className='profile-import-ready-top'>
                <strong>
                  ✓ {importedFile.name} ({importedFile.kind}) ·{' '}
                  {recognizedCount} cursos listos para importar
                </strong>
                <button
                  type='button'
                  className='text-button danger'
                  onClick={() => setImportedFile(null)}
                >
                  Quitar archivo
                </button>
              </div>
              <label className='checkbox-row'>
                <input
                  type='checkbox'
                  checked={applyGrades}
                  onChange={e => setApplyGrades(e.target.checked)}
                />
                Marcar notas ≥ 11 como «Aprobado» (escala UPAO 0–20)
              </label>
              {effectiveProfile.transition === 'transition' && (
                <label className='checkbox-row'>
                  <input
                    type='checkbox'
                    checked={autoMapEquivalences}
                    onChange={e => setAutoMapEquivalences(e.target.checked)}
                  />
                  Aplicar correspondencias documentadas ICSI → ISIA
                  automáticamente (reversibles)
                </label>
              )}
              <label className='checkbox-row'>
                <input
                  type='checkbox'
                  checked={autoPlan}
                  onChange={e => setAutoPlan(e.target.checked)}
                />
                Generar automáticamente mi plan sugerido para el próximo ciclo
              </label>
            </div>
          )}
        </div>
      )}

      <details className='profile-advanced'>
        <summary>
          Ajustar manualmente plan de ingreso o transición (opcional)
        </summary>
        <div className='form-grid'>
          <label>
            Plan de ingreso
            <Select
              value={profile.entryPlan}
              onValueChange={value => {
                const entryPlan = value as Profile['entryPlan']

                setProfile({
                  ...profile,
                  entryPlan,
                  transition:
                    entryPlan === 'isia-2025'
                      ? 'direct'
                      : entryPlan === 'icsi-2022'
                        ? 'transition'
                        : 'unconfirmed'
                })
              }}
              aria-label='Plan de ingreso'
            >
              <SelectOption value='isia-2025'>
                ISIA · inicio 2025-10
              </SelectOption>
              <SelectOption value='icsi-2022'>
                ICSI · inicio 2022-20 (transición)
              </SelectOption>
              <SelectOption value='unconfirmed'>
                Aún no lo puedo confirmar
              </SelectOption>
            </Select>
          </label>
          <label>
            Situación que confirmo
            <Select
              value={profile.transition}
              onValueChange={value =>
                setProfile({
                  ...profile,
                  transition: value as Profile['transition']
                })
              }
              aria-label='Situación que confirmo'
            >
              <SelectOption value='direct'>Ingreso directo a ISIA</SelectOption>
              <SelectOption value='transition'>
                Transición ICSI → ISIA
              </SelectOption>
              <SelectOption value='unconfirmed'>
                Por confirmar con la universidad
              </SelectOption>
            </Select>
          </label>
        </div>
      </details>

      {onCancel && (
        <div className='notice'>
          <strong>Al aplicar esta configuración</strong>
          <p>
            {previous.recognizedCredits} → {preview.recognizedCredits} créditos
            reconocidos en destino; {data.attempts.length} intentos y{' '}
            {data.scenarios.length} escenarios se conservan y recalculan.
          </p>
        </div>
      )}

      {error && (
        <p className='error' role='alert'>
          {error}
        </p>
      )}
      <label className='checkbox-row'>
        <input type='checkbox' required defaultChecked={Boolean(onCancel)} />
        Confirmo esta configuración para planificar; revisaré con UPAO lo que no
        puedo verificar.
      </label>
      <div className='actions end'>
        {onCancel && (
          <button type='button' className='secondary' onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type='submit'>
          {onCancel
            ? 'Aplicar configuración'
            : importedFile && recognizedCount > 0
              ? 'Importar y abrir mi plan'
              : 'Abrir mi malla'}{' '}
          <span aria-hidden='true'>↗</span>
        </button>
      </div>
    </form>
  )
}
