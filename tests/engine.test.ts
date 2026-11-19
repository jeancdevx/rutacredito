import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  account,
  courseStatus,
  evaluate,
  simulate,
  suggest,
  validateCatalog
} from '@/helpers/academic.helpers'
import type { Context } from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'
import { emptyWorkspace, newScenario } from '@/helpers/storage.helpers'
import type {
  Catalog,
  Course,
  Rule,
  Workspace
} from '@/helpers/validation.helpers'

const source = [{ sourceId: 'synthetic', location: 'Fixture sintético' }]
const course = (
  code: string,
  prerequisite: Rule = { kind: 'none' },
  credits = 4,
  cycle = 1
): Course => ({
  id: code,
  planId: 'isia-2025',
  code,
  originalCode: code,
  name: `Curso sintético ${code}`,
  cycle,
  credits,
  required: true,
  electiveGroup: null,
  row: 1,
  prerequisite,
  sources: { all: source }
})

function fixture(courses: Course[]): Catalog {
  return {
    ...structuredClone(catalog),
    courses,
    plans: [
      {
        ...catalog.plans[0],
        groups: [],
        sources: ['synthetic'],
        totalCredits: courses.reduce((n, c) => n + c.credits, 0)
      }
    ],
    origins: [],
    equivalences: [],
    sources: [
      {
        id: 'synthetic',
        title: 'Sintético',
        version: '1',
        scope: 'Prueba',
        sha256: ''
      }
    ],
    issues: []
  }
}

const ctx = (passed: string[] = [], courses: Course[] = []): Context => ({
  passed: new Set(passed),
  originCredits: 0,
  recognizedCredits: 0,
  originComplete: true,
  courses
})
const pass = (course: string): Rule => ({ kind: 'pass', course })

function add(
  data: Workspace,
  code: string,
  result: 'passed' | 'in-progress' | 'failed' = 'passed',
  period = '202610',
  originCredits: number | null = 4,
  planId: 'isia-2025' | 'icsi-2022' = 'isia-2025'
) {
  data.attempts.push({
    id: `${planId}:${code}:${period}`,
    planId,
    code,
    period,
    result,
    originCredits
  })
}

