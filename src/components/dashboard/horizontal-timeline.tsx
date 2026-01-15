'use client'

import { cn } from '@/lib/utils'
import { Check, Lock, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { StepWithTemplate } from '@/types'

interface HorizontalTimelineProps {
  steps: StepWithTemplate[]
  dossierId: string
  currentStepId?: string | null
}

function getStepIcon(status: string) {
  switch (status) {
    case 'VALIDATED':
      return <Check className="h-4 w-4" />
    case 'LOCKED':
      return <Lock className="h-3 w-3" />
    case 'BLOCKED':
      return <AlertCircle className="h-4 w-4" />
    default:
      return null
  }
}

function getStepStyles(status: string, isAdminOnly: boolean) {
  if (status === 'VALIDATED') {
    return {
      circle: 'bg-kopro-success text-white border-kopro-success',
      line: 'bg-kopro-success',
      text: 'text-kopro-success',
    }
  }
  if (status === 'LOCKED') {
    return {
      circle: 'bg-gray-200 text-gray-400 border-gray-300',
      line: 'bg-gray-200',
      text: 'text-gray-400',
    }
  }
  if (status === 'BLOCKED') {
    return {
      circle: 'bg-kopro-required text-white border-kopro-required',
      line: 'bg-gray-200',
      text: 'text-kopro-required',
    }
  }
  if (status === 'PENDING_VALIDATION') {
    return {
      circle: 'bg-accent text-white border-accent',
      line: 'bg-gray-200',
      text: 'text-accent',
    }
  }
  if (status === 'IN_PROGRESS' || status === 'AVAILABLE') {
    return {
      circle: 'bg-primary-600 text-white border-primary-600',
      line: 'bg-gray-200',
      text: 'text-primary-600',
    }
  }
  return {
    circle: 'bg-gray-200 text-gray-400 border-gray-300',
    line: 'bg-gray-200',
    text: 'text-gray-400',
  }
}

export function HorizontalTimeline({ steps, dossierId, currentStepId }: HorizontalTimelineProps) {
  return (
    <div className="w-full">
      {/* Desktop horizontal timeline */}
      <div className="hidden md:block">
        <div className="flex items-start justify-between">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1
            const isClickable = step.status !== 'LOCKED'
            const isCurrent = step.id === currentStepId
            const styles = getStepStyles(step.status, step.template.adminOnly)

            const stepContent = (
              <div className="flex-1 relative flex flex-col items-center">
                <div className="flex items-center w-full justify-center">
                  {/* Circle */}
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                      styles.circle,
                      isCurrent && 'ring-2 ring-offset-2 ring-primary-500',
                      isClickable && 'cursor-pointer hover:scale-110'
                    )}
                  >
                    {step.status === 'VALIDATED' ? (
                      getStepIcon(step.status)
                    ) : step.status === 'LOCKED' ? (
                      getStepIcon(step.status)
                    ) : step.status === 'BLOCKED' ? (
                      getStepIcon(step.status)
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                  </div>

                  {/* Connecting line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'flex-1 h-1 mx-1',
                        index < steps.findIndex(s => s.status !== 'VALIDATED')
                          ? 'bg-kopro-success'
                          : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 w-full flex flex-col items-center">
                  <p
                    className={cn(
                      'text-xs font-medium text-center truncate max-w-[100px]',
                      styles.text
                    )}
                    title={step.template.name}
                  >
                    {step.template.name}
                  </p>
                  {step.template.adminOnly && (
                    <p className="text-[10px] text-purple-500 text-center mt-0.5">
                      Admin
                    </p>
                  )}
                </div>
              </div>
            )

            if (isClickable) {
              return (
                <Link
                  key={step.id}
                  href={`/dossier/${dossierId}/etape/${step.template.code}`}
                  className="flex-1"
                >
                  {stepContent}
                </Link>
              )
            }

            return (
              <div key={step.id} className="flex-1">
                {stepContent}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile vertical compact timeline */}
      <div className="md:hidden">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1
            const isClickable = step.status !== 'LOCKED'
            const styles = getStepStyles(step.status, step.template.adminOnly)

            const stepContent = (
              <>
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
                    styles.circle,
                    isClickable && 'cursor-pointer'
                  )}
                >
                  {step.status === 'VALIDATED' ? (
                    <Check className="h-3 w-3" />
                  ) : step.status === 'LOCKED' ? (
                    <Lock className="h-2 w-2" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'w-4 h-0.5 flex-shrink-0',
                      index < steps.findIndex(s => s.status !== 'VALIDATED')
                        ? 'bg-kopro-success'
                        : 'bg-gray-200'
                    )}
                  />
                )}
              </>
            )

            if (isClickable) {
              return (
                <Link
                  key={step.id}
                  href={`/dossier/${dossierId}/etape/${step.template.code}`}
                  className="flex items-center"
                >
                  {stepContent}
                </Link>
              )
            }

            return (
              <div key={step.id} className="flex items-center">
                {stepContent}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
