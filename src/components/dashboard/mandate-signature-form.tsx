'use client'

import { useState } from 'react'
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
} from 'lucide-react'

interface MandateSignatureFormProps {
  dossierId: string
  mandatStatus: string
  mandatMethod: string | null
  mandatReviewMessage: string | null
}

export function MandateSignatureForm({
  dossierId,
  mandatStatus,
  mandatMethod,
  mandatReviewMessage,
}: MandateSignatureFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [signatureMode, setSignatureMode] = useState<'manual' | 'electronic' | null>(null)

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
      formData.append('method', 'MANUAL')

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

  const handleElectronicSign = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/mandate/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'ELECTRONIC' }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la signature électronique')
        return
      }

      // In production, this would redirect to an e-signature provider
      setSuccess('Votre mandat signé a bien été reçu.')
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
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

        {/* Signature Options */}
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

            {!signatureMode ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Option A: Manual Signature */}
                <div
                  className="p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
                  onClick={() => setSignatureMode('manual')}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <Upload className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Signature manuscrite</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Téléchargez, imprimez, signez et renvoyez le mandat
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option B: Electronic Signature */}
                <div
                  className="p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
                  onClick={() => setSignatureMode('electronic')}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-3 bg-primary-100 rounded-full">
                      <PenTool className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Signature électronique</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Signez directement en ligne (plus rapide)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : signatureMode === 'manual' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSignatureMode(null)}>
                    ← Retour
                  </Button>
                  <span className="text-sm text-gray-500">Signature manuscrite</span>
                </div>

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
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        {selectedFile.name}
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
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setSignatureMode(null)}>
                    ← Retour
                  </Button>
                  <span className="text-sm text-gray-500">Signature électronique</span>
                </div>

                <div className="p-6 bg-primary-50 border border-primary-100 rounded-lg text-center">
                  <PenTool className="h-12 w-12 text-primary-500 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900 mb-2">Signature électronique sécurisée</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Vous allez être redirigé vers notre partenaire de signature électronique.
                    La procédure prend moins de 2 minutes.
                  </p>
                  <Button onClick={handleElectronicSign} disabled={isLoading} size="lg">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Préparation...
                      </>
                    ) : (
                      <>
                        <PenTool className="h-4 w-4 mr-2" />
                        Signer électroniquement
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Show method used if already submitted */}
        {!statusDisplay.canEdit && mandatMethod && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Méthode de signature</p>
            <p className="font-medium text-gray-900">
              {mandatMethod === 'ELECTRONIC' ? 'Signature électronique' : 'Signature manuscrite'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
