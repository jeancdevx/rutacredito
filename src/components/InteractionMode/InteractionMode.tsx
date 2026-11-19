'use client'

import { useEffect } from 'react'

export default function InteractionMode() {
  useEffect(() => {
    const pointer = () => {
      document.documentElement.dataset.inputMethod = 'pointer'
    }

    const keyboard = (event: KeyboardEvent) => {
      if (
        [
          'Tab',
          'Enter',
          ' ',
          'Escape',
          'ArrowDown',
          'ArrowUp',
          'PageDown',
          'PageUp',
          'Home',
          'End'
        ].includes(event.key)
      )
        document.documentElement.dataset.inputMethod = 'keyboard'
    }

    window.addEventListener('pointerdown', pointer, true)
    window.addEventListener('wheel', pointer, { passive: true })
    window.addEventListener('keydown', keyboard, true)

    return () => {
      window.removeEventListener('pointerdown', pointer, true)
      window.removeEventListener('wheel', pointer)
      window.removeEventListener('keydown', keyboard, true)
    }
  }, [])

  return null
}
