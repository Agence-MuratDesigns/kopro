'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

const revenueCategories = [
  { value: 'Très modeste', label: 'Très modeste', color: 'bg-green-100 border-green-300' },
  { value: 'Modeste', label: 'Modeste', color: 'bg-blue-100 border-blue-300' },
  { value: 'Intermédiaire', label: 'Intermédiaire', color: 'bg-yellow-100 border-yellow-300' },
  { value: 'Supérieur', label: 'Supérieur', color: 'bg-gray-100 border-gray-300' },
]

const projectTypes = [
  'Rénovation globale',
  'Isolation thermique',
  'Chauffage',
  'Ventilation',
  'Fenêtres',
  'Eau chaude sanitaire',
  'Autre',
]

export default function NewDossierPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    projectType: '',
    projectAddress: '',
    projectCity: '',
    projectPostalCode: '',
    estimatedBudget: '',
    revenueCategory: '',
    householdSize: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : null,
          householdSize: formData.householdSize ? parseInt(formData.householdSize) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      router.push(`/dossier/${data.dossier.id}`)
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </Link>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Créer mon dossier</h1>
        <p className="text-gray-600 mt-2">
          Renseignez les informations de votre projet de rénovation
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full ${
              s === step
                ? 'bg-primary-600'
                : s < step
                ? 'bg-primary-300'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Step 1: Project Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Votre projet</CardTitle>
            <CardDescription>
              Quel type de travaux souhaitez-vous réaliser ?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de projet
              </label>
              <div className="grid grid-cols-2 gap-2">
                {projectTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, projectType: type })}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      formData.projectType === type
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Budget estimé (euros)"
              type="number"
              name="estimatedBudget"
              value={formData.estimatedBudget}
              onChange={handleChange}
              placeholder="Ex: 25000"
            />

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.projectType}
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Address */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Adresse du projet</CardTitle>
            <CardDescription>
              Où se situe le logement à rénover ?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Adresse"
              name="projectAddress"
              value={formData.projectAddress}
              onChange={handleChange}
              placeholder="Ex: 15 rue de la Paix"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Code postal"
                name="projectPostalCode"
                value={formData.projectPostalCode}
                onChange={handleChange}
                placeholder="Ex: 75001"
                required
              />
              <Input
                label="Ville"
                name="projectCity"
                value={formData.projectCity}
                onChange={handleChange}
                placeholder="Ex: Paris"
                required
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.projectAddress || !formData.projectCity || !formData.projectPostalCode}
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Revenue */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Votre situation</CardTitle>
            <CardDescription>
              Ces informations permettent de déterminer vos aides
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie de revenus
              </label>
              <div className="grid grid-cols-2 gap-2">
                {revenueCategories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, revenueCategory: cat.value })}
                    className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                      formData.revenueCategory === cat.value
                        ? `${cat.color} border-primary-500`
                        : `${cat.color} border-transparent hover:border-gray-300`
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Consultez votre avis d'imposition pour connaître votre catégorie
              </p>
            </div>

            <Input
              label="Nombre de personnes dans le foyer"
              type="number"
              name="householdSize"
              value={formData.householdSize}
              onChange={handleChange}
              placeholder="Ex: 3"
              min="1"
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !formData.revenueCategory}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Créer mon dossier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
