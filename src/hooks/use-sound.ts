'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type SoundType = 'message' | 'notification' | 'success' | 'error' | 'click'

// Sound generator functions using Web Audio API synthesis
// These create more modern, pleasant sounds programmatically
interface SoundConfig {
  frequencies: number[]
  durations: number[]
  gains: number[]
  type: OscillatorType
  fadeOut?: boolean
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  // Modern message sound - soft ascending chime with harmonics
  message: {
    frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 - major chord
    durations: [0.15, 0.15, 0.25],
    gains: [0.3, 0.25, 0.2],
    type: 'sine',
    fadeOut: true,
  },
  // Notification sound - pleasant bell-like tone with shimmer
  notification: {
    frequencies: [880, 1108.73, 1318.51, 880], // A5, C#6, E6, A5 - bright arpeggio
    durations: [0.12, 0.12, 0.12, 0.3],
    gains: [0.25, 0.2, 0.18, 0.15],
    type: 'sine',
    fadeOut: true,
  },
  // Success sound - uplifting rising tones
  success: {
    frequencies: [523.25, 659.25, 783.99, 1046.5], // C5, E5, G5, C6 - rising major
    durations: [0.1, 0.1, 0.1, 0.35],
    gains: [0.2, 0.22, 0.24, 0.2],
    type: 'sine',
    fadeOut: true,
  },
  // Error sound - gentle but noticeable descending tone
  error: {
    frequencies: [440, 349.23, 293.66], // A4, F4, D4 - descending
    durations: [0.15, 0.15, 0.25],
    gains: [0.25, 0.22, 0.18],
    type: 'triangle',
    fadeOut: true,
  },
  // Click sound - subtle pop
  click: {
    frequencies: [1200, 800],
    durations: [0.03, 0.05],
    gains: [0.15, 0.08],
    type: 'sine',
    fadeOut: true,
  },
}

interface UseSoundOptions {
  enabled?: boolean
  volume?: number
}

export function useSound(options: UseSoundOptions = {}) {
  const { enabled = true, volume = 0.4 } = options
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context on first interaction
  const ensureContext = useCallback(() => {
    if (typeof window === 'undefined') return null

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }

    return audioContextRef.current
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  const play = useCallback((type: SoundType) => {
    if (!enabled) return

    const ctx = ensureContext()
    if (!ctx) return

    const config = SOUND_CONFIGS[type]
    const now = ctx.currentTime
    let timeOffset = 0

    try {
      config.frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.type = config.type
        oscillator.frequency.setValueAtTime(freq, now + timeOffset)

        // Set initial gain
        const gain = config.gains[i] * volume
        gainNode.gain.setValueAtTime(gain, now + timeOffset)

        // Apply fade out for smoother sound
        if (config.fadeOut) {
          const duration = config.durations[i]
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + duration)
        }

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.start(now + timeOffset)
        oscillator.stop(now + timeOffset + config.durations[i])

        timeOffset += config.durations[i] * 0.6 // Overlap notes slightly
      })
    } catch (error) {
      console.warn('[Sound] Playback error:', error)
    }
  }, [enabled, volume, ensureContext])

  return { play }
}

// Hook for using sounds with realtime events
export function useSoundNotifications(soundEnabled: boolean = true) {
  const { play } = useSound({ enabled: soundEnabled })

  const playMessage = useCallback(() => play('message'), [play])
  const playNotification = useCallback(() => play('notification'), [play])
  const playSuccess = useCallback(() => play('success'), [play])
  const playError = useCallback(() => play('error'), [play])
  const playClick = useCallback(() => play('click'), [play])

  return {
    playMessage,
    playNotification,
    playSuccess,
    playError,
    playClick,
  }
}

// Sound toggle hook with localStorage persistence
const SOUND_STORAGE_KEY = 'kopro-sound-enabled'

export function useSoundToggle(initialEnabled: boolean = true) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return initialEnabled
    const stored = localStorage.getItem(SOUND_STORAGE_KEY)
    return stored !== null ? stored === 'true' : initialEnabled
  })

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev
      localStorage.setItem(SOUND_STORAGE_KEY, String(newValue))
      return newValue
    })
  }, [])

  const setSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled)
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled))
  }, [])

  // Sync with server preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY)
      if (stored !== null) {
        setSoundEnabled(stored === 'true')
      }
    }
  }, [])

  return { soundEnabled, toggleSound, setSound }
}
