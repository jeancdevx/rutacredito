import type {
  Attempt,
  Catalog,
  Course,
  Evidence,
  Rule,
  Scenario,
  Workspace
} from './validation.helpers'

export type Verdict = 'cumple' | 'no cumple' | 'no verificable'

export type Evaluation = {
  verdict: Verdict
  reasons: string[]
  evidence: Evidence[]
}

export type Context = {
  passed: Set<string>
  originCredits: number
  recognizedCredits: number
  originComplete: boolean
  courses: Course[]
}

export type Status =
  | 'passed'
  | 'in-progress'
  | 'available'
  | 'blocked'
  | 'unknown'

export const statusLabels: Record<Status, string> = {
  passed: 'Aprobado',
  'in-progress': 'En curso',
  available: 'Disponible',
  blocked: 'Bloqueado',
  unknown: 'Por verificar'
}

export function normalizePeriod(input: string): string {
  const cleaned = input.trim().replace(/[\s–—-]+/g, '')

  return cleaned
}

export function formatPeriod(period: string): string {
  return /^20\d{2}(10|20|30)$/.test(period)
    ? `${period.slice(0, 4)}-${period.slice(4)}`
    : period
}

export function currentRegularPeriod(now = new Date()): string {
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  return month <= 7 ? `${year}10` : `${year}20`
}

export function nextRegularPeriod(period: string): string {
  const normalized = normalizePeriod(period)

  if (!/^20\d{2}(10|20|30)$/.test(normalized)) return '202710'
  const year = Number(normalized.slice(0, 4))
  const term = normalized.slice(4)

  return term === '10' ? `${year}20` : `${year + 1}10`
}

export function estimateAcademicCycle(
  cohort: string,
  referencePeriod = currentRegularPeriod()
): number {
  const start = normalizePeriod(cohort)
  const ref = normalizePeriod(referencePeriod)

  if (!/^20\d{2}(10|20|30)$/.test(start) || !/^20\d{2}(10|20|30)$/.test(ref))
    return 1

  const startYear = Number(start.slice(0, 4))
  const startTerm = start.slice(4) === '10' ? 0 : 1
  const refYear = Number(ref.slice(0, 4))
  const refTerm = ref.slice(4) === '10' ? 0 : 1
  const diff = (refYear - startYear) * 2 + (refTerm - startTerm) + 1

  return Math.max(1, Math.min(10, diff))
}

export function inferNextPlanningPeriod(
  attempts: Attempt[],
  referencePeriod = currentRegularPeriod()
): string {
  const inProgressPeriods = attempts
    .filter(a => a.result === 'in-progress')
    .map(a => a.period)
    .sort()

  if (inProgressPeriods.length)
    return nextRegularPeriod(inProgressPeriods.at(-1)!)

  const allPeriods = attempts.map(a => a.period).sort()

  if (allPeriods.length) return nextRegularPeriod(allPeriods.at(-1)!)

  return nextRegularPeriod(referencePeriod)
}

export function applyDocumentedRecognitions(
  data: Workspace,
  cat: Catalog,
  options: { includePending?: boolean } = {}
): {
  recognitions: Workspace['recognitions']
  added: number
} {
  const progress = account(data, cat)
  const existingIds = new Set(data.recognitions.map(r => r.equivalenceId))
  const coveredTargets = new Set<string>(progress.passed)
  const additions: Workspace['recognitions'] = []
  const ordered = [...progress.pendingRecognition].sort(
    (a, b) =>
      Number(b.verification === 'documented') -
        Number(a.verification === 'documented') ||
      Number(b.id.startsWith('eq2022:')) - Number(a.id.startsWith('eq2022:'))
  )

  for (const eq of ordered) {
    if (existingIds.has(eq.id)) continue

    if (!options.includePending && eq.verification !== 'documented') continue

    if (eq.to.every(code => coveredTargets.has(code))) continue

    additions.push({
      id: crypto.randomUUID(),
      equivalenceId: eq.id,
      note:
        eq.verification === 'documented'
          ? 'Correspondencia documentada ICSI 2022 → ISIA 2025 aplicada por el estudiante para planificación personal.'
          : 'Correspondencia ICSI 2022 → ISIA 2025 (Codificación ISIA-2025 / Instrumento) confirmada para planificación personal.'
    })
    existingIds.add(eq.id)

    for (const code of eq.to) coveredTargets.add(code)
  }

  return {
    recognitions: [...data.recognitions, ...additions],
    added: additions.length
  }
}