test('AND/OR, ausencia explícita y desconocida respetan tres valores', () => {
  assert.equal(evaluate({ kind: 'none' }, ctx()).verdict, 'cumple')
  const unknown: Rule = {
    kind: 'unknown',
    reason: 'Contradicción documental',
    references: []
  }

  assert.equal(evaluate(unknown, ctx()).verdict, 'no verificable')
  assert.equal(
    evaluate(
      { kind: 'and', rules: [pass('SINT-101'), pass('SINT-102')] },
      ctx(['SINT-101'])
    ).verdict,
    'no cumple'
  )
  assert.equal(
    evaluate(
      { kind: 'and', rules: [pass('SINT-101'), unknown] },
      ctx(['SINT-101'])
    ).verdict,
    'no verificable'
  )
  assert.equal(
    evaluate(
      { kind: 'or', rules: [pass('SINT-101'), unknown] },
      ctx(['SINT-101'])
    ).verdict,
    'cumple'
  )
  assert.equal(
    evaluate({ kind: 'or', rules: [pass('SINT-101'), unknown] }, ctx()).verdict,
    'no verificable'
  )
  assert.equal(
    evaluate({ kind: 'or', rules: [pass('SINT-101'), pass('SINT-102')] }, ctx())
      .verdict,
    'no cumple'
  )
})
test('curso en progreso o desaprobado no habilita dependiente', () => {
  const a = course('SINT-101'),
    b = course('SINT-102', pass(a.code)),
    cat = fixture([a, b])

  for (const result of ['in-progress', 'failed'] as const) {
    const data = emptyWorkspace()

    add(data, a.code, result)
    assert.equal(courseStatus(b, data, cat).status, 'blocked')
  }
})
test('mismo periodo no satisface requisitos; periodo anterior sí, condicionalmente', () => {
  const a = course('SINT-101'),
    b = course('SINT-102', pass(a.code)),
    cat = fixture([a, b]),
    data = emptyWorkspace(),
    s = newScenario()

  s.catalogVersion = cat.version
  s.periods = [{ period: '202710', courses: [a.code, b.code] }]
  assert.equal(simulate(s, data, cat).conflicts.length, 1)
  s.periods = [
    { period: '202710', courses: [a.code] },
    { period: '202720', courses: [b.code] }
  ]
  const result = simulate(s, data, cat)

  assert.equal(result.conflicts.length, 0)
  assert.equal(result.coveredCredits, 8)
  assert.equal(data.attempts.length, 0)
})
test('supuesto en curso solo de periodos anteriores, sin alterar historial', () => {
  const a = course('SINT-101'),
    b = course('SINT-102', pass(a.code)),
    cat = fixture([a, b]),
    data = emptyWorkspace(),
    s = newScenario()

  s.periods = [{ period: '202710', courses: [b.code] }]
  add(data, a.code, 'in-progress', '202620')
  assert.equal(simulate(s, data, cat).conflicts.length, 1)
  s.assumeInProgress = true
  assert.equal(simulate(s, data, cat).conflicts.length, 0)
  data.attempts[0].period = '202710'
  assert.equal(simulate(s, data, cat).conflicts.length, 1)
  assert.equal(data.attempts[0].result, 'in-progress')
})
test('umbrales se evalúan al inicio; datos de origen desconocidos propagan incertidumbre', () => {
  const a = course('SINT-101'),
    b = course('SINT-102', {
      kind: 'credits',
      minimum: 4,
      basis: 'recognized'
    }),
    cat = fixture([a, b]),
    s = newScenario()

  s.periods = [{ period: '202710', courses: [a.code, b.code] }]
  assert.equal(simulate(s, emptyWorkspace(), cat).conflicts.length, 1)
  s.periods = [
    { period: '202710', courses: [a.code] },
    { period: '202720', courses: [b.code] }
  ]
  assert.equal(simulate(s, emptyWorkspace(), cat).conflicts.length, 0)
  assert.equal(
    evaluate(
      { kind: 'credits', minimum: 4, basis: 'origin' },
      { ...ctx(), originComplete: false }
    ).verdict,
    'no verificable'
  )
})
test('conjuntos y ciclos completos usan pertenencia explícita, no comparación numérica', () => {
  const courses = [
    course('SINT-101'),
    course('SINT-102', undefined, 4, 2),
    course('SINT-103', undefined, 4, 2)
  ]

  assert.equal(
    evaluate(
      { kind: 'set', courses: ['SINT-101', 'SINT-103'] },
      ctx(['SINT-101', 'SINT-102'], courses)
    ).verdict,
    'no cumple'
  )
  assert.equal(
    evaluate(
      { kind: 'cycles', cycles: [2] },
      ctx(['SINT-102', 'SINT-103'], courses)
    ).verdict,
    'cumple'
  )
  assert.equal(
    evaluate(
      { kind: 'cycles', cycles: [2] },
      ctx(['SINT-101', 'SINT-102'], courses)
    ).verdict,
    'no cumple'
  )
})
test('electivos: cupos de grupo, sin sumar todas las opciones ni superar 100%', () => {
  const data = emptyWorkspace()

  for (const c of catalog.courses)
    add(data, c.code, 'passed', '202610', c.credits)
  const result = account(data, catalog)

  assert.equal(result.recognizedCredits, 205)
  assert.equal(result.percent, 100)
  assert.deepEqual(
    result.groups.map(g => g.earned),
    [4, 4]
  )
})
test('repeticiones no duplican; reconocimiento conserva créditos origen y usa destino', () => {
  const a = course('SINT-101', undefined, 4),
    cat = fixture([a]),
    data = emptyWorkspace()

  cat.origins = [
    {
      planId: 'icsi-2022',
      code: 'ORIG-101',
      name: 'Origen sintético',
      credits: 2,
      evidence: source
    }
  ]
  cat.equivalences = [
    {
      id: 'eq',
      fromPlan: 'icsi-2022',
      toPlan: 'isia-2025',
      from: ['ORIG-101'],
      to: [a.code],
      type: 'correspondence',
      verification: 'documented',
      conditions: 'Declaración',
      evidence: source
    }
  ]
  data.profile = {
    cohort: '202310',
    entryPlan: 'icsi-2022',
    applicablePlan: 'isia-2025',
    transition: 'transition'
  }
  add(data, 'ORIG-101', 'passed', '202610', 2, 'icsi-2022')
  add(data, 'ORIG-101', 'passed', '202620', 2, 'icsi-2022')
  assert.equal(account(data, cat).recognizedCredits, 0)
  data.recognitions = [
    { id: 'r', equivalenceId: 'eq', note: 'Documento individual sintético' }
  ]
  add(data, a.code)
  assert.equal(account(data, cat).historyCredits, 2)
  assert.equal(account(data, cat).recognizedCredits, 4)
  assert.equal(account(data, cat).originCredits, 2)
})
test('equivalencias de conjunto exigen todos los orígenes; destino deduplicado', () => {
  const cat = fixture([course('SINT-101'), course('SINT-102')]),
    data = emptyWorkspace()

  cat.equivalences = [
    {
      id: 'many',
      fromPlan: 'icsi-2022',
      toPlan: 'isia-2025',
      from: ['ORIG-101', 'ORIG-102'],
      to: ['SINT-101', 'SINT-102'],
      type: 'set',
      verification: 'documented',
      conditions: 'Todos',
      evidence: source
    }
  ]
  data.recognitions = [{ id: 'r', equivalenceId: 'many', note: 'Sintético' }]
  add(data, 'ORIG-101', 'passed', '202610', 2, 'icsi-2022')
  assert.equal(account(data, cat).recognizedCredits, 0)
  add(data, 'ORIG-102', 'passed', '202610', 2, 'icsi-2022')
  assert.equal(account(data, cat).recognizedCredits, 8)
})
test('contradicción y ausencia no resueltas del catálogo real nunca producen disponible', () => {
  const data = emptyWorkspace()

  for (const c of catalog.courses)
    if (c.code !== 'ISIA-106' && c.code !== 'ISIA-123')
      add(data, c.code, 'passed', '202610', c.credits)
  assert.equal(
    courseStatus(
      catalog.courses.find(c => c.code === 'ISIA-106')!,
      data,
      catalog
    ).status,
    'unknown'
  )
  assert.equal(
    courseStatus(
      catalog.courses.find(c => c.code === 'ISIA-123')!,
      data,
      catalog
    ).status,
    'unknown'
  )
  assert.equal(
    evaluate(
      catalog.courses.find(c => c.code === 'ISIA-134')!.prerequisite,
      account(data, catalog).context
    ).verdict,
    'no cumple'
  )
})
test('editar historial y cambiar catálogo revalida escenarios; sugerencia estable y acotada', () => {
  const a = course('SINT-101'),
    b = course('SINT-102', pass(a.code)),
    cat = fixture([a, b]),
    data = emptyWorkspace(),
    s = newScenario()

  s.periods = [{ period: '202710', courses: [b.code] }]
  add(data, a.code)
  assert.equal(simulate(s, data, cat).conflicts.length, 0)
  data.attempts[0].result = 'failed'
  assert.equal(simulate(s, data, cat).conflicts.length, 1)
  cat.version = '2'
  assert.ok(
    simulate(s, data, cat).warnings.some(w => w.includes('catálogo cambió'))
  )
  s.creditLimit = 4
  s.courseLimit = 1
  s.periods[0].courses = []
  assert.deepEqual(suggest(s, data, cat, 0), [a.code])
  assert.deepEqual(suggest(s, data, cat, 0), [a.code])
})
test('validador preserva y detecta ciclos, referencias, duplicados, créditos y grupos', () => {
  assert.deepEqual(validateCatalog(catalog), [])
  const cat = fixture([
    course('SINT-101', pass('SINT-102')),
    course('SINT-102', pass('SINT-101'))
  ])

  assert.ok(validateCatalog(cat).some(e => e.includes('Ciclo de dependencias')))
  cat.courses[0].prerequisite = pass('VOID-999')
  assert.ok(validateCatalog(cat).some(e => e.includes('inexistente')))
  cat.courses[0].credits = -4
  assert.ok(validateCatalog(cat).some(e => e.includes('Créditos inválidos')))
  cat.courses.push({ ...cat.courses[1] })
  assert.ok(validateCatalog(cat).some(e => e.includes('duplicados')))
  cat.courses[0].electiveGroup = 'ghost'
  assert.ok(validateCatalog(cat).some(e => e.includes('Grupo inexistente')))
})

