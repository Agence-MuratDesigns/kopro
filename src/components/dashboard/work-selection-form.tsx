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
  Wrench,
  Home,
  Flame,
  Droplets,
  Wind,
  Info,
  Pencil,
  X,
} from 'lucide-react'

interface WorkSelectionFormProps {
  dossierId: string
  selectedWorks: string[] | null
  isValidated: boolean
  canModify: boolean // true si l'étape 5 (devis) n'est pas encore validée
}

const workIcons: Record<string, React.ReactNode> = {
  ISOLATION: <Home className="h-6 w-6" />,
  HEATING: <Flame className="h-6 w-6" />,
  HOT_WATER: <Droplets className="h-6 w-6" />,
  VENTILATION: <Wind className="h-6 w-6" />,
}

export function WorkSelectionForm({
  dossierId,
  selectedWorks: initialSelectedWorks,
  isValidated,
  canModify,
}: WorkSelectionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedWorks, setSelectedWorks] = useState<string[]>(initialSelectedWorks || [])
  const [isEditing, setIsEditing] = useState(false)

  // Le formulaire est en mode édition si :
  // - l'étape n'est pas encore validée (première soumission)
  // - ou si l'utilisateur a cliqué sur "Modifier"
  const isInEditMode = !isValidated || isEditing

  const toggleWork = (code: string) => {
    if (!isInEditMode) return

    setSelectedWorks(prev =>
      prev.includes(code) ? prev.filter(w => w !== code) : [...prev, code]
    )
    setError('')
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setSuccess('')
    setError('')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setSelectedWorks(initialSelectedWorks || [])
    setError('')
  }

  const handleSubmit = async () => {
    if (selectedWorks.length === 0) {
      setError('Veuillez sélectionner au moins un type de travaux')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ works: selectedWorks }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'enregistrement')
        return
      }

      setSuccess(data.message || 'Travaux enregistrés avec succès !')
      setIsEditing(false)
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  // Vérifier si la sélection a changé
  const hasChanges = JSON.stringify(selectedWorks.sort()) !== JSON.stringify((initialSelectedWorks || []).sort())

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-primary-500" />
            <div>
              <CardTitle>Sélection des travaux</CardTitle>
              <CardDescription>
                Indiquez les types de travaux prévus pour votre projet de rénovation
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isValidated && !isEditing && <Badge variant="success">Validé</Badge>}
            {isEditing && <Badge variant="warning">Modification en cours</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Information */}
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p>
                Sélectionnez un ou plusieurs types de travaux. À l'étape suivante, vous devrez
                déposer les devis correspondant à chaque type de travaux sélectionné.
              </p>
              {isValidated && canModify && !isEditing && (
                <p className="mt-2 font-medium">
                  Vous pouvez encore modifier votre sélection tant que vos devis n'ont pas été validés.
                </p>
              )}
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

        {/* Work Types Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {WORK_TYPES.map(work => {
            const isSelected = selectedWorks.includes(work.code)
            const isClickable = isInEditMode
            return (
              <div
                key={work.code}
                onClick={() => isClickable && toggleWork(work.code)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                  ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : isClickable
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-200'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`
                      p-2 rounded-lg
                      ${isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}
                    `}
                  >
                    {workIcons[work.code]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{work.label}</h3>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-primary-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {getWorkDescription(work.code)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        {selectedWorks.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>{selectedWorks.length}</strong> type(s) de travaux sélectionné(s) :
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedWorks.map(code => {
                const work = WORK_TYPES.find(w => w.code === code)
                return (
                  <Badge key={code} variant="secondary">
                    {work?.label}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          {/* Bouton Modifier - affiché si validé et modification possible */}
          {isValidated && canModify && !isEditing && (
            <Button variant="outline" onClick={handleStartEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier la sélection
            </Button>
          )}

          {/* Bouton Annuler - affiché en mode édition */}
          {isEditing && (
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}

          {/* Bouton Valider - affiché si pas encore validé ou en mode édition */}
          {isInEditMode && (
            <Button
              onClick={handleSubmit}
              disabled={selectedWorks.length === 0 || isLoading || (isEditing && !hasChanges)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : isEditing ? (
                'Enregistrer les modifications'
              ) : (
                'Valider les travaux sélectionnés'
              )}
            </Button>
          )}
        </div>

        {/* Warning si modification avec devis existants */}
        {isEditing && (
          <Alert variant="warning" title="Attention">
            Toute modification de votre sélection réinitialisera l'étape de dépôt des devis.
            Vous devrez confirmer à nouveau avoir déposé tous les devis nécessaires.
            Si vous retirez un type de travaux, les devis déjà déposés pour ce type seront supprimés.
          </Alert>
        )}

        {/* Next step info */}
        {isValidated && !isEditing && (
          <Alert variant="info" title="Prochaine étape">
            À l'étape suivante, vous devrez déposer les devis correspondant aux travaux sélectionnés.
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

function getWorkDescription(code: string): string {
  const descriptions: Record<string, string> = {
    ISOLATION: 'Isolation des combles, murs, planchers, fenêtres et portes',
    HEATING: 'Pompe à chaleur, chaudière biomasse, poêle à bois/granulés',
    HOT_WATER: 'Chauffe-eau thermodynamique, solaire',
    VENTILATION: 'VMC simple ou double flux',
  }
  return descriptions[code] || ''
}
