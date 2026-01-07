'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useSoundNotifications } from '@/hooks/use-sound'
import {
  Volume2,
  VolumeX,
  Mail,
  Bell,
  BellOff,
  Loader2,
  Save,
  Check,
} from 'lucide-react'

interface PreferencesFormProps {
  userId: string
  preferences: {
    soundEnabled: boolean
    emailNotifications: boolean
    pushNotifications: boolean
    preferredChannel: string
  }
}

export function PreferencesForm({ userId, preferences }: PreferencesFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    soundEnabled: preferences.soundEnabled,
    emailNotifications: preferences.emailNotifications,
    pushNotifications: preferences.pushNotifications,
    preferredChannel: preferences.preferredChannel,
  })

  const { playClick, playSuccess } = useSoundNotifications(formData.soundEnabled)

  const handleToggle = (key: keyof typeof formData) => {
    playClick()
    setFormData(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
    setSuccess(false)
    setError('')
  }

  const handleChannelChange = (channel: string) => {
    playClick()
    setFormData(prev => ({
      ...prev,
      preferredChannel: channel,
    }))
    setSuccess(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    playClick()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la sauvegarde')
        return
      }

      playSuccess()
      setSuccess(true)
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
          Vos préférences ont été enregistrées
        </Alert>
      )}

      {/* Sound */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Sons</h4>
        <button
          type="button"
          onClick={() => handleToggle('soundEnabled')}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-lg border transition-colors',
            formData.soundEnabled
              ? 'bg-primary-50 border-primary-200'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-3">
            {formData.soundEnabled ? (
              <Volume2 className="h-5 w-5 text-primary-600" />
            ) : (
              <VolumeX className="h-5 w-5 text-gray-400" />
            )}
            <div className="text-left">
              <p className="font-medium text-gray-900">Sons de notification</p>
              <p className="text-sm text-gray-500">
                Sons courts lors des actions et notifications
              </p>
            </div>
          </div>
          <div
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative',
              formData.soundEnabled ? 'bg-primary-600' : 'bg-gray-300'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                formData.soundEnabled ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </div>
        </button>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Notifications</h4>

        {/* Push notifications */}
        <button
          type="button"
          onClick={() => handleToggle('pushNotifications')}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-lg border transition-colors',
            formData.pushNotifications
              ? 'bg-primary-50 border-primary-200'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-3">
            {formData.pushNotifications ? (
              <Bell className="h-5 w-5 text-primary-600" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <div className="text-left">
              <p className="font-medium text-gray-900">Notifications dans l'application</p>
              <p className="text-sm text-gray-500">
                Alertes en temps réel dans KOPRO
              </p>
            </div>
          </div>
          <div
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative',
              formData.pushNotifications ? 'bg-primary-600' : 'bg-gray-300'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                formData.pushNotifications ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </div>
        </button>

        {/* Email notifications */}
        <button
          type="button"
          onClick={() => handleToggle('emailNotifications')}
          className={cn(
            'w-full flex items-center justify-between p-4 rounded-lg border transition-colors',
            formData.emailNotifications
              ? 'bg-primary-50 border-primary-200'
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          )}
        >
          <div className="flex items-center gap-3">
            <Mail className={cn('h-5 w-5', formData.emailNotifications ? 'text-primary-600' : 'text-gray-400')} />
            <div className="text-left">
              <p className="font-medium text-gray-900">Notifications par email</p>
              <p className="text-sm text-gray-500">
                Recevoir les alertes importantes par email
              </p>
            </div>
          </div>
          <div
            className={cn(
              'w-12 h-6 rounded-full transition-colors relative',
              formData.emailNotifications ? 'bg-primary-600' : 'bg-gray-300'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                formData.emailNotifications ? 'translate-x-7' : 'translate-x-1'
              )}
            />
          </div>
        </button>
      </div>

      {/* Preferred channel */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Canal préféré</h4>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'INTERFACE', label: 'Application', icon: Bell },
            { value: 'EMAIL', label: 'Email', icon: Mail },
            { value: 'BOTH', label: 'Les deux', icon: Check },
          ].map(option => {
            const Icon = option.icon
            const isSelected = formData.preferredChannel === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChannelChange(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                  isSelected
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            )
          })}
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
              Enregistrer les préférences
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
