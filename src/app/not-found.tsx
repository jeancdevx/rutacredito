import Link from 'next/link'

import Brand from '@/components/Brand'
import Dovi from '@/components/Dovi'

export default function NotFound() {
  return (
    <>
      <header className='public-header'>
        <Brand />
      </header>
      <main id='main' className='empty-page'>
        <Dovi state='atento' />
        <p className='eyebrow'>404 · FUERA DE LA RUTA</p>
        <h1>Volvamos a un punto conocido.</h1>
        <p>Esta página no existe. Tu avance sigue en este navegador.</p>
        <Link className='button' href='/app'>
          Abrir mi espacio
        </Link>
      </main>
    </>
  )
}
