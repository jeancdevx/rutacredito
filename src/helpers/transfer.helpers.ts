import { normalizePeriod } from './academic.helpers'
import { catalog, normalizeCode } from './curriculum.helpers'
import { attemptSchema } from './validation.helpers'
import type { Attempt, Profile, Workspace } from './validation.helpers'

export const resultLabels = {
  passed: 'Aprobado',
  'in-progress': 'En curso',
  failed: 'Desaprobado',
  pending: 'Pendiente'
}

export type ImportRow = {
  row: number
  rawCode: string
  attempt: Attempt | null
  classification: 'recognized' | 'ambiguous' | 'unknown' | 'invalid'
  message: string
  candidates: {
    planId: Attempt['planId']
    code: string
    name: string
    credits: number | null
  }[]
}

export type PDFImportResult = {
  text: string
  count: number
  kind: 'report' | 'matricula'
  detectedPlan?: 'icsi-2022' | 'isia-2025'
  detectedPeriod?: string
  rows: ImportRow[]
}

function normalizeHeader(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '')
}

const headerAliases: Record<string, string[]> = {
  plan: ['plan', 'malla', 'curriculo'],
  codigo: ['codigo', 'curso', 'codigocurso', 'asignatura', 'code'],
  periodo: ['periodo', 'semestre', 'cicloacademico', 'period'],
  resultado: ['resultado', 'estado', 'condicion', 'status', 'situacion'],
  creditos: ['creditos', 'cre', 'cred', 'credits'],
  nota: ['nota', 'promedio', 'calificacion', 'grade']
}

function findHeaderIndex(headers: string[], key: keyof typeof headerAliases) {
  const aliases = headerAliases[key]

  return headers.findIndex(h => aliases.includes(h))
}

export function parseCSV(text: string): string[][] {
  if (text.length > 2_000_000) throw new Error('El archivo supera 2 MB.')
  const rows: string[][] = []
  let row: string[] = [],
    value = '',
    quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]

    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"'
        i++
      } else if (!quoted && value !== '')
        throw new Error('Comillas inesperadas en CSV.')
      else quoted = !quoted
    } else if ((c === ',' || c === ';') && !quoted) {
      row.push(value.trim())
      value = ''
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(value.trim())

      if (row.some(Boolean)) rows.push(row)
      row = []
      value = ''
    } else value += c
  }

  if (quoted) throw new Error('CSV incompleto: falta cerrar comillas.')
  row.push(value.trim())

  if (row.some(Boolean)) rows.push(row)

  if (rows.length > 2001)
    throw new Error('Máximo 2000 intentos por importación.')

  return rows
}

