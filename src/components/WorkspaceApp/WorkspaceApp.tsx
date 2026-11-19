'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import AttemptEditor from '@/components/AttemptEditor'
import Backups from '@/components/Backups'
import Brand from '@/components/Brand'
import Confirm from '@/components/ConfirmDialog'
import Malla from '@/components/CurriculumMap'
import Dashboard from '@/components/Dashboard'
import Dialog from '@/components/Dialog'
import GuidedTour from '@/components/GuidedTour'
import History from '@/components/History'
import NoticeToast from '@/components/NoticeToast'
import Planner from '@/components/Planner'
import PrintSummary from '@/components/PrintSummary'
import ProfileForm from '@/components/ProfileForm'
import type { QuickImportPayload } from '@/components/ProfileForm'
import Compare from '@/components/ScenarioComparison'
import Transition from '@/components/Transition'
import WorkspaceFrame from '@/components/WorkspaceFrame'
import {
  applyDocumentedRecognitions,
  buildAutoScenario,
  formatPeriod
} from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'
import {
  browserStore,
  clearWorkspace,
  demoWorkspace,
  emptyWorkspace,
  parseBackup,
  readWorkspace,
  saveWorkspace,
  storageKey,
  validateWorkspace
} from '@/helpers/storage.helpers'
import { download, mergeAttempts } from '@/helpers/transfer.helpers'
import type { Attempt, Profile, Workspace } from '@/helpers/validation.helpers'
import { workspaceSchema } from '@/helpers/validation.helpers'