test('aprobar versiones correspondientes en ambos planes no duplica historial, aun sin declaración', () => {
  const data = emptyWorkspace()

  add(data, 'CIEN-397', 'passed', '202310', 4, 'icsi-2022')
  add(data, 'CIEN-753', 'passed', '202510', 4)
  assert.equal(account(data, catalog).historyCredits, 4)
  assert.equal(account(data, catalog).recognizedCredits, 4)
  const noTarget = {
    ...data,
    attempts: data.attempts.filter(a => a.planId === 'icsi-2022')
  }

  assert.equal(account(noTarget, catalog).recognizedCredits, 0)
})

test('cambio de plan sintético conserva historial y obliga a revalidar escenarios', () => {
  const a = course('SINT-101'),
    cat = fixture([a]),
    data = emptyWorkspace(),
    scenario = newScenario()

  cat.plans.push({
    ...cat.plans[0],
    id: 'synthetic-alternate',
    totalCredits: 3
  })
  cat.courses.push({
    ...course('SINT-102'),
    id: 'alternate:SINT-102',
    planId: 'synthetic-alternate',
    credits: 3
  })
  add(data, a.code)
  scenario.periods = [{ period: '202710', courses: [a.code] }]
  const changed = {
    ...data,
    profile: { ...data.profile, applicablePlan: 'synthetic-alternate' }
  } as unknown as Workspace

  assert.equal(account(changed, cat).recognizedCredits, 0)
  assert.equal(account(changed, cat).historyCredits, 4)
  assert.ok(
    simulate(scenario, changed, cat).warnings.some(w =>
      w.includes('plan cambió')
    )
  )
  assert.equal(changed.attempts, data.attempts)
})