export function previewCSV(text: string): ImportRow[] {
  const rows = parseCSV(text.replace(/^\uFEFF/, ''))
  const rawHeaders = rows.shift() ?? []
  const headers = rawHeaders.map(normalizeHeader)
  const codeIndex = findHeaderIndex(headers, 'codigo')
  const periodIndex = findHeaderIndex(headers, 'periodo')
  const resultIndex = findHeaderIndex(headers, 'resultado')
  const gradeIndex = findHeaderIndex(headers, 'nota')

  if (codeIndex < 0 || periodIndex < 0 || (resultIndex < 0 && gradeIndex < 0))
    throw new Error(
      'Usa las columnas codigo, periodo y resultado (o nota). Descarga la plantilla CSV/Excel.'
    )

  if (new Set(headers).size !== headers.length)
    throw new Error('Hay columnas duplicadas.')

  const planIndex = findHeaderIndex(headers, 'plan')
  const creditsIndex = findHeaderIndex(headers, 'creditos')
  const at = (row: string[], index: number) =>
    index >= 0 ? (row[index] ?? '').trim() : ''
  const seen = new Set<string>()

  return rows.map((r, i) => {
    const code = normalizeCode(at(r, codeIndex))
    const rawPlan = at(r, planIndex).toLowerCase()
    const planId =
      rawPlan === 'isia-2025' || rawPlan === 'isia'
        ? 'isia-2025'
        : rawPlan === 'icsi-2022' || rawPlan === 'icsi'
          ? 'icsi-2022'
          : rawPlan
    const candidates = [
      ...catalog.courses.map(c => ({
        planId: 'isia-2025' as const,
        code: c.code,
        name: c.name,
        credits: c.credits
      })),
      ...catalog.origins.map(c => ({
        planId: 'icsi-2022' as const,
        code: c.code,
        name: c.name,
        credits: c.credits
      }))
    ].filter(c => c.code === code && (!planId || c.planId === planId))
    const resultMap: Record<string, Attempt['result']> = {
      aprobado: 'passed',
      aprobo: 'passed',
      'en curso': 'in-progress',
      cursando: 'in-progress',
      inscrito: 'in-progress',
      matriculado: 'in-progress',
      desaprobado: 'failed',
      reprobado: 'failed',
      pendiente: 'pending',
      passed: 'passed',
      'in-progress': 'in-progress',
      failed: 'failed',
      pending: 'pending'
    }
    const rawResult = at(r, resultIndex)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
    const result =
      resultIndex < 0 && !rawResult ? 'pending' : resultMap[rawResult]
    const rawCredits = at(r, creditsIndex)
    const originCredits = rawCredits
      ? Number(rawCredits.replace(',', '.'))
      : null
    const rawGrade = at(r, gradeIndex)
    const normalizedPeriod = normalizePeriod(at(r, periodIndex))
    const raw = {
      id: `import:${i}:${code}`,
      planId: planId || candidates[0]?.planId || 'isia-2025',
      code,
      period: normalizedPeriod,
      result,
      originCredits,
      ...(rawGrade ? { grade: Number(rawGrade.replace(',', '.')) } : {})
    }
    const parsed = attemptSchema.safeParse(raw)
    const base = { row: i + 2, rawCode: code, candidates }

    if (!parsed.success)
      return {
        ...base,
        attempt: null,
        classification: 'invalid',
        message: 'Periodo, resultado, código, nota o créditos inválidos.'
      }
    const key = `${raw.planId}:${code}:${raw.period}`

    if (seen.has(key))
      return {
        ...base,
        attempt: parsed.data,
        classification: 'invalid',
        message: 'Intento duplicado en el archivo.'
      }
    seen.add(key)

    if (!candidates.length)
      return {
        ...base,
        attempt: parsed.data,
        classification: 'unknown',
        message: 'Código sin correspondencia exacta. No se aplicará.'
      }

    if (candidates.length > 1)
      return {
        ...base,
        attempt: parsed.data,
        classification: 'ambiguous',
        message: 'Código presente en dos planes. Confirma el plan de origen.'
      }

    if (
      candidates[0].planId === 'isia-2025' &&
      originCredits !== null &&
      originCredits !== candidates[0].credits
    )
      return {
        ...base,
        attempt: null,
        classification: 'invalid',
        message: 'Créditos distintos a la versión ISIA seleccionada.'
      }

    const hasEquivalence =
      candidates[0].planId !== 'icsi-2022' ||
      catalog.equivalences.some(eq => eq.from.includes(candidates[0].code))

    return {
      ...base,
      attempt: parsed.data,
      classification: 'recognized',
      message: !hasEquivalence
        ? 'Curso ICSI 2022 sin equivalencia directa en ISIA; cuenta en tu historial de origen.'
        : originCredits === null
          ? 'Coincidencia exacta; créditos sin declarar.'
          : 'Coincidencia exacta.'
    }
  })
}

export function resolveAmbiguousRows(
  rows: ImportRow[],
  entryPlan: Profile['entryPlan']
): ImportRow[] {
  return rows.map(row => {
    if (row.classification !== 'ambiguous' || !row.attempt) return row

    const preferredPlan: Attempt['planId'] =
      row.attempt.period < '202510'
        ? 'icsi-2022'
        : entryPlan === 'isia-2025'
          ? 'isia-2025'
          : 'isia-2025'
    const candidate =
      row.candidates.find(
        c =>
          c.planId === preferredPlan &&
          (c.planId !== 'isia-2025' ||
            row.attempt!.originCredits === null ||
            c.credits === row.attempt!.originCredits)
      ) ??
      row.candidates.find(c => c.planId === 'icsi-2022') ??
      row.candidates[0]

    if (!candidate) return row

    return {
      ...row,
      attempt: { ...row.attempt, planId: candidate.planId },
      classification: 'recognized',
      message: `Plan asignado según periodo (${candidate.planId === 'icsi-2022' ? 'ICSI 2022' : 'ISIA 2025'}).`
    }
  })
}

export function applyGradeThreshold(
  rows: ImportRow[],
  minPassing = 11
): ImportRow[] {
  return rows.map(row => {
    if (!row.attempt || row.attempt.grade === undefined) return row

    if (
      row.classification !== 'recognized' &&
      row.classification !== 'ambiguous'
    )
      return row

    return {
      ...row,
      attempt: {
        ...row.attempt,
        result: row.attempt.grade >= minPassing ? 'passed' : 'failed'
      }
    }
  })
}

export function setAllRowsResult(
  rows: ImportRow[],
  result: Attempt['result']
): ImportRow[] {
  return rows.map(row => {
    if (!row.attempt || row.classification !== 'recognized') return row

    return {
      ...row,
      attempt: { ...row.attempt, result }
    }
  })
}

