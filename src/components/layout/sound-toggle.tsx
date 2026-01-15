'use client'

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSoundToggle, useSound } from '@/hooks/use-sound'

interface SoundToggleProps {
  className?: string
  initialEnabled?: boolean
  onToggle?: (enabled: boolean) => void
}

export function SoundToggle({ className, initialEnabled = true, onToggle }: SoundToggleProps) {
  const { soundEnabled, toggleSound, setSound } = useSoundToggle(initialEnabled)
  const { play } = useSound({ enabled: soundEnabled })
  const [isHovered, setIsHovered] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure hydration matches
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync with server preference
  useEffect(() => {
    if (initialEnabled !== undefined && mounted) {
      // Only sync on initial mount, not on every change
    }
  }, [initialEnabled, mounted])

  const handleToggle = () => {
    // Play a subtle click when enabling sound
    if (!soundEnabled) {
      // Will play after state update
      setTimeout(() => play('click'), 50)
    }
    toggleSound()
    onToggle?.(!soundEnabled)
  }

  if (!mounted) {
    // Render placeholder during SSR
    return (
      <button
        className={cn(
          'relative p-2 rounded-lg transition-all duration-200',
          'text-gray-500 hover:bg-gray-100',
          className
        )}
        aria-label="Son des notifications"
      >
        <Volume2 className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-200',
        soundEnabled
          ? 'text-primary-600 hover:bg-primary-50'
          : 'text-gray-400 hover:bg-gray-100',
        className
      )}
      aria-label={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
      title={soundEnabled ? 'Sons activés - Cliquez pour désactiver' : 'Sons désactivés - Cliquez pour activer'}
    >
      {/* Sound icon with animation */}
      <div className="relative">
        {soundEnabled ? (
          <Volume2
            className={cn(
              'h-5 w-5 transition-transform duration-200',
              isHovered && 'scale-110'
            )}
          />
        ) : (
          <VolumeX
            className={cn(
              'h-5 w-5 transition-transform duration-200',
              isHovered && 'scale-110'
            )}
          />
        )}

        {/* Status indicator dot */}
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full transition-colors duration-200',
            soundEnabled ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
      </div>

      {/* Hover tooltip (visible on larger screens) */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1',
          'bg-gray-900 text-white text-xs rounded whitespace-nowrap',
          'opacity-0 pointer-events-none transition-opacity duration-200',
          'hidden lg:block',
          isHovered && 'opacity-100'
        )}
      >
        {soundEnabled ? 'Sons activés' : 'Sons désactivés'}
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 rotate-45" />
      </div>
    </button>
  )
}
