'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  MapPin,
  Home,
  Zap,
  Wallet,
  Wrench,
  Check,
} from 'lucide-react'

const HOUSING_TYPES = [
  { value: 'HOUSE', label: 'Maison individuelle' },
  { value: 'APARTMENT', label: 'Appartement' },
]

const ENERGY_TYPES = [
  { value: 'ELECTRICITY', label: 'Électricité' },
  { value: 'GAS', label: 'Gaz' },
  { value: 'FUEL', label: 'Fioul' },
  { value: 'WOOD', label: 'Bois' },
  { value: 'OTHER', label: 'Autre' },
]

const REVENUE_CATEGORIES = [
  { value: 'TRES_MODESTES', label: 'Très modestes' },
  { value: 'MODESTES', label: 'Modestes' },
  { value: 'INTERMEDIAIRES', label: 'Intermédiaires' },
  { value: 'SUPERIEURS', label: 'Supérieurs' },
]

const WORK_TYPES = [
  { code: 'ISOLATION', label: 'Isolation / Menuiseries' },
  { code: 'HEATING', label: 'Chauffage performant' },
  { code: 'HOT_WATER', label: 'Eau chaude sanitaire' },
  { code: 'VENTILATION', label: 'Ventilation' },
]

export default function NewArtisanDossierPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    // Client info (required)
    endClientFirstName: '',
    endClientLastName: '',
    endClientAddress: '',
    endClientPostalCode: '',
    endClientCity: '',
    // Client info (optional)
    endClientEmail: '',
    endClientPhone: '',
    // Project info (optional)
    housingType: '',
    housingSurface: '',
    energyType: '',
    revenueCategory: '',
    selectedWorks: [] as string[],
    estimatedBudget: '',
  })

  const isStep1Valid =
    formData.endClientFirstName &&
    formData.endClientLastName &&
    formData.endClientAddress &&
    formData.endClientPostalCode &&
    formData.endClientCity

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  function toggleWork(code: string) {
    setFormData((prev) => ({
      ...prev,
      selectedWorks: prev.selectedWorks.includes(code)
        ? prev.selectedWorks.filter((c) => c !== code)
        : [...prev.selectedWorks, code],
    }))
  }

  async function handleSubmit() {
    if (!isStep1Valid) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/artisan/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          housingSurface: formData.housingSurface
            ? parseFloat(formData.housingSurface)
            : null,
          estimatedBudget: formData.estimatedBudget
            ? parseFloat(formData.estimatedBudget)
            : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      router.push(`/dossier/${data.dossier.id}`)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau dossier client</h1>
          <p className="text-gray-600">Créer un dossier pour un nouveau client</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            step === 1
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--success)]/10 text-[var(--success)]'
          }`}
        >
          {step > 1 ? <Check className="h-4 w-4" /> : <span>1</span>}
          <span className="text-sm font-medium">Informations client</span>
        </div>
        <div className="h-px flex-1 bg-gray-200" />
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            step === 2
              ? 'bg-[var(--accent)] text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span>2</span>
          <span className="text-sm font-medium">Projet (optionnel)</span>
        </div>
      </div>

      {/* Step 1: Client Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-[var(--accent)]" />
              Informations du client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endClientFirstName">Prénom *</Label>
                <Input
                  id="endClientFirstName"
                  name="endClientFirstName"
                  value={formData.endClientFirstName}
                  onChange={handleChange}
                  placeholder="Jean"
                />
              </div>
              <div>
                <Label htmlFor="endClientLastName">Nom *</Label>
                <Input
                  id="endClientLastName"
                  name="endClientLastName"
                  value={formData.endClientLastName}
                  onChange={handleChange}
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endClientAddress">Adresse *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="endClientAddress"
                  name="endClientAddress"
                  value={formData.endClientAddress}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="123 rue de la Rénovation"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endClientPostalCode">Code postal *</Label>
                <Input
                  id="endClientPostalCode"
                  name="endClientPostalCode"
                  value={formData.endClientPostalCode}
                  onChange={handleChange}
                  placeholder="75001"
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="endClientCity">Ville *</Label>
                <Input
                  id="endClientCity"
                  name="endClientCity"
                  value={formData.endClientCity}
                  onChange={handleChange}
                  placeholder="Paris"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="endClientPhone">Téléphone</Label>
                <Input
                  id="endClientPhone"
                  name="endClientPhone"
                  type="tel"
                  value={formData.endClientPhone}
                  onChange={handleChange}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <Label htmlFor="endClientEmail">Email</Label>
                <Input
                  id="endClientEmail"
                  name="endClientEmail"
                  type="email"
                  value={formData.endClientEmail}
                  onChange={handleChange}
                  placeholder="jean.dupont@email.fr"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
              >
                Ajouter infos projet
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={!isStep1Valid || loading}
              >
                {loading ? 'Création...' : 'Créer le dossier'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Project Info (Optional) */}
      {step === 2 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5 text-[var(--accent)]" />
                Informations du logement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="housingType">Type de logement</Label>
                  <select
                    id="housingType"
                    name="housingType"
                    value={formData.housingType}
                    onChange={handleChange}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                  >
                    <option value="">Sélectionner...</option>
                    {HOUSING_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="housingSurface">Surface (m²)</Label>
                  <Input
                    id="housingSurface"
                    name="housingSurface"
                    type="number"
                    value={formData.housingSurface}
                    onChange={handleChange}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="energyType">Énergie principale</Label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <select
                      id="energyType"
                      name="energyType"
                      value={formData.energyType}
                      onChange={handleChange}
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                    >
                      <option value="">Sélectionner...</option>
                      {ENERGY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="revenueCategory">Catégorie de revenus</Label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <select
                      id="revenueCategory"
                      name="revenueCategory"
                      value={formData.revenueCategory}
                      onChange={handleChange}
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                    >
                      <option value="">Sélectionner...</option>
                      {REVENUE_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="estimatedBudget">Budget estimé (€)</Label>
                <Input
                  id="estimatedBudget"
                  name="estimatedBudget"
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                  placeholder="15000"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-5 w-5 text-[var(--accent)]" />
                Travaux envisagés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map((work) => (
                  <button
                    key={work.code}
                    type="button"
                    onClick={() => toggleWork(work.code)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.selectedWorks.includes(work.code)
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {formData.selectedWorks.includes(work.code) && (
                      <Check className="h-4 w-4 inline mr-2" />
                    )}
                    {work.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer le dossier'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
