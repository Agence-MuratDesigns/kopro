'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Alert } from '@/components/ui/alert'
import { Loader2, Save, Phone, MapPin } from 'lucide-react'

interface ProfileFormProps {
  user: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    address: string | null
    addressComplement: string | null
    postalCode: string | null
    city: string | null
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    address: user.address || '',
    addressComplement: user.addressComplement || '',
    postalCode: user.postalCode || '',
    city: user.city || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires')
      return
    }

    // Validate postal code format (5 digits for France)
    if (formData.postalCode && !/^\d{5}$/.test(formData.postalCode)) {
      setError('Le code postal doit contenir 5 chiffres')
      return
    }

    // Validate phone format (international)
    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/\s/g, '')
      // Accept international formats: +33 6 12 34 56 78, +32 4 12 34 56 78, etc.
      if (!/^\+\d{1,4}\d{6,14}$/.test(cleanPhone)) {
        setError('Le numéro de téléphone n\'est pas valide')
        return
      }
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la mise à jour')
        return
      }

      setSuccess('Vos informations ont été mises à jour avec succès')
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
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

      {/* Name fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Prénom *
          </label>
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          <Phone className="h-4 w-4 inline mr-1" />
          Téléphone
        </label>
        <PhoneInput
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={(value) => {
            setFormData(prev => ({ ...prev, phone: value }))
            setError('')
            setSuccess('')
          }}
          disabled={isLoading}
          className="max-w-md"
        />
      </div>

      {/* Address Section */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-accent-light rounded-lg">
            <MapPin className="h-4 w-4 text-accent" />
          </div>
          <h4 className="font-semibold text-kopro-dark">Adresse postale</h4>
        </div>

        <div className="space-y-4 pl-11">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 rue de la Paix"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="addressComplement" className="block text-sm font-medium text-gray-700 mb-1">
              Complément d'adresse
            </label>
            <Input
              id="addressComplement"
              name="addressComplement"
              value={formData.addressComplement}
              onChange={handleChange}
              placeholder="Appartement, bâtiment, étage..."
              disabled={isLoading}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Code postal
              </label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="75001"
                maxLength={5}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Paris"
                disabled={isLoading}
              />
            </div>
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
