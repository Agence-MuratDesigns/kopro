'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Building2, MapPin, Award, X } from 'lucide-react'

interface ArtisanCompanyFormProps {
  user: {
    id: string
    companyName: string | null
    siret: string | null
    companyAddress: string | null
    companyPostalCode: string | null
    companyCity: string | null
    rgeQualifications: string | null
  }
}

const RGE_OPTIONS = [
  { code: 'QUALIBAT', label: 'Qualibat' },
  { code: 'QUALIPAC', label: 'QualiPAC' },
  { code: 'QUALISOL', label: 'Qualisol' },
  { code: 'QUALIBOIS', label: 'Qualibois' },
  { code: 'QUALIGAZ', label: 'Qualigaz' },
  { code: 'QUALIFELEC', label: 'Qualifelec' },
  { code: 'CERTIBAT', label: 'Certibat' },
  { code: 'ECO_ARTISAN', label: 'Éco Artisan' },
  { code: 'PRO_DE_LENERGIE', label: "Pro de l'énergie" },
]

export function ArtisanCompanyForm({ user }: ArtisanCompanyFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Parse existing qualifications
  const existingQualifications: string[] = user.rgeQualifications
    ? JSON.parse(user.rgeQualifications)
    : []

  const [formData, setFormData] = useState({
    companyName: user.companyName || '',
    siret: user.siret || '',
    companyAddress: user.companyAddress || '',
    companyPostalCode: user.companyPostalCode || '',
    companyCity: user.companyCity || '',
    rgeQualifications: existingQualifications,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const toggleQualification = (code: string) => {
    setFormData(prev => ({
      ...prev,
      rgeQualifications: prev.rgeQualifications.includes(code)
        ? prev.rgeQualifications.filter(q => q !== code)
        : [...prev.rgeQualifications, code]
    }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation SIRET (14 digits)
    if (formData.siret && !/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
      setError('Le SIRET doit contenir 14 chiffres')
      return
    }

    // Validate postal code format
    if (formData.companyPostalCode && !/^\d{5}$/.test(formData.companyPostalCode)) {
      setError('Le code postal doit contenir 5 chiffres')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/user/artisan-company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          siret: formData.siret.replace(/\s/g, ''),
          rgeQualifications: JSON.stringify(formData.rgeQualifications),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la mise à jour')
        return
      }

      setSuccess('Les informations de votre entreprise ont été mises à jour')
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  // Format SIRET for display (XXX XXX XXX XXXXX)
  const formatSiret = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    const parts = []
    if (digits.length > 0) parts.push(digits.slice(0, 3))
    if (digits.length > 3) parts.push(digits.slice(3, 6))
    if (digits.length > 6) parts.push(digits.slice(6, 9))
    if (digits.length > 9) parts.push(digits.slice(9, 14))
    return parts.join(' ')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Company Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent-light rounded-lg">
            <Building2 className="h-4 w-4 text-accent" />
          </div>
          <h4 className="font-semibold text-kopro-dark">Informations de l'entreprise</h4>
        </div>

        <div className="pl-11 space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Raison sociale *
            </label>
            <Input
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="SARL Dupont Rénovation"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-1">
              SIRET *
            </label>
            <Input
              id="siret"
              name="siret"
              value={formatSiret(formData.siret)}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 14)
                setFormData(prev => ({ ...prev, siret: value }))
                setError('')
                setSuccess('')
              }}
              placeholder="123 456 789 00012"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">14 chiffres sans espaces</p>
          </div>
        </div>
      </div>

      {/* Company Address */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent-light rounded-lg">
            <MapPin className="h-4 w-4 text-accent" />
          </div>
          <h4 className="font-semibold text-kopro-dark">Adresse de l'entreprise</h4>
        </div>

        <div className="pl-11 space-y-4">
          <div>
            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <Input
              id="companyAddress"
              name="companyAddress"
              value={formData.companyAddress}
              onChange={handleChange}
              placeholder="123 rue des Artisans"
              disabled={isLoading}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyPostalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Code postal
              </label>
              <Input
                id="companyPostalCode"
                name="companyPostalCode"
                value={formData.companyPostalCode}
                onChange={handleChange}
                placeholder="75001"
                maxLength={5}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="companyCity" className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <Input
                id="companyCity"
                name="companyCity"
                value={formData.companyCity}
                onChange={handleChange}
                placeholder="Paris"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RGE Qualifications */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent-light rounded-lg">
            <Award className="h-4 w-4 text-accent" />
          </div>
          <h4 className="font-semibold text-kopro-dark">Certifications RGE</h4>
        </div>

        <div className="pl-11">
          <p className="text-sm text-gray-500 mb-4">
            Sélectionnez vos certifications RGE (Reconnu Garant de l'Environnement)
          </p>

          {/* Selected qualifications */}
          {formData.rgeQualifications.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.rgeQualifications.map(code => {
                const option = RGE_OPTIONS.find(o => o.code === code)
                return option ? (
                  <Badge
                    key={code}
                    variant="success"
                    className="pr-1 flex items-center gap-1"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={() => toggleQualification(code)}
                      className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null
              })}
            </div>
          )}

          {/* Available qualifications */}
          <div className="flex flex-wrap gap-2">
            {RGE_OPTIONS.filter(opt => !formData.rgeQualifications.includes(opt.code)).map(option => (
              <button
                key={option.code}
                type="button"
                onClick={() => toggleQualification(option.code)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-full hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
              >
                + {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