export default function WorkspaceApp() {
  const searchParams = useSearchParams()
  const modeQuery = searchParams.get('mode')
  const requestedCourse = searchParams.get('course')
  const [data, setData] = useState<Workspace | null>(null),
    [ready, setReady] = useState(false),
    [mode, setMode] = useState<Workspace['mode']>('personal'),
    [tab, setTab] = useState('malla'),
    [initialCourse, setInitialCourse] = useState<string | null>(null),
    [onboarding, setOnboarding] = useState(false),
    [configuration, setConfiguration] = useState(false),
    [tourOpen, setTourOpen] = useState(false),
    [message, setMessage] = useState(''),
    [storageError, setStorageError] = useState(''),
    [recovery, setRecovery] = useState<Workspace | undefined>(),
    [externalChange, setExternalChange] = useState(false)
  const [edit, setEdit] = useState<{ code?: string; attempt?: Attempt } | null>(
      null
    ),
    [confirm, setConfirm] = useState<'clear' | 'reset-demo' | 'recover' | null>(
      null
    ),
    [pendingBackup, setPendingBackup] = useState<Workspace | null>(null)
  const undo = useRef<Workspace[]>([])
  const [undoCount, setUndoCount] = useState(0)
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const selectedMode = modeQuery === 'demo' ? 'demo' : 'personal'

    // oxlint-disable-next-line react/set-state-in-effect -- Hydrate the external browser store after server rendering.
    setMode(selectedMode)
    setData(null)
    setInitialCourse(null)
    setMessage('')
    setRecovery(undefined)
    setConfiguration(false)
    setTourOpen(false)
    setEdit(null)
    setConfirm(null)
    setOnboarding(false)
    setStorageError('')
    setExternalChange(false)
    setTab('malla')
    setUndoCount(0)
    undo.current = []

    if (catalog.courses.some(c => c.code === requestedCourse))
      setInitialCourse(requestedCourse)
    const result = readWorkspace(browserStore, selectedMode)

    if (result.error) {
      setStorageError(result.error)
      setRecovery(result.recovery)
    } else if (result.data) setData(result.data)
    else if (selectedMode === 'demo') {
      const initial = demoWorkspace()

      setData(initial)

      try {
        saveWorkspace(browserStore, initial)
      } catch {
        setMessage(
          'Demo abierta en memoria. No se pudo guardar en este navegador. Exporta un respaldo.'
        )
      }
    } else {
      setData(emptyWorkspace())
      setOnboarding(true)
    }

    setReady(true)
  }, [modeQuery, requestedCourse])
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.key === storageKey(mode)) setExternalChange(true)
    }

    window.addEventListener('storage', listener)

    return () => window.removeEventListener('storage', listener)
  }, [mode])

  function notify(text: string) {
    setMessage(text)
  }

  function change(next: Workspace, text: string) {
    if (externalChange) {
      notify(
        'Este espacio cambió en otra pestaña. Recarga antes de editar para conservar la versión más reciente.'
      )

      return
    }

    const checked = workspaceSchema.safeParse({
      ...next,
      mode,
      catalogVersion: catalog.version,
      updatedAt: new Date().toISOString()
    })

    if (!checked.success) {
      notify(
        'No se aplicó el cambio: revisa los campos y los límites del espacio.'
      )

      return
    }

    const errors = validateWorkspace(checked.data)

    if (errors.length) {
      notify(`No se aplicó el cambio: ${errors[0]}`)

      return
    }

    if (data) {
      undo.current = [...undo.current.slice(-9), data]
      setUndoCount(undo.current.length)
    }

    setData(checked.data)

    try {
      saveWorkspace(browserStore, checked.data)
      notify(text)
    } catch {
      notify(
        'El cambio está solo en memoria: no se pudo guardar en este navegador. Exporta un respaldo JSON antes de salir.'
      )
    }
  }

  function undoChange() {
    const previous = undo.current.pop()

    if (!previous) return
    setData(previous)
    setUndoCount(undo.current.length)

    try {
      saveWorkspace(browserStore, previous)
      notify('Último cambio deshecho. Avance y escenarios recalculados.')
    } catch {
      notify(
        'Cambio deshecho solo en memoria. Descarga un respaldo para conservarlo.'
      )
    }
  }

  const navigate = useCallback((next: string) => {
    setTab(next)
    setMessage('')
    titleRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  function handleOnboardingSave(
    profile: Profile,
    quickImport?: QuickImportPayload
  ) {
    if (!data) return
    let next: Workspace = { ...data, profile }
    let summary = 'Perfil guardado. Ya puedes explorar tu malla.'
    let nextTab = 'malla'

    if (quickImport) {
      next = mergeAttempts(next, quickImport.rows)

      if (quickImport.autoMapEquivalences) {
        const mapped = applyDocumentedRecognitions(next, catalog, {
          includePending: true
        })

        next = { ...next, recognitions: mapped.recognitions }
      }

      if (quickImport.autoPlan) {
        const scenario = buildAutoScenario(next, catalog, {
          name: 'Plan sugerido inicial',
          periodCount: 2
        })

        next = { ...next, scenarios: [...next.scenarios, scenario] }
        nextTab = 'planner'
        summary = `Perfil guardado, historial importado y plan sugerido listo desde ${formatPeriod(scenario.periods[0].period)}.`
      } else {
        summary = 'Perfil guardado e historial importado correctamente.'
      }
    }

    change(next, summary)
    setOnboarding(false)
    setTab(nextTab)
  }

  function handleDashboardAutoPlan() {
    if (!data) return
    const mapped = applyDocumentedRecognitions(data, catalog, {
      includePending: true
    })
    const baseData =
      mapped.added > 0 ? { ...data, recognitions: mapped.recognitions } : data
    const scenario = buildAutoScenario(baseData, catalog, {
      name: `Plan automático ${baseData.scenarios.length + 1}`,
      periodCount: 2
    })

    change(
      { ...baseData, scenarios: [...baseData.scenarios, scenario] },
      `Plan automático creado desde ${formatPeriod(scenario.periods[0].period)} según tus créditos.${mapped.added > 0 ? ` Se convalidaron ${mapped.added} cursos ICSI → ISIA.` : ''}`
    )
    navigate('planner')
  }

  function recover(next: Workspace) {
    try {
      clearWorkspace(browserStore, mode)
      saveWorkspace(browserStore, { ...next, mode })
      setData({ ...next, mode })
      setStorageError('')
      setOnboarding(false)
      notify('Espacio recuperado. Revisa tu avance y conserva un respaldo.')
    } catch {
      setData({ ...next, mode })
      setStorageError('')
      setMessage(
        'Espacio recuperado solo en memoria. El almacenamiento está restringido: exporta un respaldo antes de salir.'
      )
    }
  }

  const header = (
    <header className='app-header'>
      <Brand />
      <div className='header-right'>
        <span className='local-label'>
          <span aria-hidden='true'>◈</span> Solo en este navegador
        </span>
        <Link href='/fuentes' className='help-link'>
          Fuentes y ayuda ↗
        </Link>
      </div>
    </header>
  )

  if (!ready)
    return (
      <>
        {header}
        <main id='main' className='empty-page' aria-busy='true'>
          <div className='loading-line' />
          <p>Abriendo tu espacio local…</p>
        </main>
      </>
    )

  if (storageError && !data)
    return (
      <>
        {header}
        <main id='main' className='wrap document-page'>
          <h1>Recuperemos tu punto de partida.</h1>
          <p className='error' role='alert'>
            {storageError}
          </p>
          <p>
            No sobrescribiremos el original sin que lo confirmes. Puedes
            descargarlo, probar la copia anterior o recuperar un respaldo.
          </p>
          <div className='actions'>
            {recovery && (
              <button onClick={() => setConfirm('recover')}>
                Recuperar copia anterior válida
              </button>
            )}
            <button
              className='secondary'
              onClick={() => {
                try {
                  download(
                    'rutacreditos-datos-por-recuperar.txt',
                    browserStore.getItem(storageKey(mode)) ?? '',
                    'text/plain'
                  )
                } catch {
                  setMessage(
                    'El navegador bloquea también la lectura del almacenamiento. Usa un respaldo externo.'
                  )
                }
              }}
            >
              Descargar datos originales
            </button>
            <button className='secondary' onClick={() => setConfirm('clear')}>
              Empezar de nuevo en este espacio
            </button>
          </div>
          <label>
            Recuperar respaldo JSON
            <input
              type='file'
              accept='.json'
              onChange={async e => {
                const file = e.target.files?.[0]

                if (!file) return

                try {
                  if (file.size > 2_000_000) throw new Error('Máximo 2 MB.')
                  setPendingBackup(parseBackup(await file.text()))
                } catch {
                  setMessage(
                    'El respaldo no es válido o no es compatible. Ningún dato fue modificado.'
                  )
                }

                e.target.value = ''
              }}
            />
          </label>
          {message && <output>{message}</output>}
          {confirm && (
            <Confirm
              title={
                confirm === 'recover'
                  ? 'Recuperar copia anterior'
                  : 'Restablecer este espacio'
              }
              onClose={() => setConfirm(null)}
              onConfirm={() => {
                recover(
                  confirm === 'recover'
                    ? recovery!
                    : mode === 'demo'
                      ? demoWorkspace()
                      : emptyWorkspace(mode)
                )

                if (confirm === 'clear' && mode === 'personal')
                  setOnboarding(true)
              }}
            >
              Se reemplazarán los datos locales dañados de este espacio.
              Descarga primero el original si necesitas conservarlo.
            </Confirm>
          )}
          {pendingBackup && (
            <Confirm
              title='Revisar respaldo de recuperación'
              label='Recuperar respaldo'
              onClose={() => setPendingBackup(null)}
              onConfirm={() => {
                recover(pendingBackup)
                setPendingBackup(null)
              }}
            >
              Perfil {pendingBackup.mode}, cohorte{' '}
              {formatPeriod(pendingBackup.profile.cohort)}:{' '}
              {pendingBackup.attempts.length} intentos y{' '}
              {pendingBackup.scenarios.length} escenarios. Se copiará al espacio{' '}
              {mode} y reemplazará sus datos dañados.
            </Confirm>
          )}
        </main>
      </>
    )

  if (!data) return null

  if (onboarding)
    return (
      <>
        {header}
        <main id='main' className='onboarding-page'>
          <Link className='text-link' href='/'>
            ← Volver al inicio
          </Link>
          <ProfileForm
            data={data}
            allowQuickImport
            onSave={handleOnboardingSave}
          />
          <p className='caption'>
            ¿Prefieres conocerlo primero?{' '}
            <Link href='/app?mode=demo'>Probar con un ejemplo ficticio →</Link>
          </p>
          <p className='caption'>
            Proyecto independiente, sin afiliación institucional.{' '}
            <Link href='/privacidad'>Privacidad y condiciones</Link>
          </p>
        </main>
      </>
    )

  return (
    <>
      <WorkspaceFrame
        data={data}
        tab={tab}
        onNavigate={navigate}
        onConfig={() => setConfiguration(true)}
        onTour={() => setTourOpen(true)}
        onClear={() => setConfirm('clear')}
        onReset={() => setConfirm('reset-demo')}
        onUndo={undoChange}
        undoCount={undoCount}
        externalChange={externalChange}
        mainRef={titleRef}
      >
        {tab === 'dashboard' && (
          <Dashboard
            data={data}
            onNavigate={navigate}
            onEdit={() => setEdit({})}
            onAutoPlan={handleDashboardAutoPlan}
          />
        )}
        {tab === 'malla' && (
          <Malla
            data={data}
            key={`${mode}:${initialCourse ?? ''}`}
            initialCourse={initialCourse}
            onEdit={code => setEdit({ code })}
            onChange={change}
          />
        )}
        {tab === 'history' && (
          <History
            data={data}
            onChange={change}
            onAdd={() => setEdit({})}
            onEdit={attempt => setEdit({ attempt })}
          />
        )}
        {tab === 'planner' && (
          <Planner
            data={data}
            onChange={change}
            notify={notify}
            onCompare={() => navigate('compare')}
          />
        )}
        {tab === 'compare' && (
          <Compare data={data} onPlanner={() => navigate('planner')} />
        )}
        {tab === 'transition' && <Transition data={data} onChange={change} />}
        {tab === 'backups' && (
          <Backups
            data={data}
            onChange={change}
            onPrint={() => window.print()}
          />
        )}
      </WorkspaceFrame>
      <GuidedTour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onNavigate={navigate}
      />
      <NoticeToast message={message} onDismiss={() => setMessage('')} />
      {configuration && (
        <Dialog
          title='Revisar mi configuración'
          wide
          onClose={() => setConfiguration(false)}
        >
          <ProfileForm
            data={data}
            onCancel={() => setConfiguration(false)}
            onSave={profile => {
              change(
                { ...data, profile },
                'Configuración actualizada. Historial conservado y escenarios recalculados.'
              )
              setConfiguration(false)
            }}
          />
        </Dialog>
      )}
      {edit && (
        <AttemptEditor
          data={data}
          initialCode={edit.code}
          existing={edit.attempt}
          onClose={() => setEdit(null)}
          onSave={attempt =>
            change(
              {
                ...data,
                attempts: edit.attempt
                  ? data.attempts.map(a => (a.id === attempt.id ? attempt : a))
                  : [...data.attempts, attempt]
              },
              'Intento guardado. Avance y escenarios recalculados.'
            )
          }
        />
      )}
      {confirm && (
        <Confirm
          title={
            confirm === 'reset-demo'
              ? 'Restablecer ejemplo ficticio'
              : 'Borrar este espacio'
          }
          label={
            confirm === 'reset-demo'
              ? 'Restablecer demo'
              : 'Borrar datos de este espacio'
          }
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            try {
              clearWorkspace(browserStore, mode)
            } catch {
              notify(
                'No se pudo borrar el almacenamiento. Revisa los permisos del navegador.'
              )

              return
            }

            const next =
              mode === 'demo' ? demoWorkspace() : emptyWorkspace(mode)

            setData(next)
            undo.current = []
            setUndoCount(0)

            if (mode === 'demo') {
              try {
                saveWorkspace(browserStore, next)
                notify('Ejemplo ficticio restablecido.')
              } catch {
                notify('Demo restablecida solo en memoria.')
              }
            } else {
              setOnboarding(true)
              notify('Espacio personal borrado. Puedes empezar de nuevo.')
            }
          }}
        >
          Se eliminarán historial, reconocimientos, escenarios y copia anterior
          de este espacio {mode === 'demo' ? 'demo' : 'personal'}. El otro
          espacio permanece independiente. Puedes descargar antes un respaldo
          desde Respaldos.
        </Confirm>
      )}
      <PrintSummary data={data} />
    </>
  )
}
