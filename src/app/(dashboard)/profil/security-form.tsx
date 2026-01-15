'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Check, Eye, EyeOff, Mail, Lock } from 'lucide-react'

interface SecurityFormProps {
  userId: string
  currentEmail: string
}

export function SecurityForm({ userId, currentEmail }: SecurityFormProps) {
  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setEmailLoading(true)

    try {
      const response = await fetch('/api/profile/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newEmail,
          password: emailPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      setEmailSuccess(true)
      setShowEmailForm(false)
      setNewEmail('')
      setEmailPassword('')
      setTimeout(() => setEmailSuccess(false), 3000)
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setEmailLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setPasswordLoading(true)

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      setPasswordSuccess(true)
      setShowPasswordForm(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Mail className="h-4 w-4" />
              Adresse email
            </div>
            <p className="font-medium text-gray-900">{currentEmail}</p>
          </div>
          {!showEmailForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailForm(true)}
            >
              Modifier
            </Button>
          )}
        </div>

        {showEmailForm && (
          <form onSubmit={handleEmailChange} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouvelle adresse email
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nouvelle@email.fr"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel (pour confirmer)
              </label>
              <Input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
              />
            </div>
            {emailError && (
              <p className="text-sm text-red-600">{emailError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={emailLoading}>
                {emailLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEmailForm(false)
                  setNewEmail('')
                  setEmailPassword('')
                  setEmailError('')
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}

        {emailSuccess && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Adresse email modifiée avec succès
          </div>
        )}
      </div>

      {/* Password Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Lock className="h-4 w-4" />
              Mot de passe
            </div>
            <p className="font-medium text-gray-900">********</p>
          </div>
          {!showPasswordForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordForm(true)}
            >
              Modifier
            </Button>
          )}
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                required
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordForm(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordError('')
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}

        {passwordSuccess && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Mot de passe modifié avec succès
          </div>
        )}
      </div>
    </div>
  )
}
