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
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Key,
  Check,
  X,
  Eye,
  EyeOff,
  Award,
  RefreshCw,
} from 'lucide-react'

const RGE_QUALIFICATIONS = [
  { code: 'QUALIBAT', label: 'Qualibat RGE' },
  { code: 'QUALIFELEC', label: 'Qualifelec' },
  { code: 'QUALIPAC', label: 'QualiPAC' },
  { code: 'QUALIBOIS', label: 'Qualibois' },
  { code: 'QUALIGAZ', label: 'Qualigaz' },
  { code: 'QUALIPV', label: 'QualiPV' },
  { code: 'QUALISOL', label: 'Qualisol' },
]

function generatePassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '!@#$%^&*'

  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  const allChars = lowercase + uppercase + numbers + special
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

export default function NewArtisanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    companyName: '',
    siret: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyAddress: '',
    companyPostalCode: '',
    companyCity: '',
    password: '',
    rgeQualifications: [] as string[],
  })

  const passwordValidation = {
    minLength: formData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
  }

  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  const isSiretValid = /^\d{14}$/.test(formData.siret)

  const isFormValid =
    formData.companyName &&
    formData.siret &&
    isSiretValid &&
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.phone &&
    formData.companyAddress &&
    formData.companyPostalCode &&
    formData.companyCity &&
    formData.password &&
    isPasswordValid

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  function handleSiretChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, '').slice(0, 14)
    setFormData((prev) => ({ ...prev, siret: value }))
    setError('')
  }

  function toggleRge(code: string) {
    setFormData((prev) => ({
      ...prev,
      rgeQualifications: prev.rgeQualifications.includes(code)
        ? prev.rgeQualifications.filter((c) => c !== code)
        : [...prev.rgeQualifications, code],
    }))
  }

  function handleGeneratePassword() {
    const newPassword = generatePassword()
    setFormData((prev) => ({ ...prev, password: newPassword }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/artisans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      router.push('/admin/artisans')
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
        <Link href="/admin/artisans">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvel artisan</h1>
          <p className="text-gray-600">Créer un compte artisan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-[var(--accent)]" />
              Informations entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="companyName">Raison sociale *</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Dupont Rénovation SARL"
                />
              </div>
              <div>
                <Label htmlFor="siret">
                  Numéro SIRET *
                  {formData.siret && (
                    <span
                      className={`ml-2 text-xs ${
                        isSiretValid ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {isSiretValid ? '(valide)' : '(14 chiffres requis)'}
                    </span>
                  )}
                </Label>
                <Input
                  id="siret"
                  name="siret"
                  value={formData.siret}
                  onChange={handleSiretChange}
                  placeholder="12345678901234"
                  maxLength={14}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="companyAddress">Adresse entreprise *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="companyAddress"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="15 rue des Artisans"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyPostalCode">Code postal *</Label>
                <Input
                  id="companyPostalCode"
                  name="companyPostalCode"
                  value={formData.companyPostalCode}
                  onChange={handleChange}
                  placeholder="75001"
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="companyCity">Ville *</Label>
                <Input
                  id="companyCity"
                  name="companyCity"
                  value={formData.companyCity}
                  onChange={handleChange}
                  placeholder="Paris"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-[var(--accent)]" />
              Contact principal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Paul"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Dupont"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email (identifiant de connexion) *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="contact@dupont-renovation.fr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RGE Qualifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-[var(--accent)]" />
              Certifications RGE (optionnel)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {RGE_QUALIFICATIONS.map((rge) => (
                <button
                  key={rge.code}
                  type="button"
                  onClick={() => toggleRge(rge.code)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.rgeQualifications.includes(rge.code)
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formData.rgeQualifications.includes(rge.code) && (
                    <Check className="h-3 w-3 inline mr-1" />
                  )}
                  {rge.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5 text-[var(--accent)]" />
              Mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Mot de passe initial *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mot de passe sécurisé"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Générer
                </Button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div
                className={`flex items-center gap-2 ${
                  passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {passwordValidation.minLength ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                8 caractères minimum
              </div>
              <div
                className={`flex items-center gap-2 ${
                  passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {passwordValidation.hasUppercase ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                1 majuscule
              </div>
              <div
                className={`flex items-center gap-2 ${
                  passwordValidation.hasLowercase ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {passwordValidation.hasLowercase ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                1 minuscule
              </div>
              <div
                className={`flex items-center gap-2 ${
                  passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {passwordValidation.hasNumber ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                1 chiffre
              </div>
              <div
                className={`flex items-center gap-2 ${
                  passwordValidation.hasSpecial ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {passwordValidation.hasSpecial ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                1 caractère spécial
              </div>
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
        <div className="flex justify-end gap-3">
          <Link href="/admin/artisans">
            <Button variant="outline" type="button">
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={!isFormValid || loading}
          >
            {loading ? 'Création...' : 'Créer l\'artisan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
