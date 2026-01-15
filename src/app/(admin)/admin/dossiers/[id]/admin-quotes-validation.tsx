'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { WORK_TYPES } from '@/lib/utils'
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Download,
  Home,
  Flame,
  Droplets,
  Wind,
} from 'lucide-react'

interface QuoteDocument {
  id: string
  name: string
  workType: string | null
  status: string
  filePath: string
  uploadedAt: string
}

interface AdminQuotesValidationProps {
  dossierId: string
  quotesStatus: string
  quotesSubmittedAt: string | null
  quotesReviewMessage: string | null
  documents: QuoteDocument[]
  selectedWorks: string[]
  clientName: string
}

const workIcons: Record<string, React.ReactNode> = {
  ISOLATION: <Home className="h-4 w-4" />,
  HEATING: <Flame className="h-4 w-4" />,
  HOT_WATER: <Droplets className="h-4 w-4" />,
  VENTILATION: <Wind className="h-4 w-4" />,
}

export function AdminQuotesValidation({
  dossierId,
  quotesStatus,
  quotesSubmittedAt,
  quotesReviewMessage,
  documents,
  selectedWorks,
  clientName,
}: AdminQuotesValidationProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectMessage, setRejectMessage] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [error, setError] = useState('')

  // Filter only quote documents
  const quoteDocuments = documents.filter(d => d.workType !== null)

  // Group documents by work type
  const documentsByWork = quoteDocuments.reduce((acc, doc) => {
    if (doc.workType) {
      if (!acc[doc.workType]) acc[doc.workType] = []
      acc[doc.workType].push(doc)
    }
    return acc
  }, {} as Record<string, QuoteDocument[]>)

  const handleApprove = async () => {
    setError('')
    setIsLoading('approve')

    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/quotes-validate`, {
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
      const response = await fetch(`/api/admin/dossiers/${dossierId}/quotes-validate`, {
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
    switch (quotesStatus) {
      case 'PENDING_REVIEW':
        return <Badge variant="warning">En attente de validation</Badge>
      case 'APPROVED':
        return <Badge variant="success">Validés</Badge>
      case 'REJECTED':
        return <Badge variant="error">Rejetés</Badge>
      default:
        return <Badge variant="secondary">Non soumis</Badge>
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

  const getWorkLabel = (code: string) => {
    return WORK_TYPES.find(w => w.code === code)?.label || code
  }

  // Don't show if no quotes submitted yet
  if (quotesStatus === 'DRAFT' && quoteDocuments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Devis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Le client n'a pas encore déposé de devis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={quotesStatus === 'PENDING_REVIEW' ? 'border-amber-300 bg-amber-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Devis</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Vérifiez les devis soumis par {clientName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Submission Info */}
        {quotesSubmittedAt && (
          <div className="p-3 bg-white border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              Soumis le {formatDate(quotesSubmittedAt)}
            </div>
          </div>
        )}

        {/* Documents by Work Type */}
        <div className="space-y-4">
          {selectedWorks.map(workCode => {
            const docs = documentsByWork[workCode] || []

            return (
              <div
                key={workCode}
                className="p-4 bg-white border rounded-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-primary-100 text-primary-600 rounded">
                    {workIcons[workCode]}
                  </div>
                  <h4 className="font-medium text-gray-900">{getWorkLabel(workCode)}</h4>
                  <Badge variant={docs.length > 0 ? 'success' : 'error'}>
                    {docs.length} devis
                  </Badge>
                </div>

                {docs.length === 0 ? (
                  <p className="text-sm text-red-600">Aucun devis déposé</p>
                ) : (
                  <div className="space-y-2">
                    {docs.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-500 hover:text-primary-600"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Validation Actions */}
        {quotesStatus === 'PENDING_REVIEW' && (
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
                  Valider les devis
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
                  placeholder="Ex: Devis incomplet, montant incorrect, entreprise non certifiée RGE..."
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
        {quotesStatus === 'APPROVED' && (
          <Alert variant="success" title="Devis validés">
            Tous les devis ont été vérifiés et validés.
          </Alert>
        )}

        {quotesStatus === 'REJECTED' && quotesReviewMessage && (
          <Alert variant="error" title="Devis rejetés">
            {quotesReviewMessage}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
