'use client'

import Dialog from '@/components/Dialog'
import EvidenceList from '@/components/EvidenceList'
import StatusBadge from '@/components/StatusBadge'
import { courseStatus, references } from '@/helpers/academic.helpers'
import { catalog, courseName } from '@/helpers/curriculum.helpers'
import type { Course, Workspace } from '@/helpers/validation.helpers'

import { roman } from './CurriculumMap.constants'
import RuleText from './RuleText'

export default function CourseDetail({
  course,
  data,
  onClose,
  onSelect,
  onEdit
}: {
  course: Course
  data: Workspace
  onClose: () => void
  onSelect: (code: string) => void
  onEdit: (code: string) => void
}) {
  const { status, evaluation } = courseStatus(course, data, catalog)
  const dependents = catalog.courses.filter(c =>
    references(c.prerequisite).includes(course.code)
  )
  const equivalents = catalog.equivalences.filter(e =>
    e.to.includes(course.code)
  )

  return (
    <Dialog
      title={course.name}
      onClose={onClose}
      className='course-detail-dialog'
    >
      <div className='detail-meta'>
        <span>{course.code}</span>
        <span>Ciclo {roman[course.cycle - 1]}</span>
        <span>{course.credits} créditos</span>
        <span>
          {course.required
            ? 'Obligatorio'
            : course.electiveGroup === 'electivo-1'
              ? 'Electivo I · un cupo'
              : 'Electivo II · un cupo'}
        </span>
      </div>
      <StatusBadge status={status} />
      <section className='detail-section'>
        <h3>Por qué aparece así</h3>
        <p className='verdict'>{evaluation.verdict}</p>
        <ul>
          {evaluation.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        {status === 'available' && (
          <p className='caption'>
            Disponible según las reglas verificadas. No indica oferta, horarios
            ni vacantes de UPAO.
          </p>
        )}
      </section>
      <section className='detail-section'>
        <h3>Prerrequisitos</h3>
        <RuleText rule={course.prerequisite} />
      </section>
      <section className='detail-section'>
        <h3>Conexiones directas</h3>
        <p className='caption'>
          Se resaltan solo las relaciones de este curso. Las referencias en
          conflicto no se consideran requisitos resueltos.
        </p>
        <div className='connection-list'>
          {references(course.prerequisite).map(code => (
            <button
              className='secondary small'
              key={`pre${code}`}
              onClick={() => onSelect(code)}
            >
              ← {courseName(code)}
            </button>
          ))}
          {dependents.map(c => (
            <button
              className='secondary small'
              key={c.code}
              onClick={() => onSelect(c.code)}
            >
              {c.name} →
            </button>
          ))}
          {!dependents.length && !references(course.prerequisite).length && (
            <p>Sin conexiones directas documentadas.</p>
          )}
        </div>
      </section>
      <section className='detail-section'>
        <h3>Correspondencias ICSI → ISIA</h3>
        {equivalents.length ? (
          equivalents.map(eq => (
            <div className='equivalence-mini' key={eq.id}>
              <p>
                {eq.from.join(' + ')} → {eq.to.join(' + ')}
              </p>
              <small>
                {eq.verification === 'documented'
                  ? 'Documentada'
                  : 'Pendiente de confirmación'}{' '}
                · {eq.conditions}
              </small>
              <EvidenceList items={eq.evidence} />
            </div>
          ))
        ) : (
          <p>No se encontró correspondencia en las fuentes procesadas.</p>
        )}
      </section>
      <section className='detail-section'>
        <h3>Fuentes de esta ficha</h3>
        <EvidenceList
          items={[
            ...Object.values(course.sources).flat(),
            ...evaluation.evidence
          ]}
        />
      </section>
      <div className='dialog-sticky-actions'>
        <button onClick={() => onEdit(course.code)}>
          Registrar intento de este curso
        </button>
      </div>
    </Dialog>
  )
}
