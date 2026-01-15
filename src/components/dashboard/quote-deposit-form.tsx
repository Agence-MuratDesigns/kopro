'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WORK_TYPES } from '@/lib/utils'
import {
  Loader2,
  CheckCircle,
  FileText,
  Upload,
  X,
  Clock,
  AlertCircle,
  Info,
  Home,
  Flame,
  Droplets,
  Wind,
} from 'lucide-react'

interface Document {
  id: string
  name: string
  workType: string
  status: string
}

interface QuoteDepositFormProps {
  dossierId: string
  selectedWorks: string[]
  quotesStatus: string | null
  quotesReviewMessage: string | null
  documents: Document[]
}

const workIcons: Record<string, React.ReactNode> = {
  ISOLATION: <Home className="h-5 w-5" />,
  HEATING: <Flame className="h-5 w-5" />,
  HOT_WATER: <Droplets className="h-5 w-5" />,
  VENTILATION: <Wind className="h-5 w-5" />,
}

export function QuoteDepositForm({
  dossierId,
  selectedWorks,
  quotesStatus,
  quotesReviewMessage,
  documents,
}: QuoteDepositFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingWork, setUploadingWork] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Group documents by work type
  const documentsByWork = documents.reduce((acc, doc) => {
    if (!acc[doc.workType]) acc[doc.workType] = []
    acc[doc.workType].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  const handleFileUpload = async (workType: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingWork(workType)
    setError('')

    try {
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') {
          setError('Seuls les fichiers PDF sont acceptés')
          continue
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Le fichier ne doit pas dépasser 10 Mo')
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('workType', workType)
        formData.append('type', 'DEVIS')

        const response = await fetch(`/api/dossiers/${dossierId}/quotes/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || 'Erreur lors de l\'upload')
        }
      }

      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setUploadingWork(null)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    try {
      const response = await fetch(`/api/dossiers/${dossierId}/quotes/${docId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
        return
      }

      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    }
  }

  const handleSubmit = async () => {
    // Check all work types have at least one document
    const missingWorks = selectedWorks.filter(
      work => !documentsByWork[work] || documentsByWork[work].length === 0
    )

    if (missingWorks.length > 0) {
      const missingLabels = missingWorks
        .map(code => WORK_TYPES.find(w => w.code === code)?.label)
        .join(', ')
      setError(`Veuillez déposer au moins un devis pour : ${missingLabels}`)
      return
    }

    if (!isConfirmed) {
      setError('Veuillez confirmer avoir déposé l\'ensemble des devis nécessaires')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/quotes/submit`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la soumission')
        return
      }

      setSuccess('Vos devis ont bien été transmis. Ils sont en cours de vérification.')
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusDisplay = () => {
    switch (quotesStatus) {
      case 'PENDING_REVIEW':
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          badge: <Badge variant="warning">En attente de vérification</Badge>,
          message: 'Vos devis sont en cours de vérification par notre équipe.',
          canEdit: false,
        }
      case 'APPROVED':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: <Badge variant="success">Validés</Badge>,
          message: 'Vos devis ont été validés. Vous pouvez passer à l\'étape suivante.',
          canEdit: false,
        }
      case 'REJECTED':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          badge: <Badge variant="error">Rejetés</Badge>,
          message: quotesReviewMessage || 'Vos devis ont été rejetés. Veuillez les corriger.',
          canEdit: true,
        }
      default:
        return {
          icon: <FileText className="h-5 w-5 text-gray-400" />,
          badge: <Badge variant="secondary">À déposer</Badge>,
          message: null,
          canEdit: true,
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  // Vérifier s'il y a des travaux sans devis (utile après modification de l'étape 4)
  const worksWithoutQuotes = selectedWorks.filter(
    work => !documentsByWork[work] || documentsByWork[work].length === 0
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusDisplay.icon}
            <div>
              <CardTitle>Dépôt des devis</CardTitle>
              <CardDescription>
                Déposez les devis pour chaque type de travaux sélectionné
              </CardDescription>
            </div>
          </div>
          {statusDisplay.badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Message */}
        {statusDisplay.message && (
          <Alert
            variant={
              quotesStatus === 'APPROVED' ? 'success' : quotesStatus === 'REJECTED' ? 'error' : 'info'
            }
            title={
              quotesStatus === 'APPROVED'
                ? 'Devis validés'
                : quotesStatus === 'REJECTED'
                ? 'Devis rejetés'
                : 'En cours de vérification'
            }
          >
            {statusDisplay.message}
          </Alert>
        )}

        {/* Alerte si des travaux n'ont pas de devis (après modification étape 4) */}
        {statusDisplay.canEdit && worksWithoutQuotes.length > 0 && documents.length > 0 && (
          <Alert variant="warning" title="Devis manquants">
            Suite à la modification de votre sélection de travaux, vous devez déposer des devis pour : {' '}
            <strong>
              {worksWithoutQuotes
                .map(code => WORK_TYPES.find(w => w.code === code)?.label)
                .join(', ')}
            </strong>
          </Alert>
        )}

        {/* Information */}
        {statusDisplay.canEdit && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Consignes de dépôt :</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Format PDF uniquement</li>
                  <li>Taille maximale : 10 Mo par fichier</li>
                  <li>Vous pouvez déposer plusieurs devis par catégorie</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" title="Succès">
            {success}
          </Alert>
        )}

        {/* Upload Zones by Work Type */}
        <div className="space-y-4">
          {selectedWorks.map(workCode => {
            const work = WORK_TYPES.find(w => w.code === workCode)
            const docs = documentsByWork[workCode] || []
            const isUploading = uploadingWork === workCode

            return (
              <div
                key={workCode}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                    {workIcons[workCode]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{work?.label}</h3>
                    <p className="text-sm text-gray-500">
                      {docs.length} devis déposé(s)
                    </p>
                  </div>
                  {docs.length > 0 && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>

                {/* Uploaded Documents */}
                {docs.length > 0 && (
                  <div className="space-y-2 mb-4">
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
                          <Badge
                            variant={
                              doc.status === 'VALIDATED'
                                ? 'success'
                                : doc.status === 'REJECTED'
                                ? 'error'
                                : 'warning'
                            }
                          >
                            {doc.status === 'VALIDATED'
                              ? 'Validé'
                              : doc.status === 'REJECTED'
                              ? 'Refusé'
                              : 'En attente'}
                          </Badge>
                          {statusDisplay.canEdit && (
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {statusDisplay.canEdit && (
                  <div className="relative">
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => handleFileUpload(workCode, e.target.files)}
                      disabled={isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Upload en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Ajouter un devis
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Confirmation Checkbox */}
        {statusDisplay.canEdit && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                disabled={isLoading}
                className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-amber-800">
                Je confirme avoir déposé l'ensemble des devis nécessaires.
              </span>
            </label>
          </div>
        )}

        {/* Submit Button */}
        {statusDisplay.canEdit && (
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !isConfirmed}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Valider le dépôt des devis'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
