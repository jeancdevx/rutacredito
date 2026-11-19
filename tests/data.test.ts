import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  applyDocumentedRecognitions,
  buildAutoScenario,
  estimateAcademicCycle,
  formatPeriod,
  inferNextPlanningPeriod,
  normalizePeriod
} from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'
import {
  backup,
  clearWorkspace,
  demoWorkspace,
  emptyWorkspace,
  parseBackup,
  parseWorkspace,
  readWorkspace,
  saveWorkspace,
  storageKey,
  validateWorkspace
} from '@/helpers/storage.helpers'
import {
  applyGradeThreshold,
  matriculaTextToCSV,
  mergeAttempts,
  parseCSV,
  parseXLSXBuffer,
  previewCSV,
  reportTextToCSV,
  resolveAmbiguousRows
} from '@/helpers/transfer.helpers'
import { profileSchema, scenarioSchema } from '@/helpers/validation.helpers'

function memory() {
  const map = new Map<string, string>()

  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    }
  }
}

test('JSON versionado valida estructura, referencias, duplicados y límites', () => {
  const data = demoWorkspace()

  assert.deepEqual(parseBackup(backup(data)), data)
  assert.throws(() => parseBackup('{"format":"rutacreditos","version":2}'))
  assert.throws(() => parseBackup('x'.repeat(2_000_001)))
  assert.throws(() => parseWorkspace('{broken'))
  data.attempts.push({ ...data.attempts[0], id: 'other' })
  assert.ok(validateWorkspace(data).length)
  assert.throws(() => parseWorkspace(JSON.stringify(data)))
})
test('recuperación de almacenamiento corrupto no sobrescribe original y separa demo', () => {
  const store = memory(),
    personal = emptyWorkspace(),
    demo = demoWorkspace()

  saveWorkspace(store, personal)
  saveWorkspace(store, demo)
  const next = {
    ...personal,
    profile: { ...personal.profile, cohort: '202610' }
  }

  saveWorkspace(store, next)
  store.setItem(storageKey('personal'), '{corrupt')
  const result = readWorkspace(store, 'personal')

  assert.ok(result.error)
  assert.deepEqual(result.recovery, personal)
  assert.equal(store.getItem(storageKey('personal')), '{corrupt')
  assert.deepEqual(readWorkspace(store, 'demo').data, demo)
  clearWorkspace(store, 'personal')
  assert.deepEqual(readWorkspace(store, 'demo').data, demo)
})
test('almacenamiento restringido y cuota agotada son errores recuperables', () => {
  const restricted = {
    getItem() {
      throw Error('blocked')
    },
    setItem() {
      throw Error('quota')
    },
    removeItem() {}
  }

  assert.ok(readWorkspace(restricted, 'personal').error)
  assert.throws(() => saveWorkspace(restricted, emptyWorkspace()))
})
test('CSV reconoce exactos, ambiguos, desconocidos, duplicados y resultados inválidos', () => {
  const text =
    'plan,codigo,periodo,resultado,creditos\nisia-2025,ICSI 506,202510,Aprobado,4\n,ICSI-509,202520,Pendiente,4\nisia-2025,ZZZZ-999,202510,Aprobado,4\nisia-2025,ICSI-506,202510,Aprobado,4\nisia-2025,CIEN-753,bad,xx,4'
  const result = previewCSV(text)

  assert.deepEqual(
    result.map(r => r.classification),
    ['recognized', 'ambiguous', 'unknown', 'invalid', 'invalid']
  )
  assert.equal(mergeAttempts(emptyWorkspace(), result).attempts.length, 1)
  assert.throws(() => previewCSV('name,grade\na,20'))
  assert.throws(() => parseCSV('"never closed'))
  assert.deepEqual(parseCSV('"a,b",c\r\n"he said ""ok""",d'), [
    ['a,b', 'c'],
    ['he said "ok"', 'd']
  ])
})
test('CSV actualiza intento existente; no determina resultado desde la nota', () => {
  const d = emptyWorkspace()
  let rows = previewCSV(
    'plan,codigo,periodo,resultado,creditos,nota\nisia-2025,ICSI-506,202510,Pendiente,4,20'
  )
  const first = mergeAttempts(d, rows)

  assert.equal(first.attempts[0].result, 'pending')
  rows = previewCSV(
    'plan,codigo,periodo,resultado,creditos\nisia-2025,ICSI-506,202510,Aprobado,4'
  )
  const second = mergeAttempts(first, rows)

  assert.equal(second.attempts.length, 1)
  assert.equal(second.attempts[0].result, 'passed')
})
test('PDF de formato probado propone pendientes; no inventa umbral; escaneado sin éxito', () => {
  const result = reportTextToCSV(
    '01 ICSI - 506 CURSO SINTÉTICO 4 202510 OE 18\n02 CIEN - 753 OTRO SINTÉTICO 4 202510 OE 08\n'
  )

  assert.equal(result.count, 2)
  assert.ok(previewCSV(result.text).every(r => r.attempt?.result === 'pending'))
  assert.equal(reportTextToCSV('Documento sin texto de cursos').count, 0)
})
test('configuración coherente sin inferir cohorte; escenarios acotados', () => {
  assert.equal(
    profileSchema.safeParse({
      cohort: '202310',
      entryPlan: 'isia-2025',
      applicablePlan: 'isia-2025',
      transition: 'direct'
    }).success,
    false
  )
  assert.equal(
    profileSchema.safeParse({
      cohort: '202310',
      entryPlan: 'icsi-2022',
      applicablePlan: 'isia-2025',
      transition: 'transition'
    }).success,
    true
  )
  assert.equal(
    scenarioSchema.safeParse({
      periods: Array(13).fill({ period: '202710', courses: [] })
    }).success,
    false
  )
})

