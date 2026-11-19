'use client'

import { courseName } from '@/helpers/curriculum.helpers'
import type { Rule } from '@/helpers/validation.helpers'

export default function RuleText({ rule }: { rule: Rule }) {
  if (rule.kind === 'none')
    return <p>Sin prerrequisitos: la fuente dice «Ninguno».</p>

  if (rule.kind === 'unknown')
    return (
      <p className='notice'>
        {rule.reason}
        {rule.references.length > 0 && (
          <small>
            Referencias en conflicto:{' '}
            {rule.references.map(courseName).join(' / ')}.
          </small>
        )}
      </p>
    )

  if (rule.kind === 'pass')
    return (
      <p>
        Aprobar <strong>{courseName(rule.course)}</strong>{' '}
        <small>{rule.course}</small>
      </p>
    )

  if (rule.kind === 'and' || rule.kind === 'or')
    return (
      <div>
        <strong>
          {rule.kind === 'and' ? 'Cumplir todos:' : 'Cumplir al menos uno:'}
        </strong>
        <ul>
          {rule.rules.map((r, i) => (
            <li key={i}>
              <RuleText rule={r} />
            </li>
          ))}
        </ul>
      </div>
    )

  if (rule.kind === 'set')
    return (
      <details>
        <summary>Aprobar el conjunto de {rule.courses.length} cursos</summary>
        <ul>
          {rule.courses.map(code => (
            <li key={code}>
              {code} · {courseName(code)}
            </li>
          ))}
        </ul>
      </details>
    )

  if (rule.kind === 'cycles')
    return (
      <p>Aprobar los obligatorios de los ciclos: {rule.cycles.join(', ')}.</p>
    )

  if (rule.kind === 'credits')
    return (
      <p>
        Acumular {rule.minimum} créditos{' '}
        {rule.basis === 'origin' ? 'de origen' : 'reconocidos'} al inicio del
        periodo.
      </p>
    )
}
