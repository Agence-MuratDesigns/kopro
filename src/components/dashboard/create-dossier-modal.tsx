'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Loader2, FileText, MapPin, Euro, Users, Home, Layers, Flame, Wind, Droplets, MoreHorizontal, CheckCircle } from 'lucide-react'
import { REVENUE_CATEGORIES } from '@/lib/utils'

interface CreateDossierModalProps {
  isOpen: boolean
  onClose: () => void
}

const PROJECT_TYPES = [
  { code: 'RENOVATION_GLOBALE', label: 'Rénovation globale', icon: Home, description: 'Rénovation complète de l\'habitat' },
  { code: 'ISOLATION', label: 'Isolation', icon: Layers, description: 'Combles, murs, fenêtres' },
  { code: 'CHAUFFAGE', label: 'Chauffage', icon: Flame, description: 'Pompe à chaleur, chaudière' },
  { code: 'VENTILATION', label: 'Ventilation', icon: Wind, description: 'VMC simple ou double flux' },
  { code: 'EAU_CHAUDE', label: 'Eau chaude', icon: Droplets, description: 'Chauffe-eau thermodynamique' },
  { code: 'AUTRE', label: 'Autre', icon: MoreHorizontal, description: 'Autres travaux de rénovation' },
]

export function CreateDossierModal({ isOpen, onClose }: CreateDossierModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    projectTypes: [] as string[],
    projectAddress: '',
    projectPostalCode: '',
    projectCity: '',
    estimatedBudget: '',
    revenueCategory: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const toggleProjectType = (code: string) => {
    setFormData(prev => ({
      ...prev,
      projectTypes: prev.projectTypes.includes(code)
        ? prev.projectTypes.filter(t => t !== code)
        : [...prev.projectTypes, code]
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTypes: formData.projectTypes,
          projectAddress: formData.projectAddress,
          projectPostalCode: formData.projectPostalCode,
          projectCity: formData.projectCity,
          estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : null,
          revenueCategory: formData.revenueCategory,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du dossier')
      }

      // Close modal and redirect to new dossier
      onClose()
      router.push(`/dossier/${data.dossier.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid =
    formData.projectTypes.length > 0 &&
    formData.projectAddress &&
    formData.projectPostalCode &&
    formData.projectCity &&
    formData.revenueCategory

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <CardTitle>Nouveau dossier</CardTitle>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-kopro-grey" />
            </button>
          </div>
          <p className="text-sm text-kopro-grey mt-2">
            Renseignez les informations de votre projet de rénovation
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Types - Multi-select checkboxes */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-kopro-grey" />
                Type(s) de projet *
              </Label>
              <p className="text-xs text-kopro-grey -mt-1">
                Sélectionnez un ou plusieurs types de travaux
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PROJECT_TYPES.map(type => {
                  const isSelected = formData.projectTypes.includes(type.code)
                  const Icon = type.icon
                  return (
                    <div
                      key={type.code}
                      onClick={() => toggleProjectType(type.code)}
                      className={`
                        p-3 rounded-xl border-2 transition-all cursor-pointer
                        ${isSelected
                          ? 'border-accent bg-accent-light/50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`
                            p-1.5 rounded-lg
                            ${isSelected ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-kopro-grey'}
                          `}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-accent' : 'text-kopro-dark'}`}>
                            {type.label}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="projectAddress" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-kopro-grey" />
                Adresse des travaux *
              </Label>
              <Input
                id="projectAddress"
                name="projectAddress"
                value={formData.projectAddress}
                onChange={handleChange}
                placeholder="Numéro et nom de rue"
                required
              />
            </div>

            {/* Postal Code & City */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="projectPostalCode">Code postal *</Label>
                <Input
                  id="projectPostalCode"
                  name="projectPostalCode"
                  value={formData.projectPostalCode}
                  onChange={handleChange}
                  placeholder="75001"
                  pattern="[0-9]{5}"
                  maxLength={5}
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="projectCity">Ville *</Label>
                <Input
                  id="projectCity"
                  name="projectCity"
                  value={formData.projectCity}
                  onChange={handleChange}
                  placeholder="Paris"
                  required
                />
              </div>
            </div>

            {/* Estimated Budget */}
            <div className="space-y-2">
              <Label htmlFor="estimatedBudget" className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-kopro-grey" />
                Budget estimé
              </Label>
              <div className="relative">
                <Input
                  id="estimatedBudget"
                  name="estimatedBudget"
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                  placeholder="15000"
                  min="0"
                  step="100"
                  className="pr-8"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-kopro-grey">
                  €
                </span>
              </div>
              <p className="text-xs text-kopro-grey">
                Estimation du coût total des travaux (optionnel)
              </p>
            </div>

            {/* Revenue Category */}
            <div className="space-y-2">
              <Label htmlFor="revenueCategory" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-kopro-grey" />
                Catégorie de revenus *
              </Label>
              <select
                id="revenueCategory"
                name="revenueCategory"
                value={formData.revenueCategory}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-accent-light focus:border-accent transition-colors"
              >
                <option value="">Sélectionnez votre catégorie</option>
                {REVENUE_CATEGORIES.map(cat => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-kopro-grey">
                Détermine le montant de vos aides MaPrimeRénov'
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="flex-1 bg-accent hover:bg-primary-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le dossier'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
