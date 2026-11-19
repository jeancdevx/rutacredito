'use client'

import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  FingerprintIcon,
  PathIcon
} from '@phosphor-icons/react'

import './CourseRoute.css'
import { useState } from 'react'

import Select, { SelectOption } from '@/components/Select'
import StatusBadge from '@/components/StatusBadge'
import { courseStatus } from '@/helpers/academic.helpers'
import { catalog, courseByCode } from '@/helpers/curriculum.helpers'
import type { Workspace } from '@/helpers/validation.helpers'

import { branches } from './CourseRoute.constants'

export default function CourseRoute({
  data,
  onInspect,
  compact = false
}: {
  data: Workspace
  onInspect: (code: string) => void
  compact?: boolean
}) {
  const [branchId, setBranchId] = useState('programming')
  const branch = branches.find(b => b.id === branchId)!
  const [selected, setSelected] = useState('ICSI-671')
  const active = courseByCode.get(
    branch.codes.includes(selected) ? selected : branch.codes[0]
  )!
  const result = courseStatus(active, data, catalog)

  return (
    <section
      className={`course-route ${compact ? 'route-compact' : ''}`}
      aria-label='Explorador de conexiones documentadas'
    >
      <div className='route-heading'>
        <div>
          <span className='route-mark'>
            <PathIcon size={16} /> UNA CONEXIÓN A LA VEZ
          </span>
          <h2>
            Lo que haces hoy <br />
            abre tu próximo paso.
          </h2>
        </div>
        <label className='route-branch-select'>
          <span>Explorar una rama</span>
          <Select
            aria-label='Rama de conexiones'
            value={branchId}
            onValueChange={value => {
              setBranchId(value)
              setSelected(branches.find(b => b.id === value)!.codes[0])
            }}
          >
            {branches.map(b => (
              <SelectOption key={b.id} value={b.id}>
                {b.label}
              </SelectOption>
            ))}
          </Select>
        </label>
      </div>
      <div className='route-landscape'>
        <div className='route-contours' aria-hidden='true'>
          <i />
          <i />
          <i />
        </div>
        <svg
          className='route-lines'
          viewBox='0 0 1000 210'
          preserveAspectRatio='none'
          aria-hidden='true'
        >
          <path
            className='route-underlay'
            d='M125 145 C245 145 255 65 375 65 S505 145 625 145 S755 65 875 65'
          />
          <path
            className='route-ink'
            d='M125 145 C245 145 255 65 375 65 S505 145 625 145 S755 65 875 65'
          />
        </svg>
        <div className='route-stations'>
          {branch.codes.map((code, i) => {
            const course = courseByCode.get(code)!,
              state = courseStatus(course, data, catalog).status

            return (
              <button
                key={code}
                className={`route-station station-${state} ${active.code === code ? 'station-selected' : ''}`}
                aria-pressed={active.code === code}
                onClick={() => setSelected(code)}
              >
                <span className='station-node'>
                  {state === 'passed' ? (
                    <CheckIcon size={16} weight='bold' />
                  ) : (
                    <span>{String(i + 1).padStart(2, '0')}</span>
                  )}
                </span>
                <span className='station-card'>
                  <span className='station-code'>
                    {code}
                    <span>{course.credits} cr.</span>
                  </span>
                  <strong>{course.name}</strong>
                  <StatusBadge status={state} />
                  {active.code === code && (
                    <span className='station-active-label'>
                      Estás mirando este curso
                      <ArrowUpRightIcon size={12} />
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className='route-inspector'>
        <div className='route-inspector-icon'>
          <FingerprintIcon size={28} />
        </div>
        <div>
          <small>LA RAZÓN DE ESTE ESTADO</small>
          <strong>{active.name}</strong>
          <p>{result.evaluation.reasons[0]}</p>
        </div>
        <button onClick={() => onInspect(active.code)}>
          Ver curso
          <ArrowUpRightIcon size={16} />
        </button>
      </div>
      <div className='route-footnote'>
        <span>
          <span className='route-key-dot' />
          Conexiones documentadas · Tramo parcial del plan
        </span>
        <span>
          Consulta cada curso para ver todos sus requisitos
          <ArrowRightIcon size={14} />
        </span>
      </div>
    </section>
  )
}
