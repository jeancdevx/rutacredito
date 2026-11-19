'use client'

import Image from 'next/image'

export type DoviState =
  | 'bienvenida'
  | 'atento'
  | 'leyendo'
  | 'pensando'
  | 'alegre'

export default function Dovi({
  state = 'bienvenida',
  className = ''
}: {
  state?: DoviState
  className?: string
}) {
  return (
    <Image
      className={`dovi ${className}`}
      src={`/brand/dovi-${state}.svg`}
      alt=''
      width='160'
      height='160'
    />
  )
}
