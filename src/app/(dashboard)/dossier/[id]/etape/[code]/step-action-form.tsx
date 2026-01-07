'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { documentTypeLabels } from '@/lib/utils'
import { Play, Send, Loader2 } from 'lucide-react'

interface StepActionFormProps {
  dossierId: string
  stepId: string
  stepStatus: string
  canComplete: boolean
  missingDocs: string[]
}

export function StepActionForm({
  dossierId,
  stepId,
  stepStatus,
  canComplete,
  missingDocs,
}: StepActionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleStart = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/steps/${stepId}/start`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/steps/${stepId}/complete`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {stepStatus === 'AVAILABLE' && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Cette étape est disponible. Cliquez sur le bouton ci-dessous pour la commencer.
          </p>
          <Button onClick={handleStart} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Commencer cette étape
          </Button>
        </div>
      )}

      {stepStatus === 'IN_PROGRESS' && (
        <div>
          {missingDocs.length > 0 ? (
            <Alert variant="warning" title="Documents manquants">
              <p>Veuillez téléverser les documents suivants avant de soumettre :</p>
              <ul className="list-disc list-inside mt-2">
                {missingDocs.map(doc => (
                  <li key={doc}>{documentTypeLabels[doc] || doc}</li>
                ))}
              </ul>
            </Alert>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Tous les documents sont téléversés. Vous pouvez soumettre cette étape pour validation.
              </p>
              <Button onClick={handleComplete} disabled={isLoading || !canComplete}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Soumettre pour validation
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