export function suggestAllPeriods(
  scenario: Scenario,
  data: Workspace,
  cat: Catalog
): Scenario {
  let current: Scenario = {
    ...scenario,
    periods: scenario.periods.map(p => ({ ...p, courses: [] }))
  }

  for (let i = 0; i < current.periods.length; i++) {
    const codes = suggest(current, data, cat, i)

    current = {
      ...current,
      periods: current.periods.map((p, idx) =>
        idx === i ? { ...p, courses: codes } : p
      )
    }
  }

  return current
}

export function buildAutoScenario(
  data: Workspace,
  cat: Catalog,
  options: {
    name?: string
    periodCount?: number
    creditLimit?: number
    courseLimit?: number
  } = {}
): Scenario {
  const firstPeriod = inferNextPlanningPeriod(data.attempts)
  const periodCount = Math.max(1, Math.min(6, options.periodCount ?? 2))
  const periods: Scenario['periods'] = []
  let p = firstPeriod

  for (let i = 0; i < periodCount; i++) {
    periods.push({ period: p, courses: [] })
    p = nextRegularPeriod(p)
  }

  const base: Scenario = {
    id: crypto.randomUUID(),
    name: options.name ?? `Ruta sugerida ${formatPeriod(firstPeriod)}`,
    planId: 'isia-2025',
    creditLimit: options.creditLimit ?? data.profile.preferredCredits ?? 20,
    courseLimit: options.courseLimit ?? 6,
    assumeInProgress: data.attempts.some(a => a.result === 'in-progress'),
    includeUnverified: true,
    catalogVersion: cat.version,
    periods
  }

  return suggestAllPeriods(base, data, cat)
}

export function references(rule: Rule): string[] {
  if (rule.kind === 'pass') return [rule.course]

  if (rule.kind === 'and' || rule.kind === 'or')
    return rule.rules.flatMap(references)

  if (rule.kind === 'set') return rule.courses

  if (rule.kind === 'unknown') return rule.references

  return []
}

