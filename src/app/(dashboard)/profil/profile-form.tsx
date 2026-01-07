'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Loader2, Save, Phone, MapPin, Home, Building2 } from 'lucide-react'

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

    // Validate phone format (French)
    if (formData.phone && !/^(?:(?:\+33|0033|0)[1-9](?:[0-9]{8}))$/.test(formData.phone.replace(/\s/g, ''))) {
      setError('Le numéro de téléphone n\'est pas valide')
      return
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
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          <Phone className="h-4 w-4 inline mr-1" />
          Téléphone
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="06 12 34 56 78"
          disabled={isLoading}
          className="max-w-xs"
        />
        <p className="text-xs text-gray-500 mt-1">Format français (ex: 06 12 34 56 78)</p>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Adresse postale
        </h4>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            <Home className="h-4 w-4 inline mr-1" />
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
              <Building2 className="h-4 w-4 inline mr-1" />
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
