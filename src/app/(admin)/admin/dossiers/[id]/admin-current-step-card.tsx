'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Check,
  X,
  Clock,
  ArrowRight,
  Eye,
  FileText,
  Download,
  Key,
  ExternalLink,
  AlertTriangle,
  Receipt,
  Home,
  CreditCard,
  CheckCircle,
} from 'lucide-react'

interface Document {
  id: string
  name: string
  filePath: string
  type: string
  fileSize?: number | null
}

interface QuoteDocument extends Document {
  workType?: string | null
  status: string
}

interface ProjectInfoData {
  energyType: string | null
  housingType: string | null
  housingSurface: number | null
  constructionYear: number | null
  revenueCategory: string | null
  householdSize: number | null
  ownershipStatus: string | null
}

interface AdminCurrentStepCardProps {
  dossierId: string
  stepId: string
  stepOrder: number
  stepName: string
  stepCode: string
  stepDescription: string
  stepStatus: string
  // Pour le mandat
  mandatDocument?: Document | null
  mandatStatus?: string
  // Pour l'identifiant MPR
  mprId?: string | null
  mprStatus?: string
  // Pour les infos projet
  projectInfoStatus?: string
  projectInfoData?: ProjectInfoData
  projectDocuments?: QuoteDocument[]
  // Pour les devis
  quotesDocuments?: QuoteDocument[]
  quotesStatus?: string
  // Pour les factures
  invoicesDocuments?: QuoteDocument[]
  invoicesStatus?: string
  // Pour le paiement
  paymentStatus?: string
  paymentAmount?: number | null
  paymentCompletedAt?: Date | null
}