export function mergeAttempts(data: Workspace, rows: ImportRow[]): Workspace {
  const attempts = [...data.attempts]

  for (const row of rows) {
    if (row.classification !== 'recognized' || !row.attempt) continue
    const a = { ...row.attempt, id: crypto.randomUUID() }
    const index = attempts.findIndex(
      old =>
        old.planId === a.planId &&
        old.code === a.code &&
        old.period === a.period
    )

    if (index >= 0) attempts[index] = { ...a, id: attempts[index].id }
    else attempts.push(a)
  }

  return { ...data, attempts, updatedAt: new Date().toISOString() }
}

function escapeCSV(value: unknown) {
  const str = String(value ?? '')
  const safe = /^[=+@\t\r]/.test(str) ? `'${str}` : str

  return `"${safe.replaceAll('"', '""')}"`
}

export function csv(rows: unknown[][]) {
  return '\uFEFF' + rows.map(r => r.map(escapeCSV).join(',')).join('\r\n')
}

export const templateCSV = () =>
  csv([
    ['plan', 'codigo', 'periodo', 'resultado', 'creditos', 'nota'],
    ['icsi-2022', 'ICSI-506', '2023-10', 'Aprobado', 4, 16],
    ['isia-2025', 'ISIA-102', '2025-10', 'Aprobado', 4, 15]
  ])

export function historyCSV(data: Workspace) {
  return csv([
    ['plan', 'codigo', 'periodo', 'resultado', 'creditos', 'nota'],
    ...data.attempts.map(a => [
      a.planId,
      a.code,
      a.period,
      resultLabels[a.result],
      a.originCredits,
      a.grade
    ])
  ])
}

export function download(
  filename: string,
  content: string,
  type = 'application/json'
) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob),
    a = document.createElement('a')

  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Tested layout: UPAO report has a source code followed by course name,
// credits, period, course type, and grade. This layout has no explicit result.
// Imported results stay pending for review. Grade alone
// never determines approval automatically. Nonmatching and scanned PDFs fall back to CSV.
export function reportTextToCSV(text: string): { text: string; count: number } {
  const rows: unknown[][] = [
    ['plan', 'codigo', 'periodo', 'resultado', 'creditos', 'nota']
  ]
  const re =
    /\b((?:ICSI|ISIA|CIEN|HUMA|ADMI)\s*-\s*\d{3,4})\s+[^\n]*?\s+(\d+(?:\.\d+)?)\s+(20\d{2}(?:10|20|30))\s+([A-ZÁÉÍÓÚ]{1,4})\s+(\d{1,2}(?:\.\d+)?)\s*(?=\n|$)/gi

  for (const m of text.matchAll(re))
    rows.push([
      '',
      normalizeCode(m[1]),
      m[3],
      'Pendiente',
      Number(m[2]),
      Number(m[5])
    ])

  return { text: csv(rows), count: rows.length - 1 }
}

// Tested layout: UPAO Ficha de Matrícula lists PERIODO : YYYY(10|20|30) and
// enrolled course lines where course code may wrap onto two lines (e.g. "ISIA -"
// followed by "110") and appear multiple times for T/L/P sections.
export function matriculaTextToCSV(text: string): {
  text: string
  count: number
  period?: string
} {
  const periodMatch = text.match(/PERIODO\s*:\s*(20\d{2}(?:10|20|30))/i)
  const period = periodMatch?.[1]

  if (!period) return { text: csv([]), count: 0 }

  const flat = text.replace(/\r/g, '\n')
  const byCourse = new Map<string, number>()

  // First pass: inline course codes like "ISIA - 110 ... 4 T" or "ISIA - 110"
  const lines = flat
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  for (let i = 0; i < lines.length; i++) {
    const windowText = [
      lines[i - 2] ?? '',
      lines[i - 1] ?? '',
      lines[i],
      lines[i + 1] ?? '',
      lines[i + 2] ?? '',
      lines[i + 3] ?? '',
      lines[i + 4] ?? ''
    ].join(' ')
    const inlineCode = lines[i].match(
      /\b((?:ICSI|ISIA|CIEN|HUMA|ADMI))\s*-\s*(\d{3,4})\b/i
    )
    let code: string | null = null

    if (inlineCode) {
      code = normalizeCode(`${inlineCode[1]}-${inlineCode[2]}`)
    } else {
      const prefixOnly = lines[i].match(
        /\b((?:ICSI|ISIA|CIEN|HUMA|ADMI))\s*-\s*$/i
      )

      if (prefixOnly) {
        const nextNum = `${lines[i + 1] ?? ''} ${lines[i + 2] ?? ''}`.match(
          /\b(\d{3,4})\b/
        )

        if (nextNum) code = normalizeCode(`${prefixOnly[1]}-${nextNum[1]}`)
      }
    }

    if (!code) continue

    const creditMatches = [...windowText.matchAll(/\b(\d+(?:\.\d+)?)\s+T\b/gi)]
      .map(m => Number(m[1]))
      .filter(n => n > 0 && n <= 12)
    const fallbackCredit =
      catalog.courses.find(c => c.code === code)?.credits ??
      catalog.origins.find(c => c.code === code)?.credits ??
      0
    const credits = creditMatches[0] ?? fallbackCredit
    const existing = byCourse.get(code) ?? 0

    if (!byCourse.has(code) || credits > existing) byCourse.set(code, credits)
  }

  const rows: unknown[][] = [
    ['plan', 'codigo', 'periodo', 'resultado', 'creditos', 'nota']
  ]

  for (const [code, credits] of byCourse) {
    rows.push(['', code, period, 'En curso', credits > 0 ? credits : '', ''])
  }

  return { text: csv(rows), count: rows.length - 1, period }
}

