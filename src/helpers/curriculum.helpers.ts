import raw from '@/data/catalog.json'

import { catalogSchema } from './validation.helpers'

export const catalog = catalogSchema.parse(raw)

export const plan = catalog.plans[0]

export const courseByCode = new Map(
  catalog.courses.map(course => [course.code, course])
)

export const sourceById = new Map(
  catalog.sources.map(source => [source.id, source])
)

export function normalizeCode(input: string) {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/^([A-Z]+)(\d+)$/, '$1-$2')
    .replace(/[–—]/g, '-')
}

export function courseName(code: string) {
  return (
    courseByCode.get(code)?.name ??
    catalog.origins.find(c => c.code === code)?.name ??
    code
  )
}
