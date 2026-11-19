'use client'

import { account } from '@/helpers/academic.helpers'
import { catalog } from '@/helpers/curriculum.helpers'
import type { Workspace } from '@/helpers/validation.helpers'

export default function PrintSummary({ data }: { data: Workspace }) {
  const progress = account(data, catalog)

  return (
    <section className='print-summary' aria-label='Resumen imprimible'>
      <h1>RutaCréditos</h1>
      <h2>Tu próximo paso, claro.</h2>
      <p>
        {data.mode === 'demo' ? 'Ejemplo ficticio' : 'Espacio personal'} ·
        Cohorte {data.profile.cohort} · Ingreso {data.profile.entryPlan} ·
        Destino {data.profile.applicablePlan} · {data.profile.transition}
      </p>
      <p>
        Catálogo {catalog.version} · Documento generado:{' '}
        {new Date(data.updatedAt).toLocaleDateString('es-PE')}
      </p>
      <p>
        Créditos originales aprobados conocidos: {progress.historyCredits}.
        Cursos sin créditos verificados: {progress.historyUnknown}. Créditos
        reconocidos en destino: {progress.recognizedCredits}/205. En curso:{' '}
        {progress.inProgressCredits}.
      </p>
      <p>
        Destino de referencia. No certifica egreso, matrícula ni oferta
        universitaria. Los reconocimientos son declaraciones personales.
      </p>
      <h2>Historial</h2>
      <table>
        <thead>
          <tr>
            <th>Plan / curso</th>
            <th>Periodo</th>
            <th>Resultado</th>
            <th>Créditos origen</th>
          </tr>
        </thead>
        <tbody>
          {data.attempts.map(a => (
            <tr key={a.id}>
              <td>
                {a.planId} · {a.code}
              </td>
              <td>{a.period}</td>
              <td>
                {
                  {
                    passed: 'Aprobado',
                    failed: 'Desaprobado',
                    'in-progress': 'En curso',
                    pending: 'Pendiente'
                  }[a.result]
                }
              </td>
              <td>{a.originCredits ?? 'Por verificar'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Reconocimientos declarados</h2>
      {data.recognitions.map(r => (
        <p key={r.id}>
          {r.equivalenceId} · {r.note}
        </p>
      ))}
      {!data.recognitions.length && <p>Sin declaraciones individuales.</p>}
      <h2>Escenarios condicionales</h2>
      {data.scenarios.map(s => (
        <div key={s.id}>
          <h3>{s.name}</h3>
          <p>
            Preferencias: {s.creditLimit} cr. y {s.courseLimit} cursos. En
            progreso{' '}
            {s.assumeInProgress
              ? 'supuesto aprobado si pertenece a periodos anteriores'
              : 'sin asumir aprobado'}
            .
          </p>
          {s.periods.map(p => (
            <p key={p.period}>
              {p.period}: {p.courses.join(', ') || 'Sin selección'}.
            </p>
          ))}
        </div>
      ))}
      <h2>Fuentes e incidencias</h2>
      {catalog.sources.map(s => (
        <p key={s.id}>
          {s.title} · {s.version}
        </p>
      ))}
      {catalog.issues.map(i => (
        <p key={i.id}>
          {i.id}: {i.description} {i.resolution}
        </p>
      ))}
    </section>
  )
}
