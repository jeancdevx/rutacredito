import Link from 'next/link'

import Brand from '@/components/Brand'
import Footer from '@/components/Footer'
import { catalog, plan } from '@/helpers/curriculum.helpers'

export default function SourcesPage() {
  return (
    <>
      <header className='public-header'>
        <Brand />
        <Link className='button secondary small' href='/app'>
          Volver a mi espacio ↗
        </Link>
      </header>
      <main id='main' className='wrap document-page'>
        <p className='eyebrow'>FUENTES, COBERTURA Y AYUDA</p>
        <h1>Una ruta con referencias.</h1>
        <p className='lead'>
          Consulta de dónde salen los datos y qué necesita revisión antes de
          tomar una decisión académica.
        </p>
        <section className='notice'>
          <h2>Qué cubre esta versión</h2>
          <p>
            <strong>
              {plan.program} · inicio {plan.effectiveFrom}
            </strong>
            . Catálogo completo del PDF de codificación:{' '}
            {catalog.courses.length} asignaturas; 197 créditos obligatorios y 8
            en dos cupos electivos. Las reglas incompletas permanecen «por
            verificar».
          </p>
          <p>
            ICSI 2022: correspondencias y catálogo parcial de origen. No
            cubrimos un plan de egreso ICSI completo ni inferimos el plan
            individual por cohorte. Datos revisados: {catalog.reviewedAt};
            versión {catalog.version}.
          </p>
          <p>
            La codificación refiere a Resolución AU N.º 4-2024-AU-UPAO y, para
            ICSI, CD N.º 203-2022-CD-UPAO. Esa referencia no acredita la
            situación de cada estudiante.
          </p>
        </section>
        <h2>Registro de fuentes</h2>
        {catalog.sources.map(s => (
          <article className='source-entry' id={s.id} key={s.id}>
            <h3>{s.title}</h3>
            <p>{s.version}</p>
            <p className='muted'>{s.scope}</p>
            <details>
              <summary>Identificador de integridad</summary>
              <code className='hash'>{s.sha256}</code>
            </details>
          </article>
        ))}
        <p className='caption'>
          Se publican referencias y datos normalizados. Los originales
          suministrados y los reportes personales no se distribuyen en la web.
        </p>
        <section id='incidencias'>
          <h2>Incidencias que afectan a la interpretación</h2>
          {catalog.issues.map(issue => (
            <article className='source-entry' key={issue.id}>
              <h3>
                {issue.id} · {issue.courseCode ?? 'Cobertura y reglas del plan'}
              </h3>
              <p>{issue.description}</p>
              <p>
                <strong>Tratamiento:</strong> {issue.resolution}
              </p>
              <small>
                {catalog.sources.find(s => s.id === issue.sourceId)?.title} ·{' '}
                {issue.location}
              </small>
            </article>
          ))}
        </section>
        <section id='ayuda'>
          <h2>Cómo leer los resultados</h2>
          <dl className='help-definitions'>
            <dt>Disponible según reglas verificadas</dt>
            <dd>
              Se cumplen los prerrequisitos documentados con las aprobaciones o
              reconocimientos registrados. No significa que UPAO oferte el
              curso, tenga vacantes o permita matrícula.
            </dd>
            <dt>Bloqueado</dt>
            <dd>
              Falta al menos una condición conocida. En curso o desaprobado no
              equivale a aprobado.
            </dd>
            <dt>Por verificar</dt>
            <dd>
              Una fuente es ambigua, contradictoria o incompleta. No se supone
              ausencia de requisitos.
            </dd>
            <dt>Simulación</dt>
            <dd>
              Solo los cursos válidos de periodos anteriores se suponen
              aprobados en el siguiente. La oferta y la aprobación son
              condicionales. La carga máxima es una preferencia personal, no una
              norma UPAO.
            </dd>
            <dt>Créditos de origen y destino</dt>
            <dd>
              El historial conserva los créditos originales. El avance
              reconocido usa los créditos del destino, sin contar intentos
              repetidos ni todas las opciones electivas. Ningún indicador
              certifica egreso.
            </dd>
            <dt>Recuperación</dt>
            <dd>
              Exporta un respaldo JSON en «Respaldos». Puedes previsualizarlo e
              importarlo en el mismo navegador u otro. Si se detecta corrupción,
              la app ofrece la última copia local válida cuando existe. La demo
              y el espacio personal se almacenan por separado.
            </dd>
          </dl>
        </section>
      </main>
      <Footer />
    </>
  )
}
