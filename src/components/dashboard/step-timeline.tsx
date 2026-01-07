'use client'

import { cn } from '@/lib/utils'
import { stepStatusColors, stepStatusLabels, categoryColors, categoryLabels } from '@/lib/utils'
import { Check, Lock, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { StepWithTemplate } from '@/types'

interface StepTimelineProps {
  steps: StepWithTemplate[]
  dossierId: string
  currentStepId?: string | null
}

function getStepIcon(status: string) {
  switch (status) {
    case 'VALIDATED':
      return <Check className="h-4 w-4" />
    case 'LOCKED':
      return <Lock className="h-4 w-4" />
    case 'BLOCKED':
      return <AlertCircle className="h-4 w-4" />
    case 'PENDING_VALIDATION':
    case 'IN_PROGRESS':
    case 'AVAILABLE':
      return <Clock className="h-4 w-4" />
    default:
      return null
  }
}

function getStepStyles(status: string) {
  switch (status) {
    case 'VALIDATED':
      return {
        circle: 'bg-green-500 text-white',
        line: 'bg-green-500',
        bg: 'bg-green-50 border-green-200',
      }
    case 'LOCKED':
      return {
        circle: 'bg-gray-300 text-gray-500',
        line: 'bg-gray-300',
        bg: 'bg-gray-50 border-gray-200',
      }
    case 'BLOCKED':
      return {
        circle: 'bg-red-500 text-white',
        line: 'bg-gray-300',
        bg: 'bg-red-50 border-red-200',
      }
    case 'IN_PROGRESS':
      return {
        circle: 'bg-yellow-500 text-white animate-pulse',
        line: 'bg-gray-300',
        bg: 'bg-yellow-50 border-yellow-300',
      }
    case 'PENDING_VALIDATION':
      return {
        circle: 'bg-purple-500 text-white',
        line: 'bg-gray-300',
        bg: 'bg-purple-50 border-purple-200',
      }
    case 'AVAILABLE':
      return {
        circle: 'bg-blue-500 text-white',
        line: 'bg-gray-300',
        bg: 'bg-blue-50 border-blue-300',
      }
    default:
      return {
        circle: 'bg-gray-300 text-gray-500',
        line: 'bg-gray-300',
        bg: 'bg-gray-50 border-gray-200',
      }
  }
}

export function StepTimeline({ steps, dossierId, currentStepId }: StepTimelineProps) {
  // Group steps by category
  const groupedSteps = steps.reduce((acc, step) => {
    const category = step.template.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(step)
    return acc
  }, {} as Record<string, StepWithTemplate[]>)

  const categories = Object.keys(groupedSteps)

  return (
    <div className="space-y-6">
      {categories.map((category, catIndex) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3">
            <div className={cn('w-3 h-3 rounded-full', categoryColors[category])} />
            <h3 className="text-sm font-semibold text-gray-700">
              {categoryLabels[category] || category}
            </h3>
          </div>

          <div className="relative ml-1.5">
            {groupedSteps[category].map((step, stepIndex) => {
              const isLast = stepIndex === groupedSteps[category].length - 1
              const styles = getStepStyles(step.status)
              const isClickable = step.status !== 'LOCKED'
              const isCurrent = step.id === currentStepId

              const content = (
                <div
                  className={cn(
                    'relative flex items-start group',
                    !isLast && 'pb-6'
                  )}
                >
                  {/* Vertical line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'absolute left-3.5 top-7 w-0.5 h-full -ml-px',
                        styles.line
                      )}
                    />
                  )}

                  {/* Circle indicator */}
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-7 h-7 rounded-full',
                      styles.circle
                    )}
                  >
                    {getStepIcon(step.status)}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      'ml-4 flex-1 p-3 rounded-lg border transition-all',
                      styles.bg,
                      isClickable && 'cursor-pointer hover:shadow-md',
                      isCurrent && 'ring-2 ring-primary-500 ring-offset-2'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {step.template.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {step.template.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            stepStatusColors[step.status]
                          )}
                        >
                          {stepStatusLabels[step.status]}
                        </span>
                        {isClickable && (
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        )}
                      </div>
                    </div>

                    {step.blockedReason && (
                      <p className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                        {step.blockedReason}
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
                  >
                    {content}
                  </Link>
                )
              }

              return <div key={step.id}>{content}</div>
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