export function evaluate(rule: Rule, ctx: Context): Evaluation {
  const evidence = rule.evidence ?? []
  const result = (verdict: Verdict, ...reasons: string[]): Evaluation => ({
    verdict,
    reasons,
    evidence
  })

  if (rule.kind === 'none')
    return result('cumple', 'La fuente indica explícitamente «Ninguno».')

  if (rule.kind === 'unknown') return result('no verificable', rule.reason)

  if (rule.kind === 'pass')
    return result(
      ctx.passed.has(rule.course) ? 'cumple' : 'no cumple',
      `${ctx.passed.has(rule.course) ? 'Aprobación registrada' : 'Falta aprobar'}: ${rule.course}.`
    )

  if (rule.kind === 'credits') {
    if (rule.basis === 'origin' && !ctx.originComplete)
      return result(
        'no verificable',
        'Hay créditos de origen sin verificar; no se puede evaluar el umbral.'
      )
    const credits =
      rule.basis === 'origin' ? ctx.originCredits : ctx.recognizedCredits

    return result(
      credits >= rule.minimum ? 'cumple' : 'no cumple',
      `Al inicio del periodo: ${credits} de ${rule.minimum} créditos ${rule.basis === 'origin' ? 'de origen' : 'reconocidos'}.`
    )
  }

  if (rule.kind === 'set' || rule.kind === 'cycles') {
    const codes =
      rule.kind === 'set'
        ? rule.courses
        : ctx.courses
            .filter(c => c.required && rule.cycles.includes(c.cycle))
            .map(c => c.code)

    if (!codes.length)
      return result(
        'no verificable',
        'El conjunto requerido no está definido en el catálogo.'
      )
    const missing = codes.filter(c => !ctx.passed.has(c))

    return result(
      missing.length ? 'no cumple' : 'cumple',
      missing.length
        ? `Falta completar el conjunto: ${missing.join(', ')}.`
        : 'Conjunto completo aprobado.'
    )
  }

  const children = rule.rules.map(r => evaluate(r, ctx))
  const verdict: Verdict =
    rule.kind === 'and'
      ? children.some(r => r.verdict === 'no cumple')
        ? 'no cumple'
        : children.some(r => r.verdict === 'no verificable')
          ? 'no verificable'
          : 'cumple'
      : children.some(r => r.verdict === 'cumple')
        ? 'cumple'
        : children.some(r => r.verdict === 'no verificable')
          ? 'no verificable'
          : 'no cumple'

  return {
    verdict,
    reasons: [
      `${rule.kind === 'and' ? 'Se requieren todas las condiciones' : 'Basta una de las condiciones'}.`,
      ...children.flatMap(c => c.reasons)
    ],
    evidence: [...evidence, ...children.flatMap(c => c.evidence)]
  }
}

export function uniquePassed(attempts: Attempt[]) {
  const byCourse = new Map<string, Attempt>()

  for (const attempt of [...attempts].sort((a, b) =>
    a.period.localeCompare(b.period)
  )) {
    const key = `${attempt.planId}:${attempt.code}`

    if (attempt.result === 'passed' && !byCourse.has(key))
      byCourse.set(key, attempt)
  }

  return [...byCourse.values()]
}

export function account(data: Workspace, cat: Catalog, before?: string) {
  const attempts = before
    ? data.attempts.filter(a => a.period < before)
    : data.attempts
  const approved = uniquePassed(attempts)
  const direct = approved.filter(a => a.planId === data.profile.applicablePlan)
  const passed = new Set(direct.map(a => a.code))
  const eqs = data.recognitions.flatMap(r => {
    const eq = cat.equivalences.find(
      e => e.id === r.equivalenceId && e.toPlan === data.profile.applicablePlan
    )

    return eq &&
      eq.from.every(code =>
        approved.some(a => a.code === code && a.planId === eq.fromPlan)
      )
      ? [eq]
      : []
  })

  for (const eq of eqs) for (const code of eq.to) passed.add(code)
  const courses = cat.courses.filter(
    c => c.planId === data.profile.applicablePlan
  )
  const requiredCredits = courses
    .filter(c => c.required && passed.has(c.code))
    .reduce((n, c) => n + c.credits, 0)
  const plan = cat.plans.find(p => p.id === data.profile.applicablePlan)!
  const groups = plan.groups.map(g => {
    const completed = courses.filter(
      c => c.electiveGroup === g.id && passed.has(c.code)
    )

    return {
      ...g,
      completed: completed.map(c => c.code),
      earned: Math.min(completed.length, g.slots) * g.creditsPerSlot,
      remaining: Math.max(0, g.slots - completed.length)
    }
  })
  const recognizedCredits =
    requiredCredits + groups.reduce((n, g) => n + g.earned, 0)
  // A target already recognized from an approved origin must not add history
  // credits a second time. Documented alias grouping affects history accounting
  // only; destination recognition still requires a direct approval or declaration.
  // Original source credits are never replaced by target.
  const historyCorrespondences = cat.equivalences.filter(
    e =>
      e.verification === 'documented' &&
      e.from.every(code =>
        approved.some(a => a.planId === e.fromPlan && a.code === code)
      )
  )
  const duplicateTargets = new Set(
    [...eqs, ...historyCorrespondences].flatMap(e =>
      e.to.map(code => `${e.toPlan}:${code}`)
    )
  )
  const historyUnique = approved.filter(
    a => !duplicateTargets.has(`${a.planId}:${a.code}`)
  )
  const historyCredits = historyUnique.reduce(
    (n, a) => n + (a.originCredits ?? 0),
    0
  )
  const originApproved = approved.filter(
    a => a.planId === data.profile.entryPlan
  )
  const originCredits = originApproved.reduce(
    (n, a) => n + (a.originCredits ?? 0),
    0
  )
  const originComplete = originApproved.every(a => a.originCredits !== null)
  const inProgress = new Map<string, Attempt>()

  for (const a of attempts)
    if (
      a.result === 'in-progress' &&
      !approved.some(p => p.planId === a.planId && p.code === a.code)
    )
      inProgress.set(`${a.planId}:${a.code}`, a)
  const context: Context = {
    passed,
    recognizedCredits,
    originCredits,
    originComplete,
    courses
  }

  return {
    passed,
    recognizedCredits,
    historyCredits,
    historyUnknown: historyUnique.filter(a => a.originCredits === null).length,
    originCredits,
    originComplete,
    groups,
    inProgressCredits: [...inProgress.values()].reduce(
      (n, a) => n + (a.originCredits ?? 0),
      0
    ),
    pendingRecognition: cat.equivalences.filter(
      e =>
        e.toPlan === plan.id &&
        e.from.every(code =>
          approved.some(a => a.planId === e.fromPlan && a.code === code)
        ) &&
        !e.to.every(c => passed.has(c))
    ),
    requiredRemaining: courses.filter(c => c.required && !passed.has(c.code)),
    percent: (recognizedCredits / plan.totalCredits) * 100,
    context
  }
}