function detectPDFMetadata(text: string): {
  detectedPlan?: 'icsi-2022' | 'isia-2025'
  detectedPeriod?: string
} {
  const detectedPlan = /ING\.?\s*COMPUTACI[ÓO]N\s*Y\s*SIST/i.test(text)
    ? 'icsi-2022'
    : /INTELIGENCIA\s+ARTIFICIAL|ISIA/i.test(text)
      ? 'isia-2025'
      : undefined
  const periodMatch = text.match(
    /(?:ULTIMO\s+SEMESTRE|PERIODO)\s*:\s*(20\d{2}(?:10|20|30))/i
  )

  return { detectedPlan, detectedPeriod: periodMatch?.[1] }
}

export async function readPDF(file: File): Promise<PDFImportResult> {
  if (file.size > 10_000_000)
    throw new Error('El PDF supera el límite de 10 MB.')
  const pdfjs = await import('pdfjs-dist')

  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer())
  })

  try {
    const pdf = await task.promise

    if (pdf.numPages > 30)
      throw new Error('Máximo 30 páginas. Usa CSV para reportes más extensos.')
    let text = ''

    for (let page = 1; page <= pdf.numPages; page++) {
      const content = await (await pdf.getPage(page)).getTextContent()
      let lastY: number | undefined

      for (const item of content.items)
        if ('str' in item) {
          const y = item.transform[5]

          if (lastY !== undefined && Math.abs(y - lastY) > 3) text += '\n'
          text += item.str + ' '
          lastY = y

          if (item.hasEOL) text += '\n'
        }

      text += '\n'
    }

    const meta = detectPDFMetadata(text)
    const report = reportTextToCSV(text)

    if (report.count > 0)
      return {
        ...report,
        ...meta,
        kind: 'report',
        rows: resolveAmbiguousRows(
          previewCSV(report.text),
          meta.detectedPlan ?? 'isia-2025'
        )
      }

    const matricula = matriculaTextToCSV(text)

    if (matricula.count > 0)
      return {
        text: matricula.text,
        count: matricula.count,
        ...meta,
        detectedPeriod: matricula.period ?? meta.detectedPeriod,
        kind: 'matricula',
        rows: resolveAmbiguousRows(
          previewCSV(matricula.text),
          meta.detectedPlan ?? 'isia-2025'
        )
      }

    throw new Error(
      'No se pudo interpretar un reporte de notas o ficha de matrícula compatible. Puede ser un PDF escaneado u otro formato. Usa Excel (.xlsx), la plantilla CSV o el editor manual; no se importó ningún curso.'
    )
  } finally {
    await task.destroy()
  }
}

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  const copy = new Uint8Array(compressed.byteLength)

  copy.set(compressed)
  void writer.write(copy).then(() => writer.close())
  const chunks: Uint8Array[] = []
  const reader = ds.readable.getReader()

  for (;;) {
    const { value, done } = await reader.read()

    if (done) break

    if (value) chunks.push(value)
  }

  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }

  return out
}

