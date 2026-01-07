'use client'

import { Button } from '@/components/ui/button'
import { CheckCheck } from 'lucide-react'

export function MarkAllReadButton() {
  return (
    <Button variant="outline" size="sm" disabled>
      <CheckCheck className="h-4 w-4 mr-2" />
      Tout marquer comme lu
    </Button>
  )
}
