'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className='site-footer'>
      <span>RutaCréditos · Tu próximo paso, claro.</span>
      <div>
        <Link href='/fuentes'>Fuentes y ayuda</Link>
        <Link href='/privacidad'>Privacidad y condiciones</Link>
      </div>
      <small>Proyecto independiente. No es un sistema oficial de UPAO.</small>
    </footer>
  )
}
