'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X, Loader2 } from 'lucide-react'

interface AdminDocumentActionsProps {
  dossierId: string
  documentId: string
  documentName: string
}

export function AdminDocumentActions({
  dossierId,
  documentId,
  documentName,
}: AdminDocumentActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const router = useRouter()

  const handleValidate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/documents/${documentId}/validate`,
        { method: 'POST' }
      )

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

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Veuillez indiquer la raison du refus')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/admin/dossiers/${dossierId}/documents/${documentId}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectReason }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors du refus')
        return
      }

      router.refresh()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(false)
      setShowRejectForm(false)
    }
  }

  if (showRejectForm) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Raison du refus..."
          className="w-40"
        />
        <Button
          variant="danger"
          size="sm"
          onClick={handleReject}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refuser'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRejectForm(false)}
        >
          Annuler
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleValidate}
        disabled={isLoading}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowRejectForm(true)}
        disabled={isLoading}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
