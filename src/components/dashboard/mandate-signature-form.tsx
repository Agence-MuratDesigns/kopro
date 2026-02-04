'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Upload,
  PenTool,
  FileText,
  Info,
  Eye,
  X,
  MessageCircle,
} from 'lucide-react'
import { useChat } from '@/contexts/chat-context'

interface MandateSignatureFormProps {
  dossierId: string
  mandatStatus: string
  mandatReviewMessage: string | null
}

export function MandateSignatureForm({
  dossierId,
  mandatStatus,
  mandatReviewMessage,
}: MandateSignatureFormProps) {
  const router = useRouter()
  const { openChat } = useChat()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Ouvrir le chat avec message pré-rempli pour contacter le support
  const handleContactSupport = () => {
    const message = "Bonjour, je souhaite modifier mon mandat administratif (étape 4). Pouvez-vous m'aider ?"
    openChat(dossierId, message)
  }

  // Créer l'URL de prévisualisation quand un fichier est sélectionné
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      setFilePreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setFilePreviewUrl(null)
    }
  }, [selectedFile])

  const handleDownloadSelectedFile = () => {
    if (selectedFile && filePreviewUrl) {
      const link = document.createElement('a')
      link.href = filePreviewUrl
      link.download = selectedFile.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDownloadMandate = async () => {
    try {
      // In production, this would download a pre-filled PDF
      window.open(`/api/dossiers/${dossierId}/mandate`, '_blank')
    } catch {
      setError('Erreur lors du téléchargement du mandat')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Seuls les fichiers PDF sont acceptés')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Le fichier ne doit pas dépasser 10 Mo')
        return
      }
      setSelectedFile(file)
      setError('')
    }
  }

  const handleManualUpload = async () => {
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(`/api/dossiers/${dossierId}/mandate/sign`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'envoi du mandat')
        return
      }

      setSuccess('Mandat reçu. Vérification en cours.')
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusDisplay = () => {
    switch (mandatStatus) {
      case 'PENDING_REVIEW':
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          badge: <Badge variant="warning">En attente de vérification</Badge>,
          message: 'Votre mandat signé est en cours de vérification par notre équipe.',
          canEdit: false,
        }
      case 'APPROVED':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: <Badge variant="success">Validé</Badge>,
          message: 'Votre mandat a été validé. Vous pouvez passer à l\'étape suivante.',
          canEdit: false,
        }
      case 'REJECTED':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          badge: <Badge variant="error">Rejeté</Badge>,
          message: mandatReviewMessage || 'Votre mandat a été rejeté. Veuillez le corriger.',
          canEdit: true,
        }
      default:
        return {
          icon: <PenTool className="h-5 w-5 text-gray-400" />,
          badge: <Badge variant="secondary">Non signé</Badge>,
          message: null,
          canEdit: true,
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusDisplay.icon}
            <div>
              <CardTitle>Signature du mandat administratif</CardTitle>
              <CardDescription>
                Signez le mandat pour autoriser KOPRO à gérer votre dossier
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
              mandatStatus === 'APPROVED' ? 'success' : mandatStatus === 'REJECTED' ? 'error' : 'info'
            }
            title={
              mandatStatus === 'APPROVED'
                ? 'Mandat validé'
                : mandatStatus === 'REJECTED'
                ? 'Mandat rejeté'
                : 'En cours de vérification'
            }
          >
            {statusDisplay.message}
          </Alert>
        )}

        {/* Message pour contacter le support après validation */}
        {mandatStatus === 'APPROVED' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  Cette étape a été validée
                </p>
                <p className="text-sm text-amber-700 mb-3">
                  Pour toute modification, veuillez contacter notre équipe.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleContactSupport}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter le support
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Pourquoi signer un mandat ?</p>
              <p>
                Le mandat administratif nous autorise à effectuer les démarches MaPrimeRénov' et CEE
                en votre nom. C'est une étape obligatoire pour la suite de votre dossier.
              </p>
            </div>
          </div>
        </div>

        {/* Signature manuelle */}
        {statusDisplay.canEdit && (
          <>
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

            <div className="space-y-4">
              {/* Step 1: Download */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-medium text-sm">
                    1
                  </div>
                  <h4 className="font-medium text-gray-900">Télécharger le mandat</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Téléchargez le mandat pré-rempli avec vos informations
                </p>
                <Button variant="outline" onClick={handleDownloadMandate}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le mandat (PDF)
                </Button>
              </div>

              {/* Step 2: Sign */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-medium text-sm">
                    2
                  </div>
                  <h4 className="font-medium text-gray-900">Imprimer et signer</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Imprimez le document, signez-le manuellement, puis scannez-le ou prenez-le en photo
                </p>
              </div>

              {/* Step 3: Upload */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full font-medium text-sm">
                    3
                  </div>
                  <h4 className="font-medium text-gray-900">Envoyer le mandat signé</h4>
                </div>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {selectedFile && filePreviewUrl && (
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                      {/* Miniature cliquable */}
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="relative flex-shrink-0 w-16 h-20 bg-gray-100 border border-gray-200 rounded-md overflow-hidden hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <iframe
                          src={filePreviewUrl}
                          className="w-full h-full pointer-events-none"
                          title="Aperçu du fichier"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                      </button>
                      {/* Informations du fichier */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {selectedFile.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {(selectedFile.size / 1024).toFixed(1)} Ko • PDF
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowPreviewModal(true)}
                          className="text-xs text-primary-600 hover:text-primary-700 mt-1 flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Voir l'aperçu
                        </button>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleManualUpload}
                    disabled={!selectedFile || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Envoyer mon mandat signé
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

      </CardContent>

      {/* Modal d'aperçu du fichier */}
      {showPreviewModal && filePreviewUrl && selectedFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPreviewModal(false)}
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
                    {selectedFile.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} Ko • PDF
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSelectedFile}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenu de l'aperçu */}
            <div className="flex-1 overflow-hidden bg-gray-100 p-4">
              <iframe
                src={filePreviewUrl}
                className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200 bg-white"
                title="Aperçu du document"
              />
            </div>

            {/* Footer de la modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(false)}
              >
                Fermer
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadSelectedFile}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger le fichier
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