export function AdminCurrentStepCard({
  dossierId,
  stepId,
  stepOrder,
  stepName,
  stepCode,
  stepDescription,
  stepStatus,
  mandatDocument,
  mandatStatus,
  mprId,
  mprStatus,
  projectInfoStatus,
  projectInfoData,
  projectDocuments = [],
  quotesDocuments = [],
  quotesStatus,
  invoicesDocuments = [],
  invoicesStatus,
  paymentStatus,
  paymentAmount,
  paymentCompletedAt,
}: AdminCurrentStepCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<'validate' | 'block' | 'approve' | 'reject' | 'quotes' | 'invoices' | null>(null)
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [rejectMessage, setRejectMessage] = useState('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<QuoteDocument | Document | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState<'mandat' | 'mpr' | 'projectInfo' | 'step' | 'quotes' | 'invoices' | null>(null)

  // Actions pour les étapes génériques
  const handleValidateStep = async () => {
    setIsLoading('validate')
    setShowConfirmModal(null)
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/steps/${stepId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors de la validation')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
    }
  }

  const handleBlockStep = async () => {
    if (!blockReason.trim()) {
      alert('Veuillez indiquer la raison du blocage')
      return
    }

    setIsLoading('block')
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

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
      setShowBlockForm(false)
    }
  }

  // Actions pour le mandat
  const handleValidateMandat = async () => {
    setIsLoading('validate')
    setShowConfirmModal(null)
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/mandate-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors de la validation')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
    }
  }

  const handleRejectMandat = async () => {
    if (!rejectMessage.trim()) {
      alert('Veuillez indiquer la raison du rejet')
      return
    }

    setIsLoading('reject')
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/mandate-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', message: rejectMessage }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors du rejet')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
      setShowRejectForm(false)
    }
  }

  // Actions pour l'identifiant MPR
  const handleApproveMpr = async () => {
    setIsLoading('approve')
    setShowConfirmModal(null)
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/mpr-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors de la validation')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
    }
  }

  const handleRejectMpr = async () => {
    if (!rejectMessage.trim()) {
      alert('Veuillez indiquer la raison du rejet')
      return
    }

    setIsLoading('reject')
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/mpr-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', message: rejectMessage }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors du rejet')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
      setShowRejectForm(false)
    }
  }

  // Actions pour les infos projet
  const handleApproveProjectInfo = async () => {
    setIsLoading('approve')
    setShowConfirmModal(null)
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/project-info-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors de la validation')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
    }
  }

  const handleRejectProjectInfo = async () => {
    if (!rejectMessage.trim()) {
      alert('Veuillez indiquer la raison du rejet')
      return
    }

    setIsLoading('reject')
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/project-info-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', message: rejectMessage }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors du rejet')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
      setShowRejectForm(false)
    }
  }

  // Actions pour les devis
  const handleValidateQuotes = async () => {
    setIsLoading('quotes')
    setShowConfirmModal(null)
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/quotes-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors de la validation')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
    }
  }

  const handleRejectQuotes = async () => {
    if (!rejectMessage.trim()) {
      alert('Veuillez indiquer la raison du rejet')
      return
    }

    setIsLoading('reject')
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/quotes-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', message: rejectMessage }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors du rejet')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
      setShowRejectForm(false)
    }
  }

  // Actions pour les factures
  const handleValidateInvoices = async () => {
    setIsLoading('invoices')
    setShowConfirmModal(null)
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/invoices-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors de la validation')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
    }
  }

  const handleRejectInvoices = async () => {
    if (!rejectMessage.trim()) {
      alert('Veuillez indiquer la raison du rejet')
      return
    }

    setIsLoading('reject')
    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/invoices-validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', message: rejectMessage }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors du rejet')
        return
      }

      window.location.reload()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(null)
      setShowRejectForm(false)
    }
  }

  // Télécharger le document
  const handleDownloadDocument = (doc: Document | QuoteDocument | null) => {
    if (doc?.filePath) {
      window.open(doc.filePath, '_blank')
    }
  }

  const isPendingValidation = stepStatus === 'PENDING_VALIDATION'
  const isBlocked = stepStatus === 'BLOCKED'
  const isMandateStep = stepCode === 'MANDATE_SIGNATURE'
  const isMprStep = stepCode === 'MPR_IDENTIFIER'
  const isProjectInfoStep = stepCode === 'PROJECT_INFO'
  const isPaymentStep = stepCode === 'PAYMENT'
  const isQuotesStep = stepCode === 'QUOTE_DEPOSIT'
  const isInvoicesStep = stepCode === 'INVOICE_DEPOSIT'
  const hasMandatToReview = isMandateStep && mandatStatus === 'PENDING_REVIEW' && mandatDocument
  const hasMprToReview = isMprStep && mprStatus === 'PENDING_REVIEW' && mprId
  const hasProjectInfoToReview = isProjectInfoStep && projectInfoStatus === 'PENDING_REVIEW' && projectInfoData
  const hasQuotesToReview = isQuotesStep && quotesStatus === 'PENDING_REVIEW' && quotesDocuments.length > 0
  const hasInvoicesToReview = isInvoicesStep && invoicesStatus === 'PENDING_REVIEW' && invoicesDocuments.length > 0
  const isPaymentPending = isPaymentStep && paymentStatus && paymentStatus !== 'SUCCEEDED'
  const isPaymentSucceeded = isPaymentStep && paymentStatus === 'SUCCEEDED'
  const needsAction = isPendingValidation || hasMandatToReview || hasMprToReview || hasProjectInfoToReview || hasQuotesToReview || hasInvoicesToReview

  // Labels pour les types
  const energyTypeLabels: Record<string, string> = {
    ELECTRICITY: 'Électricité',
    GAS: 'Gaz naturel',
    FUEL: 'Fioul',
    WOOD: 'Bois / Granulés',
    OTHER: 'Autre',
  }

  const housingTypeLabels: Record<string, string> = {
    HOUSE: 'Maison individuelle',
    APARTMENT: 'Appartement',
  }

  const revenueCategoryLabels: Record<string, string> = {
    VERY_MODEST: 'Très modeste (Bleu)',
    MODEST: 'Modeste (Jaune)',
    INTERMEDIATE: 'Intermédiaire (Violet)',
    SUPERIOR: 'Supérieur (Rose)',
  }

  // Composant pour afficher une ligne de document avec miniature
  const DocumentRow = ({ doc, onPreview }: { doc: QuoteDocument; onPreview: () => void }) => (
    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 hover:border-primary-200 transition-colors">
      {/* Miniature cliquable */}
      <button
        type="button"
        onClick={onPreview}
        className="relative flex-shrink-0 w-10 h-12 bg-gray-100 border border-gray-200 rounded overflow-hidden hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
      >
        <iframe
          src={doc.filePath}
          className="w-full h-full pointer-events-none scale-[0.5] origin-top-left"
          style={{ width: '200%', height: '200%' }}
          title="Aperçu"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Eye className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </button>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
        <p className="text-xs text-gray-500">
          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} Ko • PDF` : 'PDF'}
          {doc.workType && <span className="text-primary-600"> • {doc.workType}</span>}
        </p>
      </div>

      {/* Bouton voir */}
      <button
        type="button"
        onClick={onPreview}
        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
        title="Voir le document"
      >
        <Eye className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <>
      {/* Card avec design plus léger */}
      <div
        className={`rounded-2xl border-2 ${
          isBlocked
            ? 'border-red-300 bg-red-50'
            : needsAction
            ? 'border-primary-300 bg-white'
            : 'border-primary-200 bg-primary-50'
        }`}
        style={{
          boxShadow: needsAction
            ? '0 4px 20px rgba(118, 69, 251, 0.15)'
            : undefined
        }}
      >
        <div className="py-5 px-6">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${
                  isBlocked
                    ? 'bg-red-100'
                    : needsAction
                    ? 'bg-primary-100'
                    : 'bg-primary-100'
                }`}>
                  {needsAction ? (
                    <Clock className={`h-6 w-6 ${isBlocked ? 'text-red-600' : 'text-primary-600'}`} />
                  ) : isMandateStep ? (
                    <FileText className={`h-6 w-6 ${isBlocked ? 'text-red-600' : 'text-primary-600'}`} />
                  ) : isMprStep ? (
                    <Key className={`h-6 w-6 ${isBlocked ? 'text-red-600' : 'text-primary-600'}`} />
                  ) : isPaymentStep ? (
                    <CreditCard className={`h-6 w-6 ${isBlocked ? 'text-red-600' : isPaymentSucceeded ? 'text-green-600' : 'text-primary-600'}`} />
                  ) : isQuotesStep || isInvoicesStep ? (
                    <Receipt className={`h-6 w-6 ${isBlocked ? 'text-red-600' : 'text-primary-600'}`} />
                  ) : (
                    <ArrowRight className={`h-6 w-6 ${isBlocked ? 'text-red-600' : 'text-primary-600'}`} />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium mb-1 ${
                    isBlocked
                      ? 'text-red-600'
                      : needsAction
                      ? 'text-primary-600'
                      : 'text-primary-600'
                  }`}>
                    {needsAction
                      ? 'Action requise'
                      : isBlocked
                      ? 'Bloquée'
                      : 'Étape en cours'
                    }
                  </p>
                  <h3 className="text-lg font-bold text-gray-900">
                    Étape {stepOrder} : {stepName}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {stepDescription}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  needsAction
                    ? 'warning'
                    : isBlocked
                    ? 'error'
                    : 'info'
                }
              >
                {needsAction
                  ? 'À valider'
                  : isBlocked
                  ? 'Bloquée'
                  : 'En cours'
                }
              </Badge>
            </div>

            {/* Contenu spécifique au mandat */}
            {hasMandatToReview && mandatDocument && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <FileText className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mandatDocument.name}</p>
                      <p className="text-sm text-gray-500">Document soumis par le client</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewDocument(mandatDocument)
                      setShowPreviewModal(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir le mandat
                  </Button>
                </div>

                {/* Actions */}
                {!showRejectForm ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirmModal('mandat')}
                      disabled={isLoading !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading === 'validate' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Valider le mandat
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isLoading !== null}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
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
                      placeholder="Ex: Signature illisible, document incomplet..."
                      className="w-full p-3 border border-red-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRejectMandat}
                        disabled={isLoading !== null || !rejectMessage.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading === 'reject' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
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

            {/* Contenu spécifique à l'identifiant MPR */}
            {hasMprToReview && mprId && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Key className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Identifiant soumis</p>
                      <p className="font-mono text-xl font-bold text-gray-900">{mprId}</p>
                    </div>
                  </div>
                  <a
                    href="https://www.maprimerenov.gouv.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Vérifier sur MPR
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Actions */}
                {!showRejectForm ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirmModal('mpr')}
                      disabled={isLoading !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading === 'approve' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Valider l'identifiant
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isLoading !== null}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
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
                      className="w-full p-3 border border-red-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRejectMpr}
                        disabled={isLoading !== null || !rejectMessage.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading === 'reject' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
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

            {/* Contenu spécifique aux infos projet */}
            {hasProjectInfoToReview && projectInfoData && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <Home className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Informations projet</p>
                      <p className="text-sm text-gray-500">Vérifiez les informations et documents</p>
                    </div>
                  </div>
                </div>

                {/* Infos en grille */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Type de logement</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {projectInfoData.housingType ? housingTypeLabels[projectInfoData.housingType] || projectInfoData.housingType : '-'}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Surface</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {projectInfoData.housingSurface ? `${projectInfoData.housingSurface} m²` : '-'}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Année</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {projectInfoData.constructionYear || '-'}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Énergie</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {projectInfoData.energyType ? energyTypeLabels[projectInfoData.energyType] || projectInfoData.energyType : '-'}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Revenus</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {projectInfoData.revenueCategory ? revenueCategoryLabels[projectInfoData.revenueCategory] || projectInfoData.revenueCategory : '-'}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Foyer</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {projectInfoData.householdSize ? `${projectInfoData.householdSize} pers.` : '-'}
                    </p>
                  </div>
                </div>

                {/* Documents */}
                {projectDocuments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">{projectDocuments.length} documents déposés</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {projectDocuments.map((doc) => (
                        <DocumentRow
                          key={doc.id}
                          doc={doc}
                          onPreview={() => {
                            setPreviewDocument(doc)
                            setShowPreviewModal(true)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!showRejectForm ? (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setShowConfirmModal('projectInfo')}
                      disabled={isLoading !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading === 'approve' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Valider les informations
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isLoading !== null}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
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
                      placeholder="Ex: Document illisible, informations incohérentes..."
                      className="w-full p-3 border border-red-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRejectProjectInfo}
                        disabled={isLoading !== null || !rejectMessage.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading === 'reject' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
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

            {/* Contenu spécifique au paiement */}
            {isPaymentStep && (
              <div className={`rounded-xl p-4 space-y-4 border ${
                isPaymentSucceeded
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isPaymentSucceeded ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      {isPaymentSucceeded ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {isPaymentSucceeded ? 'Paiement confirmé' : 'En attente de paiement'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isPaymentSucceeded
                          ? `${paymentAmount ? (paymentAmount / 100).toFixed(0) : '290'} € payés`
                          : 'Le client doit régler les frais de dossier (290 €)'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isPaymentSucceeded ? 'success' : 'warning'}>
                    {isPaymentSucceeded ? 'Payé' : paymentStatus === 'PENDING' ? 'En cours' : 'Non payé'}
                  </Badge>
                </div>

                {isPaymentSucceeded && paymentCompletedAt && (
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600">
                      Paiement effectué le{' '}
                      <span className="font-medium text-gray-900">
                        {new Date(paymentCompletedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </p>
                  </div>
                )}

                {!isPaymentSucceeded && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Étape auto-validée :</strong> Cette étape sera automatiquement validée
                      une fois le paiement confirmé par Stripe. Aucune action admin requise.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Contenu spécifique aux devis */}
            {hasQuotesToReview && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{quotesDocuments.length} devis soumis</p>
                      <p className="text-sm text-gray-500">Cliquez sur un devis pour le visualiser</p>
                    </div>
                  </div>
                </div>

                {/* Liste des devis avec miniatures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quotesDocuments.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      onPreview={() => {
                        setPreviewDocument(doc)
                        setShowPreviewModal(true)
                      }}
                    />
                  ))}
                </div>

                {/* Actions */}
                {!showRejectForm ? (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setShowConfirmModal('quotes')}
                      disabled={isLoading !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading === 'quotes' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Valider tous les devis
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isLoading !== null}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
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
                      placeholder="Ex: Devis incomplet, montant incorrect..."
                      className="w-full p-3 border border-red-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRejectQuotes}
                        disabled={isLoading !== null || !rejectMessage.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading === 'reject' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
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

            {/* Contenu spécifique aux factures */}
            {hasInvoicesToReview && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Receipt className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{invoicesDocuments.length} factures soumises</p>
                      <p className="text-sm text-gray-500">Cliquez sur une facture pour la visualiser</p>
                    </div>
                  </div>
                </div>

                {/* Liste des factures avec miniatures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {invoicesDocuments.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      onPreview={() => {
                        setPreviewDocument(doc)
                        setShowPreviewModal(true)
                      }}
                    />
                  ))}
                </div>

                {/* Actions */}
                {!showRejectForm ? (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => setShowConfirmModal('invoices')}
                      disabled={isLoading !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading === 'invoices' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Valider toutes les factures
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                      disabled={isLoading !== null}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
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
                      placeholder="Ex: Facture incomplète, montant différent du devis..."
                      className="w-full p-3 border border-red-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRejectInvoices}
                        disabled={isLoading !== null || !rejectMessage.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading === 'reject' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
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

            {/* Actions génériques pour les autres étapes en attente de validation */}
            {isPendingValidation && !hasMandatToReview && !hasMprToReview && !hasProjectInfoToReview && !hasQuotesToReview && !hasInvoicesToReview && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                {!showBlockForm ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirmModal('step')}
                      disabled={isLoading !== null}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isLoading === 'validate' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Valider l'étape
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowBlockForm(true)}
                      disabled={isLoading !== null}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Bloquer
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-red-800">
                      Raison du blocage (sera communiquée au client)
                    </p>
                    <Input
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Raison du blocage..."
                      className="bg-white"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBlockStep}
                        disabled={isLoading !== null || !blockReason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isLoading === 'block' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Confirmer le blocage
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowBlockForm(false)
                          setBlockReason('')
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
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowConfirmModal(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirmer la validation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Cette action est irréversible
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                {showConfirmModal === 'mandat' && (
                  <>Êtes-vous sûr de vouloir <strong>valider ce mandat</strong> ? Le client passera à l'étape suivante.</>
                )}
                {showConfirmModal === 'mpr' && (
                  <>Êtes-vous sûr de vouloir <strong>valider cet identifiant MaPrimeRénov'</strong> ? Le client passera à l'étape suivante.</>
                )}
                {showConfirmModal === 'projectInfo' && (
                  <>Êtes-vous sûr de vouloir <strong>valider ces informations projet</strong> ? Le client passera à l'étape signature du mandat.</>
                )}
                {showConfirmModal === 'quotes' && (
                  <>Êtes-vous sûr de vouloir <strong>valider tous les devis</strong> ? Le client passera à l'étape suivante.</>
                )}
                {showConfirmModal === 'invoices' && (
                  <>Êtes-vous sûr de vouloir <strong>valider toutes les factures</strong> ? Le client passera à l'étape suivante.</>
                )}
                {showConfirmModal === 'step' && (
                  <>Êtes-vous sûr de vouloir <strong>valider cette étape</strong> ? Le client passera à l'étape suivante.</>
                )}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmModal(null)}
                  className="flex-1"
                  disabled={isLoading !== null}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (showConfirmModal === 'mandat') handleValidateMandat()
                    else if (showConfirmModal === 'mpr') handleApproveMpr()
                    else if (showConfirmModal === 'projectInfo') handleApproveProjectInfo()
                    else if (showConfirmModal === 'quotes') handleValidateQuotes()
                    else if (showConfirmModal === 'invoices') handleValidateInvoices()
                    else handleValidateStep()
                  }}
                  disabled={isLoading !== null}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Confirmer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'aperçu du document */}
      {showPreviewModal && previewDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            setShowPreviewModal(false)
            setPreviewDocument(null)
          }}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header de la modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 truncate max-w-md">
                    {previewDocument.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {previewDocument.fileSize ? `${(previewDocument.fileSize / 1024).toFixed(1)} Ko • ` : ''}PDF
                    {' • '}
                    {'workType' in previewDocument && previewDocument.workType
                      ? previewDocument.workType
                      : previewDocument.type === 'MANDAT'
                      ? 'Mandat administratif'
                      : previewDocument.type === 'DEVIS'
                      ? 'Devis'
                      : 'Facture'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(previewDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreviewModal(false)
                    setPreviewDocument(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenu de l'aperçu */}
            <div className="flex-1 overflow-hidden bg-gray-100 p-4">
              <iframe
                src={previewDocument.filePath}
                className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200 bg-white"
                title="Aperçu du document"
              />
            </div>

            {/* Footer de la modal */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreviewModal(false)
                  setPreviewDocument(null)
                }}
              >
                Fermer
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownloadDocument(previewDocument)}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
