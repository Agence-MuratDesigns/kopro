'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Key,
  ExternalLink,
  History,
  ChevronDown,
  ChevronUp,
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
  const [isExpanded, setIsExpanded] = useState(false)

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
        if (data.error?.includes('pas en attente')) {
          window.location.reload()
          return
        }
        setError(data.error || 'Erreur lors de la validation')
        return
      }

      window.location.reload()
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
        if (data.error?.includes('pas en attente')) {
          window.location.reload()
          return
        }
        setError(data.error || 'Erreur lors du rejet')
        return
      }

      window.location.reload()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(null)
    }
  }

  const getStatusBadge = () => {
    switch (mprStatus) {
      case 'PENDING_REVIEW':
        return <Badge variant="warning">En attente</Badge>
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
      <div className="border border-gray-200 rounded-xl bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Key className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Identifiant MaPrimeRénov'</p>
              <p className="text-xs text-gray-500">Non renseigné par le client</p>
            </div>
          </div>
          <Badge variant="secondary">En attente</Badge>
        </div>
      </div>
    )
  }

  // Compact view when approved/rejected (not pending)
  const isPending = mprStatus === 'PENDING_REVIEW'

  return (
    <div className={`border rounded-xl bg-white overflow-hidden ${isPending ? 'border-amber-300' : 'border-gray-200'}`}>
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${isPending ? 'bg-amber-50' : ''}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isPending ? 'bg-amber-100' : 'bg-gray-100'}`}>
            <Key className={`h-5 w-5 ${isPending ? 'text-amber-600' : 'text-gray-500'}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">Identifiant MaPrimeRénov'</p>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-500 font-mono mt-0.5">{mprId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          {error && (
            <Alert variant="error" title="Erreur" className="mt-4">
              {error}
            </Alert>
          )}

          {/* Details */}
          <div className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Soumis par {clientName}</p>
              {mprSubmittedAt && (
                <p className="text-xs text-gray-400">
                  {formatDate(mprSubmittedAt)}
                </p>
              )}
            </div>
            <a
              href="https://www.maprimerenov.gouv.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Vérifier sur MPR
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Validation Actions */}
          {isPending && (
            <div className="space-y-3">
              {!showRejectForm ? (
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={isLoading !== null}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading === 'approve' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Valider
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    disabled={isLoading !== null}
                    size="sm"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                  <p className="text-xs font-medium text-red-800">
                    Raison du rejet
                  </p>
                  <textarea
                    value={rejectMessage}
                    onChange={(e) => setRejectMessage(e.target.value)}
                    placeholder="Ex: L'identifiant ne correspond pas..."
                    className="w-full p-2 border border-red-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReject}
                      disabled={isLoading !== null || !rejectMessage.trim()}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isLoading === 'reject' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Confirmer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
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
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              Identifiant vérifié et validé
            </div>
          )}

          {mprStatus === 'REJECTED' && (
            <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 px-3 py-2 rounded-lg">
              <XCircle className="h-4 w-4" />
              Le client doit soumettre un nouvel identifiant
            </div>
          )}

          {/* History */}
          {mprHistory && mprHistory.length > 0 && (
            <div>
              <button
                type="button"
                className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1 hover:text-gray-700"
              >
                <History className="h-3 w-3" />
                Historique ({mprHistory.length})
              </button>
              <div className="space-y-1">
                {mprHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded"
                  >
                    <div
                      className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        entry.action === 'APPROVED'
                          ? 'bg-green-500'
                          : entry.action === 'REJECTED'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-700">{getActionLabel(entry.action)}</span>
                      {entry.newValue && (
                        <span className="text-gray-500"> - {entry.newValue}</span>
                      )}
                      <p className="text-gray-400 mt-0.5">
                        {formatDate(entry.createdAt)} • {entry.actorType === 'CLIENT' ? 'Client' : 'Admin'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
