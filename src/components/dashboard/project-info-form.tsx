'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Save, Loader2 } from 'lucide-react'

interface ProjectInfoFormProps {
  dossierId: string
  initialData: {
    projectType: string | null
    projectAddress: string | null
    projectCity: string | null
    projectPostalCode: string | null
    estimatedBudget: number | null
    revenueCategory: string | null
    householdSize: number | null
  }
  onClose: () => void
  onSuccess: () => void
}

const PROJECT_TYPES = [
  'Maison individuelle',
  'Appartement',
  'Logement collectif',
]

const REVENUE_CATEGORIES = [
  'Très modestes',
  'Modestes',
  'Intermédiaires',
  'Supérieurs',
]

export function ProjectInfoForm({ dossierId, initialData, onClose, onSuccess }: ProjectInfoFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    projectType: initialData.projectType || '',
    projectAddress: initialData.projectAddress || '',
    projectCity: initialData.projectCity || '',
    projectPostalCode: initialData.projectPostalCode || '',
    estimatedBudget: initialData.estimatedBudget?.toString() || '',
    revenueCategory: initialData.revenueCategory || '',
    householdSize: initialData.householdSize?.toString() || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/project-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType: formData.projectType || null,
          projectAddress: formData.projectAddress || null,
          projectCity: formData.projectCity || null,
          projectPostalCode: formData.projectPostalCode || null,
          estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : null,
          revenueCategory: formData.revenueCategory || null,
          householdSize: formData.householdSize ? parseInt(formData.householdSize) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Une erreur est survenue')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Modifier les informations du projet
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="projectType">Type de projet</Label>
            <select
              id="projectType"
              name="projectType"
              value={formData.projectType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2"
            >
              <option value="">Sélectionner...</option>
              {PROJECT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="projectAddress">Adresse du projet</Label>
            <Input
              id="projectAddress"
              name="projectAddress"
              value={formData.projectAddress}
              onChange={handleChange}
              placeholder="123 rue de la Rénovation"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectPostalCode">Code postal</Label>
              <Input
                id="projectPostalCode"
                name="projectPostalCode"
                value={formData.projectPostalCode}
                onChange={handleChange}
                placeholder="75001"
                maxLength={5}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="projectCity">Ville</Label>
              <Input
                id="projectCity"
                name="projectCity"
                value={formData.projectCity}
                onChange={handleChange}
                placeholder="Paris"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="estimatedBudget">Budget estimé (€)</Label>
            <Input
              id="estimatedBudget"
              name="estimatedBudget"
              type="number"
              min="0"
              step="100"
              value={formData.estimatedBudget}
              onChange={handleChange}
              placeholder="15000"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="revenueCategory">Catégorie de revenus</Label>
            <select
              id="revenueCategory"
              name="revenueCategory"
              value={formData.revenueCategory}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 focus:outline-none focus:ring-2"
            >
              <option value="">Sélectionner...</option>
              {REVENUE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="householdSize">Nombre de personnes dans le foyer</Label>
            <Input
              id="householdSize"
              name="householdSize"
              type="number"
              min="1"
              max="20"
              value={formData.householdSize}
              onChange={handleChange}
              placeholder="2"
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
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
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
