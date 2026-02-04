'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DossierNavigatorProps {
  currentIndex: number
  total: number
  onPrevious: () => void
  onNext: () => void
  currentReference: string
}

export function DossierNavigator({
  currentIndex,
  total,
  onPrevious,
  onNext,
  currentReference,
}: DossierNavigatorProps) {
  // Ne pas afficher si un seul dossier
  if (total <= 1) return null

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={currentIndex === 0}
        className="h-8 w-8 p-0 hover:bg-accent-light disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1.5 px-2">
        <span className="text-sm font-semibold text-kopro-dark">
          {currentReference}
        </span>
        <span className="text-xs text-kopro-grey">
          ({currentIndex + 1}/{total})
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={currentIndex === total - 1}
        className="h-8 w-8 p-0 hover:bg-accent-light disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