export function courseStatus(
  course: Course,
  data: Workspace,
  cat: Catalog,
  ctx?: Context
): { status: Status; evaluation: Evaluation } {
  const context = ctx ?? account(data, cat).context
  const evaluation = evaluate(course.prerequisite, context)

  if (context.passed.has(course.code))
    return {
      status: 'passed',
      evaluation: {
        verdict: 'cumple',
        reasons: [
          'Aprobación o reconocimiento individual registrado. No necesitas volver a llevarlo en este plan.'
        ],
        evidence: evaluation.evidence
      }
    }

  if (
    data.attempts.some(
      a =>
        a.planId === course.planId &&
        a.code === course.code &&
        a.result === 'in-progress'
    )
  )
    return {
      status: 'in-progress',
      evaluation: {
        ...evaluation,
        reasons: [
          'En curso no cuenta como aprobado ni habilita dependientes.',
          ...evaluation.reasons
        ]
      }
    }

  return {
    status:
      evaluation.verdict === 'cumple'
        ? 'available'
        : evaluation.verdict === 'no cumple'
          ? 'blocked'
          : 'unknown',
    evaluation
  }
}

export function isProvisionallyEligible(course: Course, ctx: Context): boolean {
  const verdict = evaluate(course.prerequisite, ctx).verdict

  if (verdict === 'cumple') return true

  if (verdict === 'no cumple') return false

  if (course.prerequisite.kind !== 'unknown') return false

  // Conflict rule (e.g. AC-01 ISIA-106): require at least one referenced prerequisite.
  if (course.prerequisite.references.length > 0)
    return course.prerequisite.references.some(ref => ctx.passed.has(ref))

  // "Todo octavo ciclo" (AC-03): require mandatory courses through cycle 8.
  if (course.prerequisite.reason.includes('AC-03'))
    return ctx.courses
      .filter(c => c.required && c.cycle <= 8)
      .every(c => ctx.passed.has(c.code))

  // Cycle X electives: unlock once mandatory courses through cycle 7 are completed
  // (or at least 60% of mandatory courses in the plan).
  if (course.electiveGroup) {
    const upTo7 = ctx.courses.filter(c => c.required && c.cycle <= 7)

    if (upTo7.length > 0 && upTo7.every(c => ctx.passed.has(c.code)))
      return true

    const mandatory = ctx.courses.filter(c => c.required)
    const passedMandatory = mandatory.filter(c => ctx.passed.has(c.code)).length

    return mandatory.length > 0 && passedMandatory / mandatory.length >= 0.7
  }

  // Blank prerequisite cell (AC-10): allow once the student has reached that
  // course's cycle (passed at least one course from cycle - 1 or higher, or cycle <= 2).
  if (course.cycle <= 2) return true

  return ctx.courses.some(
    c => c.cycle >= course.cycle - 1 && ctx.passed.has(c.code)
  )
}