function buildStoredZip(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name)
    const dataBytes = encoder.encode(content)
    const local = new Uint8Array(30 + nameBytes.length + dataBytes.length)
    const lv = new DataView(local.buffer)

    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(8, 0, true)
    lv.setUint32(18, dataBytes.length, true)
    lv.setUint32(22, dataBytes.length, true)
    lv.setUint16(26, nameBytes.length, true)
    local.set(nameBytes, 30)
    local.set(dataBytes, 30 + nameBytes.length)
    localParts.push(local)

    const central = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(central.buffer)

    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(10, 0, true)
    cv.setUint32(20, dataBytes.length, true)
    cv.setUint32(24, dataBytes.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint32(42, offset, true)
    central.set(nameBytes, 46)
    centralParts.push(central)
    offset += local.length
  }

  const centralSize = centralParts.reduce((n, p) => n + p.length, 0)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)

  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, centralParts.length, true)
  ev.setUint16(10, centralParts.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)

  const total = offset + centralSize + eocd.length
  const out = new Uint8Array(total)
  let pos = 0

  for (const part of [...localParts, ...centralParts, eocd]) {
    out.set(part, pos)
    pos += part.length
  }

  return out
}

test('cálculo de ciclo actual, formato de periodos y planificador automático', () => {
  assert.equal(normalizePeriod('2023-10'), '202310')
  assert.equal(formatPeriod('202310'), '2023-10')
  assert.equal(estimateAcademicCycle('2023-10', '202620'), 8)
  assert.equal(estimateAcademicCycle('2025-10', '202620'), 4)
  assert.equal(estimateAcademicCycle('2026-20', '202620'), 1)

  const ws = emptyWorkspace('personal')

  ws.profile = {
    cohort: '202310',
    entryPlan: 'icsi-2022',
    applicablePlan: 'isia-2025',
    transition: 'transition',
    currentCycle: 8,
    preferredCredits: 18
  }
  ws.attempts.push({
    id: 'a1',
    planId: 'icsi-2022',
    code: 'CIEN-397',
    period: '202310',
    result: 'passed',
    originCredits: 4
  })
  ws.attempts.push({
    id: 'a2',
    planId: 'isia-2025',
    code: 'ISIA-110',
    period: '202620',
    result: 'in-progress',
    originCredits: 4
  })
  assert.equal(inferNextPlanningPeriod(ws.attempts), '202710')

  const mapped = applyDocumentedRecognitions(ws, catalog)

  assert.equal(mapped.added, 1)
  ws.recognitions = mapped.recognitions

  // Convalidation of PDF equivalences with code variations (CIEN-651, ICSI-516, HUMA-1027)
  // must deduplicate target courses (e.g. HUMA-1183) without duplicating recognitions.
  ws.attempts.push(
    {
      id: 'a3',
      planId: 'icsi-2022',
      code: 'CIEN-651',
      period: '202420',
      result: 'passed',
      originCredits: 2
    },
    {
      id: 'a4',
      planId: 'icsi-2022',
      code: 'ICSI-516',
      period: '202420',
      result: 'passed',
      originCredits: 4
    },
    {
      id: 'a5',
      planId: 'icsi-2022',
      code: 'HUMA-1027',
      period: '202420',
      result: 'passed',
      originCredits: 1
    },
    {
      id: 'a6',
      planId: 'icsi-2022',
      code: 'HUMA-1012',
      period: '202310',
      result: 'passed',
      originCredits: 1
    }
  )
  const mappedAll = applyDocumentedRecognitions(ws, catalog, {
    includePending: true
  })

  assert.equal(mappedAll.added, 3)
  ws.recognitions = mappedAll.recognitions

  const auto = buildAutoScenario(ws, catalog, { periodCount: 2 })

  assert.equal(auto.periods[0].period, '202710')
  assert.equal(auto.periods[1].period, '202720')
  assert.equal(auto.creditLimit, 18)
  assert.equal(auto.assumeInProgress, true)
  assert.ok(auto.periods[0].courses.length > 0)
  assert.ok(!auto.periods[0].courses.includes('ISIA-101'))
  assert.ok(!auto.periods[0].courses.includes('ICSI-672'))

  // Demo (ingreso 2025-10): 2026-20 (Ciclo IV) and 2027-10 (Ciclo V) must both
  // project full 6-course semesters assuming previous planned period passes.
  const demo = demoWorkspace()
  const demoPlan = buildAutoScenario(demo, catalog, {
    periodCount: 3,
    creditLimit: 22
  })

  assert.equal(demoPlan.periods[0].period, '202620')
  assert.equal(demoPlan.periods[1].period, '202710')
  assert.equal(demoPlan.periods[2].period, '202720')
  assert.equal(demoPlan.periods[0].courses.length, 6)
  assert.equal(demoPlan.periods[1].courses.length, 6)
  assert.equal(demoPlan.periods[2].courses.length, 6)
})

