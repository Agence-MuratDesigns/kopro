'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { WORK_TYPES, formatDate, formatCurrency, formatDossierStatus } from '@/lib/utils'
import Link from 'next/link'
import {
  CheckCircle,
  Download,
  FileText,
  Home,
  Flame,
  Droplets,
  Wind,
  Calendar,
  Euro,
  Clock,
  Award,
  ArrowLeft,
  Loader2,
  Eye,
  X,
} from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  uploadedAt: string
  url?: string
  size?: number
}

interface FinalRecapProps {
  dossier: {
    id: string
    reference: string
    status: string
    createdAt: string
    closedAt: string | null
    mprId: string | null
    selectedWorks: string | null
    totalWorksAmount: number | null
    mprAmount: number | null
    ceeAmount: number | null
    mprPaidAmount: number | null
    ceePaidAmount: number | null
    paymentStatus: string
  }
  client: {
    firstName: string
    lastName: string
  }
  documents: Document[]
}

const workIcons: Record<string, React.ReactNode> = {
  ISOLATION: <Home className="h-5 w-5" />,
  HEATING: <Flame className="h-5 w-5" />,
  HOT_WATER: <Droplets className="h-5 w-5" />,
  VENTILATION: <Wind className="h-5 w-5" />,
}

export function FinalRecap({ dossier, client, documents }: FinalRecapProps) {
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)

  const selectedWorks: string[] = dossier.selectedWorks
    ? JSON.parse(dossier.selectedWorks)
    : []

  const isClosed = dossier.status === 'CLOTURE'
  const totalEstimatedAids = (dossier.mprAmount || 0) + (dossier.ceeAmount || 0)
  const totalPaidAids = (dossier.mprPaidAmount || 0) + (dossier.ceePaidAmount || 0)

  // Group documents by category
  const adminDocs = documents.filter(d => ['MANDAT', 'ATTESTATION'].includes(d.type))
  const techDocs = documents.filter(d => ['DEVIS', 'FACTURE'].includes(d.type))

  const getPaymentStatusDisplay = () => {
    switch (dossier.paymentStatus) {
      case 'PAID':
        return { label: 'Versé', variant: 'success' as const }
      case 'IN_PROGRESS':
        return { label: 'En cours', variant: 'warning' as const }
      default:
        return { label: 'En attente', variant: 'secondary' as const }
    }
  }

  const paymentStatus = getPaymentStatusDisplay()

  const handleDownloadDocument = async (docId: string, docName: string) => {
    setDownloadingDoc(docId)
    try {
      const response = await fetch(`/api/dossiers/${dossier.id}/documents/${docId}/download`)
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = docName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Erreur lors du téléchargement du document')
    } finally {
      setDownloadingDoc(null)
    }
  }

  const handleDownloadAll = async () => {
    setDownloadingAll(true)
    try {
      const response = await fetch(`/api/dossiers/${dossier.id}/documents/download-all`)
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Dossier_${dossier.reference}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download all error:', error)
      alert('Erreur lors du téléchargement des documents')
    } finally {
      setDownloadingAll(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Closure Message */}
      {isClosed && (
        <Alert variant="success" title="Dossier clôturé">
          <p>
            Votre dossier est désormais complet. Les démarches liées au versement
            des aides sont en cours. Vous pouvez retrouver l'ensemble des documents
            liés à votre projet ci-dessous.
          </p>
        </Alert>
      )}

      {/* Section 1: General Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Numéro de dossier KOPRO</p>
              <p className="font-mono font-semibold text-gray-900">{dossier.reference}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Identité du client</p>
              <p className="font-semibold text-gray-900">
                {client.firstName} {client.lastName}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Identifiant MaPrimeRénov'</p>
              <p className="font-mono font-semibold text-gray-900">
                {dossier.mprId || 'Non renseigné'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Date de création</p>
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(dossier.createdAt)}
              </p>
            </div>
            {dossier.closedAt && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Date de clôture</p>
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(dossier.closedAt)}
                </p>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Statut global</p>
              <Badge variant={isClosed ? 'success' : 'warning'}>
                {isClosed ? 'Clôturé' : formatDossierStatus(dossier.status)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Completed Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Travaux réalisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedWorks.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {selectedWorks.map(workCode => {
                const work = WORK_TYPES.find(w => w.code === workCode)
                return (
                  <div
                    key={workCode}
                    className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-lg"
                  >
                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                      {workIcons[workCode]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{work?.label}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">Aucun travaux enregistré</p>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Amounts & Aids */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Montants & aides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Montant total des travaux</p>
              <p className="text-xl font-bold text-gray-900">
                {dossier.totalWorksAmount
                  ? formatCurrency(dossier.totalWorksAmount)
                  : '—'}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Aide MaPrimeRénov'</p>
              <p className="text-xl font-bold text-blue-700">
                {dossier.mprAmount ? formatCurrency(dossier.mprAmount) : '—'}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Aide CEE</p>
              <p className="text-xl font-bold text-green-700">
                {dossier.ceeAmount ? formatCurrency(dossier.ceeAmount) : '—'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600">Total aides estimées</p>
              <p className="text-xl font-bold text-purple-700">
                {totalEstimatedAids > 0 ? formatCurrency(totalEstimatedAids) : '—'}
              </p>
            </div>
          </div>

          {/* Payment Status */}
          <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Statut du versement</p>
                <p className="text-sm text-gray-500">
                  {totalPaidAids > 0
                    ? `${formatCurrency(totalPaidAids)} déjà versés`
                    : 'Aucun versement effectué'}
                </p>
              </div>
            </div>
            <Badge variant={paymentStatus.variant}>{paymentStatus.label}</Badge>
          </div>

          <p className="text-sm text-gray-500 italic">
            Les délais de versement peuvent varier selon les organismes.
          </p>
        </CardContent>
      </Card>

      {/* Section 4: Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents du dossier
            </CardTitle>
            {documents.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
              >
                {downloadingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Tout télécharger
              </Button>
            )}
          </div>
          <CardDescription>
            Consultez et téléchargez tous les documents de votre dossier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Administrative Documents */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Documents administratifs</h4>
            {adminDocs.length > 0 ? (
              <div className="space-y-2">
                {adminDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    {/* Miniature cliquable */}
                    {doc.url && (
                      <button
                        type="button"
                        onClick={() => setPreviewDocument(doc)}
                        className="relative flex-shrink-0 w-12 h-16 bg-white border border-gray-200 rounded-md overflow-hidden hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <iframe
                          src={doc.url}
                          className="w-full h-full pointer-events-none scale-100"
                          title={`Aperçu de ${doc.name}`}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                      </button>
                    )}
                    {/* Informations du fichier */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {doc.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 ml-6">
                        Déposé le {formatDate(doc.uploadedAt)}
                        {doc.size && ` • ${(doc.size / 1024).toFixed(1)} Ko`}
                      </p>
                      {doc.url && (
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(doc)}
                          className="text-xs text-primary-600 hover:text-primary-700 mt-1 ml-6 flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Voir l'aperçu
                        </button>
                      )}
                    </div>
                    {/* Bouton télécharger */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc.id, doc.name)}
                      disabled={downloadingDoc === doc.id}
                      className="flex-shrink-0"
                    >
                      {downloadingDoc === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun document administratif</p>
            )}
          </div>

          {/* Technical Documents */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Documents techniques</h4>
            {techDocs.length > 0 ? (
              <div className="space-y-2">
                {techDocs.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    {/* Miniature cliquable */}
                    {doc.url && (
                      <button
                        type="button"
                        onClick={() => setPreviewDocument(doc)}
                        className="relative flex-shrink-0 w-12 h-16 bg-white border border-gray-200 rounded-md overflow-hidden hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <iframe
                          src={doc.url}
                          className="w-full h-full pointer-events-none scale-100"
                          title={`Aperçu de ${doc.name}`}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                      </button>
                    )}
                    {/* Informations du fichier */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {doc.name}
                        </span>
                        <Badge variant={doc.type === 'DEVIS' ? 'secondary' : 'success'} className="flex-shrink-0">
                          {doc.type === 'DEVIS' ? 'Devis' : 'Facture'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 ml-6">
                        Déposé le {formatDate(doc.uploadedAt)}
                        {doc.size && ` • ${(doc.size / 1024).toFixed(1)} Ko`}
                      </p>
                      {doc.url && (
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(doc)}
                          className="text-xs text-primary-600 hover:text-primary-700 mt-1 ml-6 flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Voir l'aperçu
                        </button>
                      )}
                    </div>
                    {/* Bouton télécharger */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadDocument(doc.id, doc.name)}
                      disabled={downloadingDoc === doc.id}
                      className="flex-shrink-0"
                    >
                      {downloadingDoc === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun document technique</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-start pt-4 border-t">
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </Link>
      </div>

      {/* Modal d'aperçu du fichier */}
      {previewDocument && previewDocument.url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewDocument(null)}
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
                    {previewDocument.size
                      ? `${(previewDocument.size / 1024).toFixed(1)} Ko • PDF`
                      : 'PDF'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(previewDocument.id, previewDocument.name)}
                  disabled={downloadingDoc === previewDocument.id}
                >
                  {downloadingDoc === previewDocument.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Télécharger
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenu de l'aperçu */}
            <div className="flex-1 overflow-hidden bg-gray-100 p-4">
              <iframe
                src={previewDocument.url}
                className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200 bg-white"
                title="Aperçu du document"
              />
            </div>

            {/* Footer de la modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setPreviewDocument(null)}
              >
                Fermer
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownloadDocument(previewDocument.id, previewDocument.name)}
                disabled={downloadingDoc === previewDocument.id}
              >
                {downloadingDoc === previewDocument.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Télécharger le fichier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
