'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Info,
  Key,
} from 'lucide-react'

interface MprIdentifierFormProps {
  dossierId: string
  currentMprId: string | null
  mprStatus: string
  mprReviewMessage: string | null
}

export function MprIdentifierForm({
  dossierId,
  currentMprId,
  mprStatus,
  mprReviewMessage,
}: MprIdentifierFormProps) {
  const router = useRouter()
  const [mprId, setMprId] = useState(currentMprId || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isCertified, setIsCertified] = useState(false)
  const [isEditing, setIsEditing] = useState(!currentMprId || mprStatus === 'REJECTED')

  // Validate MPR ID format: MPR-XXXXAB (4 digits + 2 uppercase letters)
  const mprIdRegex = /^MPR-\d{4}[A-Z]{2}$/
  const isValidFormat = mprIdRegex.test(mprId)

  // Form can be submitted only if all conditions are met
  const canSubmit = mprId.trim() && isValidFormat && isCertified

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!mprId.trim()) {
      setError('Veuillez saisir votre identifiant MaPrimeRénov\'')
      return
    }

    if (!isValidFormat) {
      setError('Format invalide. L\'identifiant doit être au format MPR-XXXXAB (ex: MPR-1234AB)')
      return
    }

    if (!isCertified) {
      setError('Veuillez certifier que l\'identifiant est correct avant d\'enregistrer.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/mpr-identifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mprId: mprId.toUpperCase().trim(), certified: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la soumission')
        return
      }

      // Auto-validation : redirection vers l'étape suivante
      setSuccess('Identifiant enregistré avec succès ! Passez à l\'étape suivante.')
      setIsEditing(false)
      setIsCertified(false)

      // Rediriger vers l'étape infos projet après un court délai
      setTimeout(() => {
        router.push(`/dossier/${dossierId}/etape/PROJECT_INFO`)
      }, 1500)
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusDisplay = () => {
    switch (mprStatus) {
      case 'PENDING_REVIEW':
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          badge: <Badge variant="warning">En attente de vérification</Badge>,
          message: 'Votre identifiant est en cours de vérification par notre équipe.',
          canEdit: false,
        }
      case 'APPROVED':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: <Badge variant="success">Validé</Badge>,
          message: 'Votre identifiant MaPrimeRénov\' a été validé.',
          canEdit: false,
        }
      case 'REJECTED':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          badge: <Badge variant="error">Rejeté</Badge>,
          message: mprReviewMessage || 'Votre identifiant a été rejeté. Veuillez le corriger.',
          canEdit: true,
        }
      default:
        return {
          icon: <Key className="h-5 w-5 text-gray-400" />,
          badge: <Badge variant="secondary">Non renseigné</Badge>,
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
              <CardTitle>Identifiant MaPrimeRénov'</CardTitle>
              <CardDescription>
                Saisissez votre identifiant obtenu sur maprimerenov.gouv.fr
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
              mprStatus === 'APPROVED' ? 'success' : mprStatus === 'REJECTED' ? 'error' : 'info'
            }
            title={
              mprStatus === 'APPROVED'
                ? 'Identifiant validé'
                : mprStatus === 'REJECTED'
                ? 'Identifiant rejeté'
                : 'En cours de vérification'
            }
          >
            {statusDisplay.message}
          </Alert>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Comment obtenir votre identifiant ?</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Rendez-vous sur le site officiel MaPrimeRénov'</li>
                <li>Créez un compte ou connectez-vous</li>
                <li>Votre identifiant apparaît dans votre espace personnel</li>
                <li>Il est au format : MPR-XXXXAB (ex: MPR-1234AB)</li>
              </ol>
              <a
                href="https://www.maprimerenov.gouv.fr/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-blue-600 hover:text-blue-700 font-medium"
              >
                Accéder à MaPrimeRénov'
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        {statusDisplay.canEdit && isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label htmlFor="mprId" className="block text-sm font-medium text-gray-700 mb-2">
                Identifiant MaPrimeRénov' *
              </label>
              <Input
                id="mprId"
                value={mprId}
                onChange={(e) => {
                  setMprId(e.target.value.toUpperCase())
                  setError('')
                  setSuccess('')
                }}
                placeholder="MPR-1234AB"
                disabled={isLoading}
                className="max-w-xs font-mono text-lg"
              />
              {mprId && !isValidFormat && (
                <p className="text-sm text-red-600 mt-2">
                  Format attendu : MPR-XXXXAB (4 chiffres + 2 lettres majuscules)
                </p>
              )}
              {mprId && isValidFormat && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Format valide
                </p>
              )}
            </div>

            {/* Certification checkbox */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCertified}
                  onChange={(e) => setIsCertified(e.target.checked)}
                  disabled={isLoading}
                  className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-amber-800">
                  Je certifie que cet identifiant est exact et correspond à mon dossier MaPrimeRénov'.
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Enregistrer mon identifiant'
              )}
            </Button>
          </form>
        ) : statusDisplay.canEdit && !isEditing && currentMprId ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Identifiant enregistré</p>
              <p className="font-mono text-lg font-medium text-gray-900">{currentMprId}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(true)
                setIsCertified(false)
              }}
            >
              Modifier mon identifiant
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Identifiant enregistré</p>
            <p className="font-mono text-lg font-medium text-gray-900">{currentMprId}</p>
          </div>
        )}

        {/* Current Value Display (if pending) */}
        {mprStatus === 'PENDING_REVIEW' && currentMprId && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Identifiant soumis :</strong>{' '}
              <span className="font-mono">{currentMprId}</span>
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Notre équipe vérifie actuellement votre identifiant. Vous serez notifié dès la validation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