export function simulate(scenario: Scenario, data: Workspace, cat: Catalog) {
  const warnings: string[] = []

  if (scenario.planId !== data.profile.applicablePlan)
    warnings.push('El plan cambió: revisa la compatibilidad del escenario.')

  if (scenario.catalogVersion !== cat.version)
    warnings.push(
      'El catálogo cambió. Escenario recalculado con las reglas actuales.'
    )
  const sorted = [...scenario.periods].sort((a, b) =>
    a.period.localeCompare(b.period)
  )
  const simulated: Attempt[] = []
  const initial = account(data, cat, sorted[0]?.period)
  const initialAvailable = new Set(
    cat.courses
      .filter(
        c =>
          !initial.passed.has(c.code) &&
          (scenario.includeUnverified
            ? isProvisionallyEligible(c, initial.context)
            : evaluate(c.prerequisite, initial.context).verdict === 'cumple')
      )
      .map(c => c.code)
  )
  const periods = sorted.map((p, index) => {
    const duplicatePeriod = sorted.some(
      (other, i) => i < index && other.period === p.period
    )
    const historical: Workspace = {
      ...data,
      attempts: data.attempts.filter(a => a.period < p.period),
      recognitions: data.recognitions
    }

    if (scenario.assumeInProgress)
      historical.attempts = historical.attempts.map(a =>
        a.result === 'in-progress' ? { ...a, result: 'passed' } : a
      )
    const start = account(
      { ...historical, attempts: [...historical.attempts, ...simulated] },
      cat
    )
    const selected = new Set<string>()
    const items = p.courses.map(code => {
      const course = cat.courses.find(
        c => c.code === code && c.planId === scenario.planId
      )
      const duplicate = selected.has(code)

      selected.add(code)
      const evaluation = course
        ? evaluate(course.prerequisite, start.context)
        : {
            verdict: 'no verificable' as Verdict,
            reasons: ['Curso ausente del catálogo actual.'],
            evidence: []
          }
      const provisional = Boolean(
        scenario.includeUnverified &&
        course &&
        evaluation.verdict === 'no verificable' &&
        isProvisionallyEligible(course, start.context)
      )
      const conflicts = duplicatePeriod
        ? ['Periodo duplicado.']
        : duplicate
          ? ['Curso duplicado en el periodo.']
          : start.passed.has(code)
            ? ['Ya aprobado o reconocido al inicio del periodo.']
            : evaluation.verdict !== 'cumple' && !provisional
              ? evaluation.reasons
              : []

      return { code, course, evaluation, provisional, conflicts }
    })
    const credits = items.reduce((n, i) => n + (i.course?.credits ?? 0), 0)
    const periodWarnings = [
      ...(credits > scenario.creditLimit
        ? [
            `Carga ${credits}: supera tu preferencia de ${scenario.creditLimit} créditos.`
          ]
        : []),
      ...(items.length > scenario.courseLimit
        ? [`Supera tu preferencia de ${scenario.courseLimit} cursos.`]
        : [])
    ]

    const plan = cat.plans.find(plan => plan.id === scenario.planId)

    for (const group of plan?.groups ?? []) {
      const completed = cat.courses.filter(
        c => c.electiveGroup === group.id && start.passed.has(c.code)
      ).length
      const added = items.filter(
        i => i.course?.electiveGroup === group.id
      ).length

      if (completed + added > group.slots)
        periodWarnings.push(
          `${group.name}: solo ${group.slots} cupo de requisito. Las opciones adicionales no aumentan el avance reconocido.`
        )
    }

    if (data.attempts.some(a => a.period >= p.period))
      periodWarnings.push(
        'Existen intentos del historial en este periodo o posteriores. Solo se usa lo aprobado antes del inicio.'
      )
    const eligible = items.filter(i => !i.conflicts.length)

    // Evaluate every item against the same start context. Never sequentially
    // unlock courses selected within the same period.
    if (!duplicatePeriod)
      for (const item of eligible)
        if (item.course)
          simulated.push({
            id: `sim:${index}:${item.code}`,
            planId: scenario.planId,
            code: item.code,
            period: p.period,
            result: 'passed',
            originCredits: item.course.credits
          })

    return {
      period: p.period,
      credits,
      items,
      warnings: periodWarnings,
      context: start.context
    }
  })
  const last = sorted.at(-1)?.period ?? '209910'
  const finalData: Workspace = {
    ...data,
    attempts: [
      ...data.attempts
        .filter(a => a.period < last)
        .map(a =>
          scenario.assumeInProgress && a.result === 'in-progress'
            ? { ...a, result: 'passed' as const }
            : a
        ),
      ...simulated
    ]
  }
  const final = account(finalData, cat)
  const unlocked = cat.courses.filter(
    c =>
      !final.passed.has(c.code) &&
      !initialAvailable.has(c.code) &&
      (scenario.includeUnverified
        ? isProvisionallyEligible(c, final.context)
        : evaluate(c.prerequisite, final.context).verdict === 'cumple')
  )
  const conflicts = periods.flatMap(p => p.items.flatMap(i => i.conflicts))
  const stalled = cat.courses.filter(
    c =>
      !final.passed.has(c.code) &&
      evaluate(c.prerequisite, final.context).verdict === 'no verificable'
  )

  if (stalled.length && !scenario.includeUnverified)
    warnings.push(
      `${stalled.length} asignaturas tienen reglas sin verificar; esas ramas no se sugieren.`
    )
  else if (periods.some(p => p.items.some(i => i.provisional)))
    warnings.push(
      'Este escenario incluye cursos con casilla de prerrequisito vacía o por confirmar en el PDF; verifícalos en matrícula.'
    )

  return {
    periods,
    warnings,
    conflicts,
    unlocked,
    coveredCredits: final.recognizedCredits - initial.recognizedCredits,
    recognizedCredits: final.recognizedCredits,
    stalled
  }
}

