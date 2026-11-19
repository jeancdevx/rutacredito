'use client'

import type { ReactNode } from 'react'

import Dialog from '@/components/Dialog'

export default function ConfirmDialog({
  title,
  children,
  label = 'Confirmar',
  onConfirm,
  onClose
}: {
  title: string
  children: ReactNode
  label?: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Dialog title={title} onClose={onClose}>
      <p>{children}</p>
      <div className='actions end'>
        <button className='secondary' onClick={onClose}>
          Cancelar
        </button>
        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {label}
        </button>
      </div>
    </Dialog>
  )
}
