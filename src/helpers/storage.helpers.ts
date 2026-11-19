import { catalog } from './curriculum.helpers'
import type { Scenario, Workspace } from './validation.helpers'
import { backupSchema, workspaceSchema } from './validation.helpers'

export const storageKey = (mode: Workspace['mode']) => `rutacreditos:v1:${mode}`

export function emptyWorkspace(
  mode: Workspace['mode'] = 'personal',
  updatedAt = new Date().toISOString()
): Workspace {
  return {
    schemaVersion: 1,
    catalogVersion: catalog.version,
    mode,
    profile: {
      cohort: '202510',
      entryPlan: 'isia-2025',
      applicablePlan: 'isia-2025',
      transition: 'direct'
    },
    attempts: [],
    recognitions: [],
    scenarios: [],
    updatedAt
  }
}

export function newScenario(name = 'Mi próximo ciclo'): Scenario {
  return {
    id: crypto.randomUUID(),
    name,
    planId: 'isia-2025',
    creditLimit: 20,
    courseLimit: 6,
    assumeInProgress: false,
    catalogVersion: catalog.version,
    periods: [{ period: '202710', courses: [] }]
  }
}

export function demoWorkspace(updatedAt?: string): Workspace {
  const data = emptyWorkspace('demo', updatedAt)

  data.profile = {
    cohort: '202510',
    entryPlan: 'isia-2025',
    applicablePlan: 'isia-2025',
    transition: 'direct'
  }
  data.attempts = catalog.courses
    .filter(c => c.cycle <= 2)
    .map(c => ({
      id: `demo:${c.code}`,
      planId: 'isia-2025',
      code: c.code,
      period: c.cycle === 1 ? '202510' : '202520',
      result: 'passed',
      originCredits: c.credits
    }))

  for (const c of catalog.courses.filter(c => c.cycle === 3))
    data.attempts.push({
      id: `demo:${c.code}`,
      planId: 'isia-2025',
      code: c.code,
      period: '202610',
      result:
        c.code === 'ICSI-671'
          ? 'in-progress'
          : c.code === 'CIEN-755'
            ? 'failed'
            : 'passed',
      originCredits: c.credits
    })

  return data
}

export function validateWorkspace(data: Workspace): string[] {
  const errors: string[] = []
  const attemptIds = new Set<string>(),
    attemptKeys = new Set<string>()

  for (const a of data.attempts) {
    const key = `${a.planId}:${a.code}:${a.period}`

    if (attemptIds.has(a.id) || attemptKeys.has(key))
      errors.push(`Intento duplicado: ${a.code}, ${a.period}.`)
    attemptIds.add(a.id)
    attemptKeys.add(key)
    const exists =
      a.planId === 'isia-2025'
        ? catalog.courses.some(c => c.code === a.code)
        : catalog.origins.some(c => c.code === a.code)

    if (!exists) errors.push(`Curso desconocido: ${a.planId} / ${a.code}.`)

    if (
      a.planId === 'isia-2025' &&
      a.originCredits !== null &&
      catalog.courses.find(c => c.code === a.code)?.credits !== a.originCredits
    )
      errors.push(
        `Los créditos de ${a.code} no corresponden a esta versión de ISIA.`
      )
  }

  if (new Set(data.scenarios.map(s => s.id)).size !== data.scenarios.length)
    errors.push('Identificadores de escenarios duplicados.')

  for (const s of data.scenarios) {
    if (new Set(s.periods.map(p => p.period)).size !== s.periods.length)
      errors.push(`Periodos duplicados en ${s.name}.`)

    for (const p of s.periods) {
      if (new Set(p.courses).size !== p.courses.length)
        errors.push(`Cursos duplicados en ${s.name}, ${p.period}.`)

      if (p.courses.some(code => !catalog.courses.some(c => c.code === code)))
        errors.push(`Curso de escenario desconocido en ${s.name}.`)
    }
  }

  const recognizedIds = new Set<string>()

  for (const r of data.recognitions) {
    if (recognizedIds.has(r.equivalenceId))
      errors.push('Reconocimiento duplicado.')
    recognizedIds.add(r.equivalenceId)

    if (!catalog.equivalences.some(e => e.id === r.equivalenceId))
      errors.push('Correspondencia desconocida en reconocimiento.')
  }

  return errors
}

export function parseWorkspace(raw: string): Workspace {
  if (raw.length > 2_000_000)
    throw new Error('El archivo supera el límite de 2 MB.')
  const data = workspaceSchema.parse(JSON.parse(raw))
  const errors = validateWorkspace(data)

  if (errors.length) throw new Error(errors.join(' '))

  return data
}

export type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function readWorkspace(
  store: Store,
  mode: Workspace['mode']
): { data: Workspace | null; error?: string; recovery?: Workspace } {
  try {
    const raw = store.getItem(storageKey(mode))

    if (!raw) return { data: null }
    const data = parseWorkspace(raw)

    if (data.mode !== mode)
      throw new Error(
        'El espacio guardado no corresponde al perfil solicitado.'
      )

    return { data }
  } catch {
    let recovery: Workspace | undefined

    try {
      const raw = store.getItem(storageKey(mode) + ':previous')

      if (raw) {
        const candidate = parseWorkspace(raw)

        if (candidate.mode === mode) recovery = candidate
      }
    } catch {
      /* Keep original untouched for download/recovery. */
    }

    return {
      data: null,
      error:
        'No se pudo leer el espacio local. Puede estar dañado o el almacenamiento estar restringido. El original no se ha sobrescrito.',
      recovery
    }
  }
}

export function saveWorkspace(store: Store, data: Workspace) {
  const checked = parseWorkspace(JSON.stringify(data))
  const key = storageKey(data.mode)
  const previous = store.getItem(key)

  // Only retain a valid previous state; corrupt primary data is never promoted.
  if (previous) {
    parseWorkspace(previous)
    store.setItem(key + ':previous', previous)
  }

  store.setItem(key, JSON.stringify(checked))
}

export function clearWorkspace(store: Store, mode: Workspace['mode']) {
  store.removeItem(storageKey(mode))
  store.removeItem(storageKey(mode) + ':previous')
}

export function parseBackup(raw: string): Workspace {
  if (raw.length > 2_000_000)
    throw new Error('El respaldo supera el límite de 2 MB.')
  const parsed = backupSchema.parse(JSON.parse(raw))

  return parseWorkspace(JSON.stringify(parsed.data))
}

export function backup(data: Workspace) {
  return JSON.stringify({ format: 'rutacreditos', version: 1, data }, null, 2)
}

// Resolve the browser storage getter inside the guarded operation, including
// browsers where access to window.localStorage itself raises SecurityError.
export const browserStore: Store = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: key => window.localStorage.removeItem(key)
}