export function suggest(
  scenario: Scenario,
  data: Workspace,
  cat: Catalog,
  periodIndex: number
) {
  const evaluation = simulate(scenario, data, cat)
  const ctx = evaluation.periods[periodIndex]?.context

  if (!ctx) return []
  const plan = cat.plans.find(p => p.id === scenario.planId)!
  const selected: string[] = []
  let credits = 0
  const ordered = cat.courses
    .filter(
      c =>
        c.planId === scenario.planId &&
        !ctx.passed.has(c.code) &&
        (scenario.includeUnverified
          ? isProvisionallyEligible(c, ctx)
          : evaluate(c.prerequisite, ctx).verdict === 'cumple')
    )
    .map(c => ({
      course: c,
      unlocks: cat.courses.filter(d =>
        references(d.prerequisite).includes(c.code)
      ).length
    }))
    .sort(
      (a, b) =>
        Number(b.course.required) - Number(a.course.required) ||
        a.course.cycle - b.course.cycle ||
        b.unlocks - a.unlocks ||
        a.course.code.localeCompare(b.course.code)
    )

  for (const { course } of ordered) {
    if (selected.length >= scenario.courseLimit) break

    if (credits + course.credits > scenario.creditLimit) continue

    if (course.electiveGroup) {
      const group = plan.groups.find(g => g.id === course.electiveGroup)
      const used = cat.courses.filter(
        c =>
          c.electiveGroup === course.electiveGroup &&
          (ctx.passed.has(c.code) || selected.includes(c.code))
      ).length

      if (!group || used >= group.slots) continue
    }

    selected.push(course.code)
    credits += course.credits
  }

  return selected
}

