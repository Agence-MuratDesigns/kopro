'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X, Loader2 } from 'lucide-react'

interface AdminStepActionsProps {
  dossierId: string
  stepId: string
  stepName: string
}

export function AdminStepActions({ dossierId, stepId, stepName }: AdminStepActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [notes, setNotes] = useState('')
  const router = useRouter()

  const handleValidate = async () => {
    if (!confirm(`Voulez-vous valider l'étape "${stepName}" ?`)) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/steps/${stepId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors de la validation')
        return
      }

      router.refresh()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      alert('Veuillez indiquer la raison du blocage')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/steps/${stepId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blockReason }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors du blocage')
        return
      }

      router.refresh()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(false)
      setShowBlockForm(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gray-600 mb-1">Notes (optionnel)</label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajouter des notes..."
        />
      </div>

      {showBlockForm ? (
        <div className="space-y-3 p-3 bg-red-50 rounded-lg">
          <Input
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Raison du blocage..."
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleBlock}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer le blocage'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBlockForm(false)}
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={handleValidate}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Valider
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowBlockForm(true)}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Bloquer
          </Button>
        </div>
      )}
    </div>
  )
}