async function unzipEntries(data: Uint8Array): Promise<Map<string, string>> {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let eocdOffset = -1

  for (
    let i = data.byteLength - 22;
    i >= Math.max(0, data.byteLength - 65_557);
    i--
  ) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }

  if (eocdOffset < 0)
    throw new Error('El archivo Excel (.xlsx) no es válido o está dañado.')

  const entryCount = view.getUint16(eocdOffset + 10, true)
  const centralDirOffset = view.getUint32(eocdOffset + 16, true)
  const decoder = new TextDecoder('utf-8')
  const files = new Map<string, string>()
  let offset = centralDirOffset

  for (let i = 0; i < entryCount; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLen = view.getUint16(offset + 28, true)
    const extraLen = view.getUint16(offset + 30, true)
    const commentLen = view.getUint16(offset + 32, true)
    const localHeaderOffset = view.getUint32(offset + 42, true)
    const name = decoder.decode(
      data.subarray(offset + 46, offset + 46 + nameLen)
    )

    offset += 46 + nameLen + extraLen + commentLen

    if (!name.endsWith('.xml') && !name.endsWith('.rels')) continue

    const localNameLen = view.getUint16(localHeaderOffset + 26, true)
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true)
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen
    const slice = data.subarray(dataStart, dataStart + compressedSize)

    if (method === 0) files.set(name, decoder.decode(slice))
    else if (method === 8)
      files.set(name, decoder.decode(await inflateRaw(slice)))
  }

  return files
}

function decodeXmlEntities(text: string): string {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
}

function colRefToIndex(ref: string): number {
  const letters = ref.replace(/\d+/g, '').toUpperCase()
  let idx = 0

  for (let i = 0; i < letters.length; i++)
    idx = idx * 26 + (letters.charCodeAt(i) - 64)

  return Math.max(0, idx - 1)
}

function parseSharedStrings(xml: string | undefined): string[] {
  if (!xml) return []
  const strings: string[] = []

  for (const si of xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)) {
    const parts = [...si[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m =>
      decodeXmlEntities(m[1])
    )

    strings.push(parts.join(''))
  }

  return strings
}

function parseSheetRows(sheetXml: string, shared: string[]): string[][] {
  const rows: string[][] = []

  for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = []

    for (const cell of rowMatch[1].matchAll(
      /<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g
    )) {
      const attrs = cell[1]
      const body = cell[2] ?? ''
      const refMatch = attrs.match(/\br="([A-Z]+\d+)"/i)
      const typeMatch = attrs.match(/\bt="([^"]+)"/)
      const col = refMatch ? colRefToIndex(refMatch[1]) : row.length
      let val = ''

      if (typeMatch?.[1] === 's') {
        const vMatch = body.match(/<v>([\s\S]*?)<\/v>/)
        const idx = vMatch ? Number(vMatch[1]) : -1

        val = shared[idx] ?? ''
      } else if (typeMatch?.[1] === 'inlineStr') {
        val = [...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
          .map(m => decodeXmlEntities(m[1]))
          .join('')
      } else {
        const vMatch = body.match(/<v>([\s\S]*?)<\/v>/)

        val = vMatch ? decodeXmlEntities(vMatch[1]) : ''
      }

      row[col] = val.trim()
    }

    const dense = Array.from({ length: row.length }, (_, i) => row[i] ?? '')

    if (dense.some(Boolean)) rows.push(dense)
  }

  return rows
}

export async function parseXLSXBuffer(
  buffer: ArrayBuffer | Uint8Array
): Promise<ImportRow[]> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)

  if (bytes.byteLength > 5_000_000)
    throw new Error('El archivo Excel supera el límite de 5 MB.')

  const files = await unzipEntries(bytes)
  const shared = parseSharedStrings(files.get('xl/sharedStrings.xml'))
  const sheetKey = files.has('xl/worksheets/sheet1.xml')
    ? 'xl/worksheets/sheet1.xml'
    : [...files.keys()].find(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))

  if (!sheetKey)
    throw new Error(
      'No se encontró ninguna hoja de cálculo en el archivo .xlsx.'
    )

  const rawRows = parseSheetRows(files.get(sheetKey)!, shared)
  const headerIndex = rawRows.findIndex(r => {
    const normalized = r.map(normalizeHeader)

    return (
      findHeaderIndex(normalized, 'codigo') >= 0 &&
      findHeaderIndex(normalized, 'periodo') >= 0
    )
  })

  if (headerIndex < 0)
    throw new Error(
      'Tu Excel debe incluir al menos las columnas «codigo» (o «curso») y «periodo» (o «semestre»), junto con «resultado» o «nota».'
    )

  const tableRows = rawRows.slice(headerIndex)

  return resolveAmbiguousRows(previewCSV(csv(tableRows)), 'isia-2025')
}

export async function readXLSX(file: File): Promise<ImportRow[]> {
  if (file.size > 5_000_000)
    throw new Error('El archivo Excel supera el límite de 5 MB.')

  return parseXLSXBuffer(await file.arrayBuffer())
}