test('importación Excel (.xlsx), ficha de matrícula y acciones rápidas de revisión', async () => {
  const xlsx = buildStoredZip({
    'xl/sharedStrings.xml':
      '<sst><si><t>CURSO</t></si><si><t>SEMESTRE</t></si><si><t>PROMEDIO</t></si><si><t>CREDITOS</t></si><si><t>ICSI-506</t></si><si><t>2023-10</t></si></sst>',
    'xl/worksheets/sheet1.xml':
      '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c></row><row r="2"><c r="A2" t="s"><v>4</v></c><c r="B2" t="s"><v>5</v></c><c r="C2"><v>16</v></c><c r="D2"><v>4</v></c></row></sheetData></worksheet>'
  })
  const rows = await parseXLSXBuffer(xlsx)

  assert.equal(rows.length, 1)
  assert.equal(rows[0].classification, 'recognized')
  assert.equal(rows[0].attempt?.planId, 'icsi-2022')
  const rawAmbiguous = previewCSV(
    'codigo,periodo,resultado,creditos\nICSI-506,2023-10,Pendiente,4'
  )

  assert.equal(rawAmbiguous[0].classification, 'ambiguous')
  assert.equal(
    resolveAmbiguousRows(rawAmbiguous, 'icsi-2022')[0].attempt?.planId,
    'icsi-2022'
  )
  const resolved = applyGradeThreshold(rows, 11)

  assert.equal(resolved[0].classification, 'recognized')
  assert.equal(resolved[0].attempt?.planId, 'icsi-2022')
  assert.equal(resolved[0].attempt?.result, 'passed')

  const mat = matriculaTextToCSV(
    'FICHA DE MATRICULA\nPERIODO : 202620\nISIA -\n110 MACHINE LEARNING 4 T\nISIA -\n110 MACHINE LEARNING 0 L\n'
  )

  assert.equal(mat.count, 1)
  assert.equal(mat.period, '202620')
  const matRows = previewCSV(mat.text)

  assert.equal(matRows[0].attempt?.code, 'ISIA-110')
  assert.equal(matRows[0].attempt?.result, 'in-progress')
  assert.equal(matRows[0].attempt?.originCredits, 4)
})
