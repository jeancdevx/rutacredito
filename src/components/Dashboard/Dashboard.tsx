'use client'

import { FileArrowUpIcon, SparkleIcon } from '@phosphor-icons/react'
import Link from 'next/link'

import { roman } from '@/components/CurriculumMap/CurriculumMap.constants'
import Dovi from '@/components/Dovi'
import StatusBadge from '@/components/StatusBadge'
import {
  account,
  courseStatus,
  estimateAcademicCycle,
  formatPeriod,
  inferNextPlanningPeriod
} from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'
import type { Workspace } from '@/helpers/validation.helpers'

export default function Dashboard({
  data,
  onNavigate,
  onEdit,
  onAutoPlan
}: {
  data: Workspace
  onNavigate: (s: string) => void
  onEdit: () => void
  onAutoPlan?: () => void
}) {
  const progress = account(data, catalog)
  const currentCycle =
    data.profile.currentCycle ?? estimateAcademicCycle(data.profile.cohort)
  const nextPlanning = inferNextPlanningPeriod(data.attempts)
  const available = catalog.courses.filter(
    c => courseStatus(c, data, catalog, progress.context).status === 'available'
  )
  const unknown = catalog.courses.filter(
    c => courseStatus(c, data, catalog, progress.context).status === 'unknown'
  )
  const remaining = progress.requiredRemaining.filter(
    c => courseStatus(c, data, catalog, progress.context).status !== 'unknown'
  )

  return (
    <>
      <div className='page-title'>
        <div>
          <p className='eyebrow'>
            {data.mode === 'demo'
              ? 'UN EJEMPLO PARA EXPLORAR'
              : `CICLO ${roman[currentCycle - 1]} · INGRESO ${formatPeriod(data.profile.cohort)}`}
          </p>
          <h1>
            Tu avance, con contexto<span className='coral'>.</span>
          </h1>
          <p>
            Próximo ciclo a planificar:{' '}
            <strong>{formatPeriod(nextPlanning)}</strong> (objetivo:{' '}
            {data.profile.preferredCredits ?? 20} créditos).
          </p>
        </div>
        <div className='actions'>
          <button className='secondary' onClick={() => onNavigate('backups')}>
            <FileArrowUpIcon size={16} />
            Importar PDF / Excel
          </button>
          <button className='secondary' onClick={onEdit}>
            + Registrar un curso
          </button>
        </div>
      </div>
      <div className='dashboard-overview'>
        <section className='progress-feature'>
          <div>
            <p className='eyebrow'>AVANCE RECONOCIDO EN ISIA 2025</p>
            <div className='progress-number'>
              {progress.recognizedCredits}
              <small> / 205 cr.</small>
            </div>
            <progress
              className='progress-track'
              aria-label='Avance de créditos de requisitos en destino'
              max={205}
              value={progress.recognizedCredits}
            >
              {progress.recognizedCredits} / 205
            </progress>
            <p>
              {progress.percent.toLocaleString('es-PE', {
                maximumFractionDigits: 1
              })}
              % de los créditos de requisitos del destino.
            </p>
            <p className='caption'>
              {data.profile.transition === 'direct'
                ? 'Referencia de la versión consultada.'
                : 'El destino es una referencia; no es el saldo definitivo de tu malla de ingreso.'}{' '}
              No certifica egreso.
            </p>
          </div>
          <Dovi state='leyendo' />
        </section>
        <section className='history-metrics'>
          <div>
            <span>Créditos aprobados del historial</span>
            <strong>
              {progress.historyCredits}
              <small>
                {progress.historyUnknown
                  ? ` + ${progress.historyUnknown} cursos por verificar`
                  : ''}
              </small>
            </strong>
            <p>
              Créditos originales conocidos, sin duplicar repeticiones ni
              reconocimientos.
            </p>
          </div>
          <div>
            <span>Créditos en curso</span>
            <strong>{progress.inProgressCredits}</strong>
            <p>No cuentan como aprobados ni habilitan dependientes.</p>
          </div>
        </section>
      </div>
      <div className='dashboard-grid'>
        <section>
          <div className='section-heading'>
            <div>
              <p className='eyebrow'>LO QUE PUEDES EXPLORAR</p>
              <h2>
                {available.length} cursos disponibles según reglas verificadas
              </h2>
            </div>
            <button className='text-button' onClick={() => onNavigate('malla')}>
              Ver malla →
            </button>
          </div>
          <div className='next-course-list'>
            {available.slice(0, 5).map(c => (
              <div key={c.code}>
                <div>
                  <small>
                    {c.code} · Ciclo {roman[c.cycle - 1]} · {c.credits} cr.
                  </small>
                  <strong>{c.name}</strong>
                </div>
                <StatusBadge status='available' />
              </div>
            ))}
          </div>
          {!available.length && (
            <div className='empty-state compact'>
              <p>
                Sube tu Reporte de Notas PDF o Excel, o marca tus cursos en la
                malla para ver qué puedes llevar en {formatPeriod(nextPlanning)}
                .
              </p>
              <button
                className='secondary'
                onClick={() => onNavigate('backups')}
              >
                Importar mi historial
              </button>
            </div>
          )}
          <p className='caption'>
            La disponibilidad académica verificada no representa oferta real de
            la universidad.
          </p>
          <div className='actions'>
            {onAutoPlan && (
              <button onClick={onAutoPlan}>
                <SparkleIcon size={16} />
                Planificar {formatPeriod(nextPlanning)} automáticamente
              </button>
            )}
            <button
              className={onAutoPlan ? 'secondary' : ''}
              onClick={() => onNavigate('planner')}
            >
              Explorar mis próximos ciclos ↗
            </button>
          </div>
        </section>
        <aside className='review-aside'>
          <p className='eyebrow'>LO QUE MERECE UNA REVISIÓN</p>
          <h2>También cuenta saber qué falta confirmar.</h2>
          <div className='summary-stat'>
            <span>Obligatorios pendientes con regla evaluable</span>
            <strong>{remaining.length}</strong>
          </div>
          <div className='summary-stat'>
            <span>Cursos pendientes con regla incierta</span>
            <strong>{unknown.length}</strong>
          </div>
          <div className='summary-stat'>
            <span>Correspondencias de aprobados sin reconocer</span>
            <strong>{progress.pendingRecognition.length}</strong>
          </div>
          <p className='caption'>
            Las categorías de incertidumbre y correspondencias pueden referirse
            al mismo curso.
          </p>
          <button
            className='secondary full'
            onClick={() => onNavigate('transition')}
          >
            {progress.pendingRecognition.length > 0
              ? `Mapear ${progress.pendingRecognition.length} correspondencias`
              : 'Revisar transición'}
          </button>
          <Link href='/fuentes#incidencias'>
            Consultar incidencias académicas →
          </Link>
        </aside>
      </div>
      <section className='elective-overview'>
        <p className='eyebrow'>LOS ELECTIVOS TIENEN SU LUGAR</p>
        <h2>Dos cupos, sin sumar todas las alternativas.</h2>
        <div className='elective-groups'>
          {progress.groups.map(g => (
            <div key={g.id}>
              <strong>{g.name}</strong>
              <span>
                {g.earned} / {g.slots * g.creditsPerSlot} cr.
              </span>
              <small>
                {g.completed.length
                  ? g.completed.join(', ')
                  : 'Sin opción aprobada o reconocida'}{' '}
                · {g.remaining} cupos pendientes
              </small>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
