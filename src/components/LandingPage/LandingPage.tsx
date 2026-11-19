'use client'

import Link from 'next/link'

import './LandingPage.css'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import ClosingInvitation from '@/components/ClosingInvitation'
import CourseRoute from '@/components/CourseRoute'
import Dovi from '@/components/Dovi'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'
import LandingNavigation from '@/components/LandingNavigation'
import LandingShowcase from '@/components/LandingShowcase'
import ScrollWorldHero from '@/components/ScrollWorldHero'
import TaglineReveal from '@/components/TaglineReveal'
import { demoWorkspace } from '@/helpers/storage.helpers'

const faqs = [
  [
    '¿Qué plan puedo explorar?',
    'El catálogo ISIA de la codificación con inicio 202510 (65 asignaturas y 205 créditos con dos cupos electivos) y las correspondencias de transición desde ICSI 2022.'
  ],
  [
    '¿Necesito una cuenta?',
    'No. Puedes probar el ejemplo ficticio o crear tu perfil. Los datos se guardan en este navegador y no se sincronizan con otros dispositivos.'
  ],
  [
    '¿Puedo subir mi Reporte de Notas PDF, Ficha de Matrícula o Excel?',
    'Sí. Puedes cargar directamente tu Reporte de Notas PDF de UPAO, tu Ficha de Matrícula PDF (cursos en curso) o un archivo Excel (.xlsx) o CSV. Todo se procesa localmente en tu navegador.'
  ],
  [
    '¿Cómo funciona la convalidación de ICSI a ISIA?',
    'Al importar tus cursos aprobados de ICSI 2022, RutaCréditos asigna el plan de los códigos compartidos según el periodo y te permite aplicar las correspondencias hacia ISIA 2025 en un clic para planificar tu ciclo real. Es una referencia personal y no reemplaza una convalidación oficial de UPAO.'
  ],
  [
    '¿Cómo se explican los bloqueos y las reglas inciertas?',
    'Cada curso muestra sus prerrequisitos documentados, qué falta cumplir y su fuente oficial. Si una casilla está vacía o tiene diferencias entre fuentes, aparece marcada como «por verificar».'
  ],
  [
    '¿El plan garantiza matrícula o egreso?',
    'No. Los escenarios suponen aprobación y oferta disponible en los siguientes periodos. No contamos con horarios ni vacantes oficiales, pero puedes exportar tu respaldo JSON o tu escenario en CSV cuando quieras.'
  ]
]

export default function LandingPage() {
  const router = useRouter()
  const [example] = useState(() => demoWorkspace('2026-11-17T00:00:00.000Z'))

  return (
    <>
      <LandingNavigation />
      <main id='main'>
        <ScrollWorldHero />
        <section
          id='vista-producto'
          className='product-preview wrap'
          aria-labelledby='preview-title'
        >
          <div className='section-heading'>
            <div>
              <p className='eyebrow'>DE LA MALLA A UNA DECISIÓN</p>
              <h2 id='preview-title'>
                Cada curso cuenta una parte de tu ruta.
              </h2>
            </div>
            <Link className='text-link' href='/app?mode=demo'>
              Explorar el ejemplo →
            </Link>
          </div>
          <p className='live-example-label'>
            <span /> Ejemplo ficticio interactivo · selecciona un curso para
            entender su estado y sus prerrequisitos
          </p>
          <CourseRoute
            data={example}
            onInspect={code => {
              router.push(`/app?mode=demo&course=${encodeURIComponent(code)}`)
            }}
          />
        </section>
        <LandingShowcase />
        <TaglineReveal />
        <section className='steps wrap' id='como-funciona'>
          <div>
            <p className='eyebrow'>TRES PASOS PARA UBICARTE</p>
            <h2>
              De «¿qué me falta?»
              <br />a «por aquí sigo».
            </h2>
            <Dovi state='leyendo' />
          </div>
          <ol>
            {[
              [
                'Indica tu periodo de ingreso',
                'Elige tu ingreso (por ejemplo 202310 o 202510). Calculamos tu ciclo actual y detectamos si vienes por ingreso directo ISIA o transición desde ICSI.'
              ],
              [
                'Sube tu Reporte de Notas PDF, Matrícula o Excel',
                'Importa tus cursos aprobados y en curso sin digitar uno por uno. Confirma tus notas aprobatorias y convalida ICSI a ISIA en un clic.'
              ],
              [
                'Proyecta y compara tus próximos ciclos',
                'Genera tus siguientes periodos según tu límite de créditos, revisa bloqueos con su fuente y compara dos escenarios antes de matricularte.'
              ]
            ].map(([title, text], i) => (
              <li key={title}>
                <span className='step-number'>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <ClosingInvitation />
        <section className='faq wrap' id='preguntas'>
          <div>
            <p className='eyebrow'>ANTES DE EMPEZAR</p>
            <h2>
              Las cosas claras,
              <br />
              desde el inicio.
            </h2>
            <p>
              Reglas consultables y límites visibles.
              <br />
              Sin promesas de matrícula o egreso.
            </p>
          </div>
          <FAQ items={faqs} />
        </section>
      </main>
      <Footer />
    </>
  )
}
