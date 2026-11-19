'use client'

import './Dialog.css'
import { Dialog as Primitive } from '@base-ui/react/dialog'
import { XIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import type { ReactNode } from 'react'

export default function Dialog({
  title,
  children,
  onClose,
  wide = false,
  className = ''
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(true)

  return (
    <Primitive.Root
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={isOpen => {
        if (!isOpen) onClose()
      }}
    >
      <Primitive.Portal>
        <Primitive.Backdrop className='rc-dialog-backdrop' />
        <Primitive.Popup
          className={`dialog rc-dialog ${wide ? 'dialog-wide' : ''} ${className}`}
        >
          <div className='dialog-heading'>
            <Primitive.Title>{title}</Primitive.Title>
            <Primitive.Close
              className='icon-button'
              aria-label='Cerrar diálogo'
            >
              <XIcon size={20} />
            </Primitive.Close>
          </div>
          {children}
        </Primitive.Popup>
      </Primitive.Portal>
    </Primitive.Root>
  )
}
