'use client'

import Link from 'next/link'

import { sourceById } from '@/helpers/curriculum.helpers'
import type { Evidence } from '@/helpers/validation.helpers'

export default function EvidenceList({ items }: { items: Evidence[] }) {
  return (
    <ul className='evidence-list'>
      {[...new Map(items.map(e => [e.sourceId + e.location, e])).values()].map(
        e => (
          <li key={e.sourceId + e.location}>
            <Link href={`/fuentes#${e.sourceId}`}>
              {sourceById.get(e.sourceId)?.title ?? e.sourceId}
            </Link>
            <small>{e.location}</small>
          </li>
        )
      )}
    </ul>
  )
}
