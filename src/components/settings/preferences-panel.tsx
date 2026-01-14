'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSoundNotifications } from '@/hooks/use-sound'
import {
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Mail,
  MailX,
  Monitor,
  Smartphone,
  Check,
  Loader2,
  Settings,
  X,
} from 'lucide-react'

interface UserPreferences {
  soundEnabled: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  preferredChannel: 'INTERFACE' | 'EMAIL' | 'BOTH'
}

interface PreferencesPanelProps {
  initialPreferences: UserPreferences
  onClose?: () => void
  compact?: boolean
}

export function PreferencesPanel({
  initialPreferences,
  onClose,
  compact = false,
}: PreferencesPanelProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const { playClick, playSuccess } = useSoundNotifications(preferences.soundEnabled)

  const savePreferences = useCallback(async (newPrefs: UserPreferences) => {
    setIsSaving(true)
    setSaveStatus('idle')
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs),
      })

      if (response.ok) {
        setSaveStatus('success')
        if (newPrefs.soundEnabled) {
          playSuccess()
        }
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('[Preferences] Save error:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }, [playSuccess])

  const handleToggle = (key: keyof UserPreferences) => {
    playClick()
    const newPrefs = { ...preferences, [key]: !preferences[key] }
    setPreferences(newPrefs)
    savePreferences(newPrefs)
  }

  const handleChannelChange = (channel: UserPreferences['preferredChannel']) => {
    playClick()
    const newPrefs = { ...preferences, preferredChannel: channel }
    setPreferences(newPrefs)
    savePreferences(newPrefs)
  }

  // Toggle button component
  const Toggle = ({
    enabled,
    onClick,
    label,
    iconOn,
    iconOff,
    description,
  }: {
    enabled: boolean
    onClick: () => void
    label: string
    iconOn: React.ReactNode
    iconOff: React.ReactNode
    description?: string
  }) => (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-xl transition-colors',
      enabled ? 'bg-primary-50' : 'bg-gray-50'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
          enabled ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'
        )}>
          {enabled ? iconOn : iconOff}
        </div>
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={onClick}
        className={cn(
          'relative w-12 h-7 rounded-full transition-all duration-200',
          enabled ? 'bg-primary-600' : 'bg-gray-300'
        )}
      >
        <div className={cn(
          'absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )} />
      </button>
    </div>
  )

  // Channel selection component
  const ChannelOption = ({
    value,
    label,
    icon,
    description,
    selected,
    onClick,
  }: {
    value: UserPreferences['preferredChannel']
    label: string
    icon: React.ReactNode
    description: string
    selected: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 p-4 rounded-xl border-2 transition-all duration-200',
        selected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center',
        selected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
      )}>
        {icon}
      </div>
      <p className={cn(
        'font-medium text-sm',
        selected ? 'text-primary-700' : 'text-gray-700'
      )}>
        {label}
      </p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
      {selected && (
        <div className="mt-2 flex justify-center">
          <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </button>
  )

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            {preferences.soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary-600" />
            ) : (
              <VolumeX className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm">Sons</span>
          </div>
          <button
            onClick={() => handleToggle('soundEnabled')}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              preferences.soundEnabled ? 'bg-primary-600' : 'bg-gray-300'
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
              preferences.soundEnabled ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            {preferences.emailNotifications ? (
              <Mail className="h-4 w-4 text-primary-600" />
            ) : (
              <MailX className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm">Emails</span>
          </div>
          <button
            onClick={() => handleToggle('emailNotifications')}
            className={cn(
              'w-10 h-6 rounded-full transition-colors',
              preferences.emailNotifications ? 'bg-primary-600' : 'bg-gray-300'
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
              preferences.emailNotifications ? 'translate-x-5' : 'translate-x-1'
            )} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Preferences</h2>
            <p className="text-sm text-gray-500">Notifications et sons</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Enregistre
            </div>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Toggles */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Notifications</h3>

          <Toggle
            enabled={preferences.soundEnabled}
            onClick={() => handleToggle('soundEnabled')}
            label="Sons"
            iconOn={<Volume2 className="h-5 w-5" />}
            iconOff={<VolumeX className="h-5 w-5" />}
            description="Sons de notification et micro-interactions"
          />

          <Toggle
            enabled={preferences.emailNotifications}
            onClick={() => handleToggle('emailNotifications')}
            label="Notifications par e-mail"
            iconOn={<Mail className="h-5 w-5" />}
            iconOff={<MailX className="h-5 w-5" />}
            description="Recevoir les notifications par e-mail"
          />

          <Toggle
            enabled={preferences.pushNotifications}
            onClick={() => handleToggle('pushNotifications')}
            label="Notifications dans l'application"
            iconOn={<Bell className="h-5 w-5" />}
            iconOff={<BellOff className="h-5 w-5" />}
            description="Afficher les notifications dans l'interface"
          />
        </div>

        {/* Channel preference */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Canal prefere</h3>
          <div className="flex gap-3">
            <ChannelOption
              value="INTERFACE"
              label="Interface"
              icon={<Monitor className="h-5 w-5" />}
              description="Uniquement dans l'app"
              selected={preferences.preferredChannel === 'INTERFACE'}
              onClick={() => handleChannelChange('INTERFACE')}
            />
            <ChannelOption
              value="EMAIL"
              label="E-mail"
              icon={<Mail className="h-5 w-5" />}
              description="Uniquement par e-mail"
              selected={preferences.preferredChannel === 'EMAIL'}
              onClick={() => handleChannelChange('EMAIL')}
            />
            <ChannelOption
              value="BOTH"
              label="Les deux"
              icon={<Smartphone className="h-5 w-5" />}
              description="Interface et e-mail"
              selected={preferences.preferredChannel === 'BOTH'}
              onClick={() => handleChannelChange('BOTH')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Modal wrapper for preferences
export function PreferencesModal({
  isOpen,
  onClose,
  preferences,
}: {
  isOpen: boolean
  onClose: () => void
  preferences: UserPreferences
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Content */}
      <div className="relative w-full max-w-lg animate-scale-in">
        <PreferencesPanel initialPreferences={preferences} onClose={onClose} />
      </div>
    </div>
  )
}
