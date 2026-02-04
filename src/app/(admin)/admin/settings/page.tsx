'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import {
  User,
  Lock,
  Bell,
  Palette,
  Check,
  X,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Building,
  Save,
} from 'lucide-react'

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  emailNotifications: boolean
  pushNotifications: boolean
  preferredChannel: string
}

interface PasswordValidation {
  minLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

export default function AdminSettingsPage() {
  // États pour le profil
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // États pour le formulaire profil
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  // États pour le mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // États pour les notifications
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    preferredChannel: 'BOTH',
  })
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState('')
  const [notificationSuccess, setNotificationSuccess] = useState('')

  // Chargement du profil
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/admin/settings/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
          setProfileForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
          })
          setNotificationSettings({
            emailNotifications: data.emailNotifications ?? true,
            pushNotifications: data.pushNotifications ?? true,
            preferredChannel: data.preferredChannel || 'BOTH',
          })
        }
      } catch {
        setProfileError('Erreur lors du chargement du profil')
      } finally {
        setIsLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  // Validation du mot de passe
  const validatePassword = (password: string): PasswordValidation => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  })

  const passwordValidation = validatePassword(passwordForm.newPassword)
  const isPasswordValid = Object.values(passwordValidation).every(Boolean)
  const passwordsMatch = passwordForm.newPassword === passwordForm.confirmPassword

  // Handlers
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm(prev => ({ ...prev, [name]: value }))
    setProfileError('')
    setProfileSuccess('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handleNotificationChange = (key: string, value: boolean | string) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
    setNotificationError('')
    setNotificationSuccess('')
  }

  // Soumission profil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')

    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/
    if (!nameRegex.test(profileForm.firstName.trim())) {
      setProfileError('Le prénom doit contenir entre 2 et 50 caractères')
      return
    }
    if (!nameRegex.test(profileForm.lastName.trim())) {
      setProfileError('Le nom doit contenir entre 2 et 50 caractères')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(profileForm.email.trim().toLowerCase())) {
      setProfileError('Adresse email invalide')
      return
    }

    setIsSavingProfile(true)
    try {
      const response = await fetch('/api/admin/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })

      if (!response.ok) {
        const data = await response.json()
        setProfileError(data.error || 'Erreur lors de la mise à jour')
        return
      }

      setProfileSuccess('Profil mis à jour avec succès')
    } catch {
      setProfileError('Erreur de connexion au serveur')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Soumission mot de passe
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordForm.currentPassword) {
      setPasswordError('Veuillez saisir votre mot de passe actuel')
      return
    }

    if (!isPasswordValid) {
      setPasswordError('Le nouveau mot de passe ne respecte pas les critères')
      return
    }

    if (!passwordsMatch) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    setIsSavingPassword(true)
    try {
      const response = await fetch('/api/admin/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setPasswordError(data.error || 'Erreur lors du changement de mot de passe')
        return
      }

      setPasswordSuccess('Mot de passe modifié avec succès')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch {
      setPasswordError('Erreur de connexion au serveur')
    } finally {
      setIsSavingPassword(false)
    }
  }

  // Soumission notifications
  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotificationError('')
    setNotificationSuccess('')
    setIsSavingNotifications(true)

    try {
      const response = await fetch('/api/admin/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings),
      })

      if (!response.ok) {
        const data = await response.json()
        setNotificationError(data.error || 'Erreur lors de la mise à jour')
        return
      }

      setNotificationSuccess('Préférences de notification mises à jour')
    } catch {
      setNotificationError('Erreur de connexion au serveur')
    } finally {
      setIsSavingNotifications(false)
    }
  }

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${valid ? 'text-kopro-success' : 'text-gray-400'}`}>
      {valid ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {text}
    </div>
  )

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">
          Gérez votre profil, vos préférences de sécurité et de notifications
        </p>
      </div>

      {/* Section Profil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-[var(--accent)]" />
            Informations personnelles
          </CardTitle>
          <CardDescription>
            Vos informations de profil administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {profileError && (
              <Alert variant="error" title="Erreur">
                {profileError}
              </Alert>
            )}
            {profileSuccess && (
              <Alert variant="success" title="Succès">
                {profileSuccess}
              </Alert>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  placeholder="Votre prénom"
                  disabled={isSavingProfile}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  placeholder="Votre nom"
                  disabled={isSavingProfile}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  Adresse email
                </span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="admin@kopro.fr"
                disabled={isSavingProfile}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  Téléphone
                </span>
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="06 12 34 56 78"
                disabled={isSavingProfile}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? (
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
        </CardContent>
      </Card>

      {/* Section Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[var(--accent)]" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Modifiez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {passwordError && (
              <Alert variant="error" title="Erreur">
                {passwordError}
              </Alert>
            )}
            {passwordSuccess && (
              <Alert variant="success" title="Succès">
                {passwordSuccess}
              </Alert>
            )}

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  disabled={isSavingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  disabled={isSavingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {passwordForm.newPassword && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1">
                  <p className="text-sm font-medium text-gray-700 mb-2">Critères du mot de passe :</p>
                  <ValidationItem valid={passwordValidation.minLength} text="Au moins 8 caractères" />
                  <ValidationItem valid={passwordValidation.hasUppercase} text="Au moins une majuscule" />
                  <ValidationItem valid={passwordValidation.hasLowercase} text="Au moins une minuscule" />
                  <ValidationItem valid={passwordValidation.hasNumber} text="Au moins un chiffre" />
                  <ValidationItem valid={passwordValidation.hasSpecial} text="Au moins un caractère spécial (!@#$%...)" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  disabled={isSavingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.confirmPassword && !passwordsMatch && (
                <p className="text-sm text-kopro-required mt-1">Les mots de passe ne correspondent pas</p>
              )}
              {passwordForm.confirmPassword && passwordsMatch && passwordForm.newPassword && (
                <p className="text-sm text-kopro-success mt-1 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Les mots de passe correspondent
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSavingPassword || !isPasswordValid || !passwordsMatch || !passwordForm.currentPassword}
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Modifier le mot de passe
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[var(--accent)]" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configurez comment vous souhaitez recevoir les notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNotificationsSubmit} className="space-y-6">
            {notificationError && (
              <Alert variant="error" title="Erreur">
                {notificationError}
              </Alert>
            )}
            {notificationSuccess && (
              <Alert variant="success" title="Succès">
                {notificationSuccess}
              </Alert>
            )}

            <div className="space-y-4">
              {/* Toggle Notifications Email */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Notifications par email</h4>
                  <p className="text-sm text-gray-500">Recevez un email pour chaque nouvelle action importante</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange('emailNotifications', !notificationSettings.emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.emailNotifications ? 'bg-[var(--accent)]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle Notifications Interface */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Notifications dans l'interface</h4>
                  <p className="text-sm text-gray-500">Affichez les notifications en temps réel dans l'application</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNotificationChange('pushNotifications', !notificationSettings.pushNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.pushNotifications ? 'bg-[var(--accent)]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Canal préféré */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-3">Canal de notification préféré</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'INTERFACE', label: 'Interface' },
                    { value: 'EMAIL', label: 'Email' },
                    { value: 'BOTH', label: 'Les deux' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleNotificationChange('preferredChannel', option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        notificationSettings.preferredChannel === option.value
                          ? 'bg-[var(--accent)] text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-[var(--accent)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSavingNotifications}>
                {isSavingNotifications ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer les préférences
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section Informations Entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-[var(--accent)]" />
            Informations KOPRO
          </CardTitle>
          <CardDescription>
            Informations sur la configuration de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Version de l'application</h4>
              <p className="text-lg font-semibold text-gray-900">1.0.0</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Environnement</h4>
              <p className="text-lg font-semibold text-gray-900">Production</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Base de données</h4>
              <p className="text-lg font-semibold text-gray-900">SQLite (Prisma)</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Dernière mise à jour</h4>
              <p className="text-lg font-semibold text-gray-900">Janvier 2026</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
