'use client'

import { SparkleIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'

import Confirm from '@/components/ConfirmDialog'
import Dovi from '@/components/Dovi'
import Select, { SelectOption } from '@/components/Select'
import {
  applyDocumentedRecognitions,
  formatPeriod
} from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'
import { backup, parseBackup } from '@/helpers/storage.helpers'
import {
  applyGradeThreshold,
  csv,
  download,
  historyCSV,
  mergeAttempts,
  previewCSV,
  readPDF,
  readXLSX,
  resolveAmbiguousRows,
  resultLabels,
  setAllRowsResult,
  templateCSV
} from '@/helpers/transfer.helpers'
import type { ImportRow } from '@/helpers/transfer.helpers'
import type { Attempt, Workspace } from '@/helpers/validation.helpers'

export default function Backups({
  data,
  onChange,
  onPrint
}: {
  data: Workspace
  onChange: (d: Workspace, m: string) => void
  onPrint: () => void
}) {
  const [rows, setRows] = useState<ImportRow[] | null>(null),
    [replacement, setReplacement] = useState<Workspace | null>(null),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [confirm, setConfirm] = useState(false),
    [fileName, setFileName] = useState(''),
    [pdfKind, setPdfKind] = useState<'report' | 'matricula' | null>(null),
    [autoPassOnImport, setAutoPassOnImport] = useState(true),
    [autoMapOnImport, setAutoMapOnImport] = useState(true)
  const input = useRef<HTMLInputElement>(null)

  async function read(file: File) {
    setError('')
    setRows(null)
    setReplacement(null)
    setFileName(file.name)
    setPdfKind(null)

    if (file.size > 10_000_000) {
      setError(
        'El archivo supera 10 MB. JSON y CSV admiten hasta 2 MB; Excel hasta 5 MB; PDF hasta 10 MB.'
      )

      return
    }

    setLoading(true)

    try {
      const lower = file.name.toLowerCase()

      if (lower.endsWith('.pdf')) {
        const result = await readPDF(file)

        setRows(result.rows)
        setPdfKind(result.kind)
      } else if (lower.endsWith('.xlsx')) {
        const parsed = await readXLSX(file)

        setRows(parsed)
      } else if (lower.endsWith('.json')) {
        if (file.size > 2_000_000) throw new Error('El respaldo supera 2 MB.')
        setReplacement(parseBackup(await file.text()))
      } else if (lower.endsWith('.csv')) {
        if (file.size > 2_000_000) throw new Error('El CSV supera 2 MB.')
        setRows(previewCSV(await file.text()))
      } else
        throw new Error(
          'Formato no admitido. Selecciona Excel (.xlsx), CSV, PDF de UPAO (Reporte de notas o Ficha de matrícula) o respaldo JSON.'
        )
    } catch (e) {
      setError(
        e instanceof Error && e.name !== 'ZodError'
          ? e.message
          : 'Archivo inválido: revisa el esquema, la versión y los campos. No se aplicó ningún cambio.'
      )
    } finally {
      setLoading(false)

      if (input.current) input.current.value = ''
    }
  }

  const good =
    rows?.filter(r => r.classification === 'recognized' && r.attempt) ?? []
  const ambiguousCount =
    rows?.filter(r => r.classification === 'ambiguous').length ?? 0
  const pendingWithGradeCount =
    rows?.filter(
      r =>
        r.classification === 'recognized' &&
        r.attempt?.result === 'pending' &&
        r.attempt.grade !== undefined
    ).length ?? 0
  const hasIcsiRows = good.some(r => r.attempt?.planId === 'icsi-2022')
  const updates = good.filter(r =>
    data.attempts.some(
      a =>
        a.planId === r.attempt!.planId &&
        a.code === r.attempt!.code &&
        a.period === r.attempt!.period
    )
  ).length

  function resolve(index: number, value: string) {
    if (!rows) return
    const next = [...rows],
      row = { ...next[index] },
      candidate = row.candidates.find(c => c.planId === value)

    if (!candidate || !row.attempt) return
    row.attempt = { ...row.attempt, planId: candidate.planId }
    row.classification = 'recognized'
    row.message = 'Plan confirmado manualmente.'

    if (
      candidate.planId === 'isia-2025' &&
      row.attempt.originCredits !== null &&
      row.attempt.originCredits !== candidate.credits
    ) {
      row.classification = 'invalid'
      row.message =
        'Los créditos no corresponden al plan ISIA. Corrige el archivo antes de importar.'
    }

    next[index] = row
    setRows(next)
  }

  return (
    <>
      <div className='page-title'>
        <div>
          <p className='eyebrow'>IMPORTAR Y RESPALDAR</p>
          <h1>
            Respaldos y archivos<span className='coral'>.</span>
          </h1>
          <p>
            Sube tu Reporte de Notas PDF, Ficha de Matrícula PDF, Excel (.xlsx)
            o CSV para cargar tus cursos en segundos.
          </p>
        </div>
        <Dovi state='alegre' />
      </div>
      <div className='backup-grid'>
        <section className='backup-import' data-tour='import-box'>
          <p className='eyebrow'>01 / CARGAR TUS CURSOS O RESPALDO</p>
          <h2>Sube tu archivo y revisa antes de aplicar.</h2>
          <p>
            Acepta <strong>Excel (.xlsx)</strong>, <strong>CSV</strong>,{' '}
            <strong>Reporte de Notas PDF</strong>,{' '}
            <strong>Ficha de Matrícula PDF</strong> de UPAO o un{' '}
            <strong>respaldo JSON</strong>. Todo se procesa localmente en tu
            navegador.
          </p>
          <label className='file-drop'>
            Elegir archivo local
            <input
              ref={input}
              type='file'
              accept='.json,.csv,.xlsx,.pdf'
              onChange={e => {
                const file = e.target.files?.[0]

                if (file) void read(file)
              }}
              disabled={loading}
            />
            <small>
              Excel (.xlsx) hasta 5 MB · CSV / JSON hasta 2 MB · PDF hasta 10 MB
            </small>
          </label>
          <button
            className='text-button'
            onClick={() =>
              download(
                'rutacreditos-plantilla.csv',
                templateCSV(),
                'text/csv;charset=utf-8'
              )
            }
          >
            ↓ Descargar plantilla CSV (compatible con Excel)
          </button>
          <p className='caption'>
            En Excel o CSV usa las columnas <code>codigo</code> (o{' '}
            <code>curso</code>), <code>periodo</code> (ej. 2023-10) y{' '}
            <code>resultado</code> o <code>nota</code>. Los códigos desconocidos
            se excluyen automáticamente.
          </p>
          {loading && (
            <output className='notice'>
              Leyendo el archivo en este navegador…
            </output>
          )}
          {error && (
            <p role='alert' className='error'>
              {error}
            </p>
          )}
        </section>
        <section className='backup-export'>
          <p className='eyebrow'>02 / GUARDAR UNA COPIA</p>
          <h2>Una copia fuera del navegador.</h2>
          <p>
            El respaldo JSON conserva configuración, historial, reconocimientos
            y escenarios del espacio{' '}
            <strong>
              {data.mode === 'demo' ? 'demo ficticio' : 'personal'}
            </strong>
            .
          </p>
          <button
            onClick={() =>
              download(`rutacreditos-${data.mode}.json`, backup(data))
            }
          >
            ↓ Exportar respaldo JSON
          </button>
          <div className='actions vertical'>
            <button
              className='secondary'
              onClick={() =>
                download(
                  'rutacreditos-historial.csv',
                  historyCSV(data),
                  'text/csv;charset=utf-8'
                )
              }
            >
              Exportar historial CSV / Excel
            </button>
            <button className='secondary' onClick={onPrint}>
              Resumen imprimible / guardar PDF
            </button>
          </div>
          <p className='caption'>
            El almacenamiento es local y no sincroniza dispositivos. Conserva tu
            respaldo en un lugar seguro.
          </p>
        </section>
      </div>
      {(rows || replacement) && (
        <section className='import-preview'>
          <div className='section-heading'>
            <div>
              <p className='eyebrow'>
                PREVISUALIZACIÓN · NINGÚN CAMBIO APLICADO
              </p>
              <h2>Revisar {fileName}</h2>
            </div>
            <button
              className='secondary small'
              onClick={() => {
                setRows(null)
                setReplacement(null)
              }}
            >
              Descartar archivo
            </button>
          </div>
          {replacement ? (
            <>
              <div className='notice'>
                <strong>
                  Este JSON reemplazará el espacio{' '}
                  {data.mode === 'demo' ? 'demo' : 'personal'} actual.
                </strong>
                <p>
                  Perfil del archivo:{' '}
                  {replacement.mode === 'demo'
                    ? 'ejemplo ficticio'
                    : 'personal'}{' '}
                  · cohorte {formatPeriod(replacement.profile.cohort)} · plan{' '}
                  {replacement.profile.applicablePlan}.
                </p>
                <p>
                  Historial: {data.attempts.length} →{' '}
                  {replacement.attempts.length} intentos. Escenarios:{' '}
                  {data.scenarios.length} → {replacement.scenarios.length}.
                  Reconocimientos: {data.recognitions.length} →{' '}
                  {replacement.recognitions.length}.
                </p>
                <p>
                  Los códigos y referencias del respaldo son válidos. Todos los
                  escenarios se recalcularán; el catálogo vigente es la
                  referencia.
                </p>
                {replacement.mode !== data.mode && (
                  <p className='error'>
                    El archivo procede de otro modo. Confirma conscientemente la
                    copia a este espacio. La copia original del otro modo
                    permanece separada.
                  </p>
                )}
              </div>
              <button onClick={() => setConfirm(true)}>
                Revisar reemplazo del espacio
              </button>
            </>
          ) : (
            <>
              <div className='import-counts'>
                <span>
                  <strong>{good.length}</strong> reconocidos
                </span>
                <span>
                  <strong>{ambiguousCount}</strong> ambiguos
                </span>
                <span>
                  <strong>
                    {rows!.filter(r => r.classification === 'unknown').length}
                  </strong>{' '}
                  desconocidos
                </span>
                <span>
                  <strong>
                    {rows!.filter(r => r.classification === 'invalid').length}
                  </strong>{' '}
                  inválidos
                </span>
              </div>
              {pdfKind === 'report' && (
                <p className='notice'>
                  El PDF no declara un resultado inequívoco por asignatura.
                  Todos los intentos extraídos se proponen como «Pendiente», sin
                  deducir aprobación por nota automáticamente. Usa los botones
                  rápidos de abajo para confirmar notas ≥ 11 o resolver ambiguos
                  en un clic. No se conserva el documento.
                </p>
              )}
              {pdfKind === 'matricula' && (
                <p className='notice'>
                  <strong>Ficha de matrícula detectada.</strong> Los cursos
                  inscritos se proponen como «En curso» para que el planificador
                  pueda proyectar tu próximo ciclo electivo.
                </p>
              )}
              {(ambiguousCount > 0 ||
                pendingWithGradeCount > 0 ||
                good.some(r => r.attempt?.result === 'pending')) && (
                <div className='actions' style={{ marginBottom: 16 }}>
                  {ambiguousCount > 0 && (
                    <button
                      type='button'
                      className='secondary small'
                      onClick={() =>
                        setRows(prev =>
                          prev
                            ? resolveAmbiguousRows(prev, data.profile.entryPlan)
                            : prev
                        )
                      }
                    >
                      <SparkleIcon size={15} />
                      Resolver {ambiguousCount} ambiguos por periodo
                    </button>
                  )}
                  {pendingWithGradeCount > 0 && (
                    <button
                      type='button'
                      className='small'
                      onClick={() =>
                        setRows(prev =>
                          prev ? applyGradeThreshold(prev, 11) : prev
                        )
                      }
                    >
                      ✓ Marcar notas ≥ 11 como Aprobado ({pendingWithGradeCount}{' '}
                      cursos)
                    </button>
                  )}
                  {good.some(r => r.attempt?.result === 'pending') && (
                    <button
                      type='button'
                      className='secondary small'
                      onClick={() =>
                        setRows(prev =>
                          prev ? setAllRowsResult(prev, 'passed') : prev
                        )
                      }
                    >
                      Marcar todos los reconocidos como Aprobado
                    </button>
                  )}
                </div>
              )}
              <p>
                Se añadirán {good.length - updates} intentos y se actualizarán{' '}
                {updates} coincidencias de plan, código y periodo. Las filas sin
                resolver o inválidas no se aplicarán.
              </p>
              <div className='table-scroll'>
                <table>
                  <thead>
                    <tr>
                      <th>Fila / código</th>
                      <th>Periodo / nota</th>
                      <th>Coincidencia</th>
                      <th>Revisión manual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows!.map((row, index) => (
                      <tr key={index}>
                        <td>
                          {row.row} · {row.rawCode}
                          <small>
                            {row.attempt?.originCredits ?? 'Sin créditos'}
                            {row.attempt?.originCredits ? ' cr.' : ''}
                          </small>
                        </td>
                        <td>
                          {row.attempt?.period
                            ? formatPeriod(row.attempt.period)
                            : '—'}
                          <small>
                            {row.attempt
                              ? resultLabels[row.attempt.result]
                              : '—'}
                            {row.attempt?.grade !== undefined
                              ? ` · Nota ${row.attempt.grade}`
                              : ''}
                          </small>
                        </td>
                        <td>
                          <strong>
                            {
                              {
                                recognized: 'Reconocido',
                                ambiguous: 'Ambiguo',
                                unknown: 'Desconocido',
                                invalid: 'Inválido'
                              }[row.classification]
                            }
                          </strong>
                          <small>{row.message}</small>
                        </td>
                        <td>
                          {row.classification === 'ambiguous' && (
                            <label>
                              Plan de {row.rawCode}
                              <Select
                                defaultValue=''
                                onValueChange={value => resolve(index, value)}
                                aria-label={['Plan de', row.rawCode].join(' ')}
                              >
                                <SelectOption value='' disabled>
                                  Elegir plan
                                </SelectOption>
                                {row.candidates.map(c => (
                                  <SelectOption key={c.planId} value={c.planId}>
                                    {c.planId} · {c.name}
                                  </SelectOption>
                                ))}
                              </Select>
                            </label>
                          )}
                          {row.classification === 'recognized' &&
                            row.attempt && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 8
                                }}
                              >
                                {row.candidates.length > 1 && (
                                  <label>
                                    Plan de {row.rawCode}
                                    <Select
                                      value={row.attempt.planId}
                                      onValueChange={value =>
                                        resolve(index, value)
                                      }
                                      aria-label={['Plan de', row.rawCode].join(
                                        ' '
                                      )}
                                    >
                                      {row.candidates.map(c => (
                                        <SelectOption
                                          key={c.planId}
                                          value={c.planId}
                                        >
                                          {c.planId === 'icsi-2022'
                                            ? 'ICSI 2022'
                                            : 'ISIA 2025'}
                                        </SelectOption>
                                      ))}
                                    </Select>
                                  </label>
                                )}
                                <label>
                                  Resultado de {row.rawCode}
                                  <Select
                                    value={row.attempt.result}
                                    onValueChange={value => {
                                      const next = [...rows!]

                                      next[index] = {
                                        ...row,
                                        attempt: {
                                          ...row.attempt!,
                                          result: value as Attempt['result']
                                        }
                                      }
                                      setRows(next)
                                    }}
                                    aria-label={[
                                      'Resultado de',
                                      row.rawCode
                                    ].join(' ')}
                                  >
                                    <SelectOption value='pending'>
                                      Pendiente
                                    </SelectOption>
                                    <SelectOption value='passed'>
                                      Aprobado
                                    </SelectOption>
                                    <SelectOption value='in-progress'>
                                      En curso
                                    </SelectOption>
                                    <SelectOption value='failed'>
                                      Desaprobado
                                    </SelectOption>
                                  </Select>
                                </label>
                              </div>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className='actions'>
                <button
                  disabled={!good.length}
                  onClick={() => setConfirm(true)}
                >
                  Importar {good.length} intentos revisados
                </button>
                <button
                  className='secondary'
                  onClick={() =>
                    download(
                      'rutacreditos-revision.csv',
                      csv([
                        ['fila', 'codigo', 'clasificacion', 'detalle'],
                        ...rows!.map(r => [
                          r.row,
                          r.rawCode,
                          r.classification,
                          r.message
                        ])
                      ]),
                      'text/csv;charset=utf-8'
                    )
                  }
                >
                  Exportar revisión CSV
                </button>
              </div>
            </>
          )}
        </section>
      )}
      {confirm && (
        <Confirm
          title={
            replacement
              ? 'Confirmar reemplazo del espacio'
              : 'Confirmar importación'
          }
          label={
            replacement
              ? 'Reemplazar este espacio'
              : 'Aplicar intentos revisados'
          }
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            const finalRows =
              !replacement &&
              rows &&
              pendingWithGradeCount > 0 &&
              autoPassOnImport
                ? applyGradeThreshold(rows, 11)
                : rows
            let next = replacement
              ? { ...replacement, mode: data.mode }
              : mergeAttempts(data, finalRows!)
            let extraNote = ''

            if (!replacement && autoMapOnImport) {
              const mapped = applyDocumentedRecognitions(next, catalog, {
                includePending: true
              })

              if (mapped.added > 0) {
                next = { ...next, recognitions: mapped.recognitions }
                extraNote = ` Se convalidaron ${mapped.added} cursos ICSI → ISIA automáticamente.`
              }
            }

            onChange(
              next,
              `Archivo aplicado. Avance y escenarios recalculados.${extraNote}`
            )
            setRows(null)
            setReplacement(null)
          }}
        >
          {replacement ? (
            `Se reemplazará el espacio ${data.mode} por el respaldo revisado. Puedes exportar primero el espacio actual o deshacer el cambio reciente.`
          ) : (
            <>
              <p>
                Se aplicarán {good.length} intentos: {good.length - updates}{' '}
                nuevos y {updates} actualizaciones. No se aplicarán las filas
                ambiguas, desconocidas o inválidas.
              </p>
              {pendingWithGradeCount > 0 && (
                <label className='checkbox-row' style={{ marginTop: 12 }}>
                  <input
                    type='checkbox'
                    checked={autoPassOnImport}
                    onChange={e => setAutoPassOnImport(e.target.checked)}
                  />
                  Confirmar automáticamente los {pendingWithGradeCount} cursos
                  con nota ≥ 11 como «Aprobado» (escala UPAO 0–20).
                </label>
              )}
              {hasIcsiRows && (
                <label className='checkbox-row' style={{ marginTop: 12 }}>
                  <input
                    type='checkbox'
                    checked={autoMapOnImport}
                    onChange={e => setAutoMapOnImport(e.target.checked)}
                  />
                  Convalidar automáticamente todos tus cursos aprobados de ICSI
                  2022 → ISIA 2025 (puedes revisar o revertir cualquiera en
                  Transición).
                </label>
              )}
            </>
          )}
        </Confirm>
      )}
    </>
  )
}
