'use client'

import {
  CheckCircleIcon,
  WarningCircleIcon,
  XIcon
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

export default function NoticeToast({
  message,
  onDismiss
}: {
  message: string
  onDismiss: () => void
}) {
  const [lastMessage, setLastMessage] = useState(message)

  if (message && lastMessage !== message) setLastMessage(message)
  const warning =
    lastMessage.includes('solo en memoria') || lastMessage.startsWith('No ')

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, warning ? 8000 : 4800)

    return () => window.clearTimeout(timer)
  }, [message, onDismiss, warning])

  return (
    <output
      aria-live='polite'
      aria-hidden={!message}
      inert={!message}
      data-open={Boolean(message)}
      className={`toast notice-toast ${warning ? 'toast-warning' : ''}`}
    >
      {warning ? (
        <WarningCircleIcon size={20} className='shrink-0' />
      ) : (
        <CheckCircleIcon size={20} className='shrink-0' />
      )}
      <span>{lastMessage}</span>
      <button onClick={onDismiss} aria-label='Cerrar aviso'>
        <XIcon size={17} />
      </button>
    </output>
  )
}
