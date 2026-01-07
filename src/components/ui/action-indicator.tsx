'use client'

import { useRealtime } from '@/contexts/realtime-context'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function ActionIndicator() {
  const { currentAction, pendingActions } = useRealtime()

  if (!currentAction) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-slide-in-up">
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg',
        'bg-white border border-gray-200 backdrop-blur-sm'
      )}>
        <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentAction.description}
        </span>
        {pendingActions.length > 1 && (
          <span className="text-xs text-gray-400">
            +{pendingActions.length - 1} en attente
          </span>
        )}
      </div>
    </div>
  )
}
