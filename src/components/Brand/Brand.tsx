'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href='/' className='brand' aria-label='RutaCréditos, inicio'>
      <Image
        src={`/brand/rc-horizontal-${light ? 'mono-blanco' : 'color'}.svg`}
        alt='RutaCréditos'
        width='208'
        height='56'
      />
    </Link>
  )
}
