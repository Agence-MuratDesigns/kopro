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
  PlayCircle,
  AlertTriangle,
  Info,
  FileText,
  Receipt,
  Award,
} from 'lucide-react'

interface WorkAuthorizationFormProps {
  dossierId: string
  workStatus: string
  workStartedAt: string | null
}

export function WorkAuthorizationForm({
  dossierId,
  workStatus,
  workStartedAt,
}: WorkAuthorizationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleStartWork = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/work-started`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la notification')
        return
      }

      setSuccess('Merci. Le début des travaux a bien été signalé.')
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
      setShowConfirmation(false)
    }
  }

  const isWorkStarted = workStatus === 'IN_PROGRESS' || workStatus === 'COMPLETED'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isWorkStarted ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <PlayCircle className="h-5 w-5 text-primary-500" />
            )}
            <div>
              <CardTitle>Déclarer le début des travaux</CardTitle>
              <CardDescription>
                Vos devis ont été validés, vous pouvez démarrer les travaux
              </CardDescription>
            </div>
          </div>
          {isWorkStarted && <Badge variant="success">Travaux démarrés</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success message for started work */}
        {isWorkStarted && workStartedAt && (
          <Alert variant="success" title="Travaux en cours">
            Vous avez signalé le début des travaux le{' '}
            {new Date(workStartedAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            . N'oubliez pas de conserver toutes vos factures pour l'étape suivante.
          </Alert>
        )}

        {/* Authorization message */}
        {!isWorkStarted && (
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 text-lg">
                  Vos devis sont conformes
                </h3>
                <p className="text-green-700 mt-1">
                  Vous pouvez désormais démarrer les travaux avec les entreprises sélectionnées.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Obligations reminder */}
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-2">Rappel important :</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Receipt className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Conservez toutes les factures des travaux réalisés</span>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Conservez les attestations de fin de travaux</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Ne perdez pas les documents originaux</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

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

        {/* Action Button */}
        {!isWorkStarted && (
          <>
            {showConfirmation ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 mb-4">
                  Confirmez-vous que les travaux ont bien démarré ?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirmation(false)}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleStartWork} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      'Oui, confirmer'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={handleStartWork} size="lg" className="w-full sm:w-auto">
                <PlayCircle className="h-5 w-5 mr-2" />
                Notifier le début des travaux
              </Button>
            )}
          </>
        )}

        {/* Next step info */}
        {isWorkStarted && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Prochaine étape</p>
                <p>
                  Une fois les travaux terminés, vous devrez déposer les factures finales
                  pour finaliser votre dossier et recevoir les aides.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
