'use client'

import {
  ArrowUpRightIcon,
  CheckCircleIcon,
  ClockIcon,
  LockSimpleIcon,
  QuestionIcon
} from '@phosphor-icons/react'

import { statusLabels } from '@/helpers/academic.helpers'
import type { Status } from '@/helpers/academic.helpers'

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status status-${status}`}>
      {status === 'passed' ? (
        <CheckCircleIcon size={14} weight='fill' />
      ) : status === 'in-progress' ? (
        <ClockIcon size={14} />
      ) : status === 'available' ? (
        <ArrowUpRightIcon size={14} />
      ) : status === 'blocked' ? (
        <LockSimpleIcon size={13} />
      ) : (
        <QuestionIcon size={14} />
      )}
      {statusLabels[status]}
    </span>
  )
}
