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
  Receipt,
  FileText,
  Home,
  Flame,
  Droplets,
  Wind,
  Download,
} from 'lucide-react'

interface Document {
  id: string
  name: string
  workType: string | null
  status: string
  filePath: string
  uploadedAt: string
}

interface AdminInvoicesValidationProps {
  dossierId: string
  invoicesStatus: string
  invoicesSubmittedAt: string | null
  invoicesReviewMessage: string | null
  documents: Document[]
  clientName: string
  selectedWorks: string[]
}

const workIcons: Record<string, React.ReactNode> = {
  ISOLATION: <Home className="h-4 w-4" />,
  HEATING: <Flame className="h-4 w-4" />,
  HOT_WATER: <Droplets className="h-4 w-4" />,
  VENTILATION: <Wind className="h-4 w-4" />,
}

export function AdminInvoicesValidation({
  dossierId,
  invoicesStatus,
  invoicesSubmittedAt,
  invoicesReviewMessage,
  documents,
  clientName,
  selectedWorks,
}: AdminInvoicesValidationProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectMessage, setRejectMessage] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [error, setError] = useState('')

  // Group documents by work type
  const documentsByWork = documents.reduce((acc, doc) => {
    if (doc.workType) {
      if (!acc[doc.workType]) acc[doc.workType] = []
      acc[doc.workType].push(doc)
    }
    return acc
  }, {} as Record<string, Document[]>)

  const handleApprove = async () => {
    setError('')
    setIsLoading('approve')

    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/invoices-validate`, {
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
      const response = await fetch(`/api/admin/dossiers/${dossierId}/invoices-validate`, {
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
    switch (invoicesStatus) {
      case 'PENDING_REVIEW':
        return <Badge variant="warning">En attente de validation</Badge>
      case 'APPROVED':
        return <Badge variant="success">Validées</Badge>
      case 'REJECTED':
        return <Badge variant="error">Rejetées</Badge>
      default:
        return <Badge variant="default">Non déposées</Badge>
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

  // Don't show if no invoices submitted yet
  if (invoicesStatus === 'DRAFT' && documents.length === 0) {
    return null
  }

  return (
    <Card className={invoicesStatus === 'PENDING_REVIEW' ? 'border-amber-300 bg-amber-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <CardTitle>Factures finales</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Vérifiez les factures soumises par {clientName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Submission info */}
        {invoicesSubmittedAt && (
          <div className="p-3 bg-white border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Soumis le {formatDate(invoicesSubmittedAt)}</span>
            </div>
          </div>
        )}

        {/* Documents grouped by work type */}
        <div className="space-y-4">
          {selectedWorks.map(workCode => {
            const work = WORK_TYPES.find(w => w.code === workCode)
            const docs = documentsByWork[workCode] || []

            return (
              <div
                key={workCode}
                className="p-4 bg-white border rounded-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    {workIcons[workCode]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{work?.label}</h4>
                    <p className="text-sm text-gray-500">
                      {docs.length} facture(s)
                    </p>
                  </div>
                  {docs.length > 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                {docs.length > 0 && (
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
                        <a
                          href={doc.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Validation Actions */}
        {invoicesStatus === 'PENDING_REVIEW' && (
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
                  Valider les factures
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
                  placeholder="Ex: Les factures ne correspondent pas aux devis validés..."
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
        {invoicesStatus === 'APPROVED' && (
          <Alert variant="success" title="Factures validées">
            Les factures ont été vérifiées et validées. Le dossier est complet.
          </Alert>
        )}

        {invoicesStatus === 'REJECTED' && invoicesReviewMessage && (
          <Alert variant="error" title="Factures rejetées">
            {invoicesReviewMessage}
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
