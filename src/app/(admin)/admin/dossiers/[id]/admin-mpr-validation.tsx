'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  ExternalLink,
  History,
} from 'lucide-react'

interface MprHistory {
  id: string
  action: string
  previousValue: string | null
  newValue: string | null
  actorType: string
  message: string | null
  createdAt: string
}

interface AdminMprValidationProps {
  dossierId: string
  mprId: string | null
  mprStatus: string
  mprSubmittedAt: string | null
  mprHistory: MprHistory[]
  clientName: string
}

export function AdminMprValidation({
  dossierId,
  mprId,
  mprStatus,
  mprSubmittedAt,
  mprHistory,
  clientName,
}: AdminMprValidationProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectMessage, setRejectMessage] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [error, setError] = useState('')

  const handleApprove = async () => {
    setError('')
    setIsLoading('approve')

    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/mpr-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la validation')
        return
      }

      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectMessage.trim()) {
      setError('Veuillez indiquer la raison du rejet')
      return
    }

    setError('')
    setIsLoading('reject')

    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/mpr-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', message: rejectMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors du rejet')
        return
      }

      setShowRejectForm(false)
      setRejectMessage('')
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(null)
    }
  }

  const getStatusBadge = () => {
    switch (mprStatus) {
      case 'PENDING_REVIEW':
        return <Badge variant="warning">En attente de validation</Badge>
      case 'APPROVED':
        return <Badge variant="success">Validé</Badge>
      case 'REJECTED':
        return <Badge variant="error">Rejeté</Badge>
      default:
        return <Badge variant="secondary">Non renseigné</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'SUBMITTED':
        return 'Soumis'
      case 'MODIFIED':
        return 'Modifié'
      case 'APPROVED':
        return 'Approuvé'
      case 'REJECTED':
        return 'Rejeté'
      default:
        return action
    }
  }

  // Don't show if no MPR ID submitted yet
  if (!mprId && mprStatus === 'DRAFT') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Identifiant MaPrimeRénov'
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Le client n'a pas encore renseigné son identifiant MaPrimeRénov'</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={mprStatus === 'PENDING_REVIEW' ? 'border-amber-300 bg-amber-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>Identifiant MaPrimeRénov'</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Vérifiez l'identifiant soumis par {clientName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Current MPR ID */}
        <div className="p-4 bg-white border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Identifiant soumis</p>
              <p className="font-mono text-xl font-bold text-gray-900">{mprId}</p>
              {mprSubmittedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Soumis le {formatDate(mprSubmittedAt)}
                </p>
              )}
            </div>
            <a
              href="https://www.maprimerenov.gouv.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Vérifier sur MPR
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Validation Actions */}
        {mprStatus === 'PENDING_REVIEW' && (
          <div className="space-y-4">
            {!showRejectForm ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={isLoading !== null}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading === 'approve' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Valider l'identifiant
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isLoading !== null}
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                <p className="text-sm font-medium text-red-800">
                  Raison du rejet (sera communiquée au client)
                </p>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder="Ex: L'identifiant ne correspond pas au format attendu..."
                  className="w-full p-3 border border-red-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleReject}
                    disabled={isLoading !== null || !rejectMessage.trim()}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isLoading === 'reject' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Confirmer le rejet
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectMessage('')
                    }}
                    disabled={isLoading !== null}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {mprStatus === 'APPROVED' && (
          <Alert variant="success" title="Identifiant validé">
            Cet identifiant a été vérifié et validé.
          </Alert>
        )}

        {mprStatus === 'REJECTED' && (
          <Alert variant="error" title="Identifiant rejeté">
            Le client doit soumettre un nouvel identifiant.
          </Alert>
        )}

        {/* History */}
        {mprHistory && mprHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
            </h4>
            <div className="space-y-2">
              {mprHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 text-sm p-2 bg-gray-50 rounded"
                >
                  <div
                    className={`mt-0.5 w-2 h-2 rounded-full ${
                      entry.action === 'APPROVED'
                        ? 'bg-green-500'
                        : entry.action === 'REJECTED'
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-gray-900">
                      <span className="font-medium">{getActionLabel(entry.action)}</span>
                      {entry.newValue && (
                        <span className="text-gray-500"> - {entry.newValue}</span>
                      )}
                    </p>
                    {entry.message && (
                      <p className="text-gray-500 text-xs mt-0.5">{entry.message}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">
                      {formatDate(entry.createdAt)} par {entry.actorType === 'CLIENT' ? 'Client' : 'Admin'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
