'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUserAvatar } from '@/contexts/user-avatar-context'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  firstName: string
  lastName: string
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  firstName,
  lastName,
}: AvatarUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const { avatarUrl, setAvatarUrl } = useUserAvatar()

  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase()
  const displayAvatarUrl = avatarUrl ?? currentAvatarUrl

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Format accepté : JPG ou PNG')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La taille maximale est de 2 Mo')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Erreur lors du téléchargement')
        return
      }

      const data = await response.json()
      // Update the avatar context to sync with sidebar
      if (data.avatarUrl) {
        setAvatarUrl(data.avatarUrl)
      }
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!displayAvatarUrl) return

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
        return
      }

      // Clear the avatar in context
      setAvatarUrl(null)
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Avatar and Actions */}
      <div className="flex items-center gap-6">
        {/* Large Avatar */}
        <div className={`w-24 h-24 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-2 ${
          displayAvatarUrl
            ? 'bg-white border-gray-200'
            : 'bg-gradient-to-br from-accent to-primary-400 border-accent'
        }`}>
          {displayAvatarUrl ? (
            <img
              src={displayAvatarUrl}
              alt={`${firstName} ${lastName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-white">{initials}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Remplacer l'avatar"
            )}
          </Button>

          {displayAvatarUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
              className="flex items-center gap-2 text-sm text-kopro-grey hover:text-kopro-dark transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-kopro-required">
          {error}
        </p>
      )}

      {/* Format hint */}
      <p className="text-xs text-kopro-grey">
        Formats acceptés : JPG, PNG. Taille maximale : 2 Mo
      </p>
    </div>
  )
}