export function validateCatalog(cat: Catalog): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const sources = new Set(cat.sources.map(s => s.id))
  const allEvidence: Evidence[] = []

  for (const plan of cat.plans) {
    const courses = cat.courses.filter(c => c.planId === plan.id)
    const codes = new Set(courses.map(c => c.code))

    if (codes.size !== courses.length)
      errors.push(`${plan.id}: códigos duplicados`)
    const groups = new Set(plan.groups.map(g => g.id))

    if (groups.size !== plan.groups.length)
      errors.push(`${plan.id}: grupos duplicados`)

    for (const c of courses) {
      if (ids.has(c.id)) errors.push(`ID duplicado: ${c.id}`)
      ids.add(c.id)

      if (!Number.isFinite(c.credits) || c.credits <= 0)
        errors.push(`Créditos inválidos: ${c.code}`)

      if (c.required === Boolean(c.electiveGroup))
        errors.push(`Condición/grupo incoherente: ${c.code}`)

      if (c.electiveGroup && !groups.has(c.electiveGroup))
        errors.push(`Grupo inexistente: ${c.code}`)

      for (const ref of references(c.prerequisite))
        if (!codes.has(ref))
          errors.push(`Referencia inexistente ${ref} en ${c.code}`)
      allEvidence.push(
        ...Object.values(c.sources).flat(),
        ...(c.prerequisite.evidence ?? [])
      )
    }

    for (const g of plan.groups) {
      const options = courses.filter(c => c.electiveGroup === g.id)

      if (
        options.length < g.slots ||
        options.some(c => c.credits !== g.creditsPerSlot)
      )
        errors.push(`Cupo/créditos inconsistentes: ${g.id}`)
      allEvidence.push(...g.evidence)
    }

    const total =
      courses.filter(c => c.required).reduce((n, c) => n + c.credits, 0) +
      plan.groups.reduce((n, g) => n + g.slots * g.creditsPerSlot, 0)

    if (total !== plan.totalCredits)
      errors.push(`Total ${plan.id}: ${total} difiere de ${plan.totalCredits}`)
    const visit = (code: string, path: string[], done: Set<string>) => {
      if (path.includes(code)) {
        errors.push(`Ciclo de dependencias: ${[...path, code].join(' → ')}`)

        return
      }

      if (done.has(code)) return
      const course = courses.find(c => c.code === code)

      if (course)
        for (const ref of references(course.prerequisite))
          visit(ref, [...path, code], done)
      done.add(code)
    }

    const done = new Set<string>()

    for (const code of codes) visit(code, [], done)
  }

  const eqIds = new Set<string>()

  for (const eq of cat.equivalences) {
    if (eqIds.has(eq.id)) errors.push(`Equivalencia duplicada: ${eq.id}`)
    eqIds.add(eq.id)

    for (const from of eq.from)
      if (
        !cat.origins.some(c => c.planId === eq.fromPlan && c.code === from) &&
        !cat.courses.some(c => c.planId === eq.fromPlan && c.code === from)
      )
        errors.push(`Origen inexistente: ${from}`)

    for (const to of eq.to)
      if (!cat.courses.some(c => c.planId === eq.toPlan && c.code === to))
        errors.push(`Destino inexistente: ${to}`)
    allEvidence.push(...eq.evidence)
  }

  for (const e of allEvidence)
    if (!sources.has(e.sourceId))
      errors.push(`Fuente inexistente: ${e.sourceId}`)

  return [...new Set(errors)]
}
