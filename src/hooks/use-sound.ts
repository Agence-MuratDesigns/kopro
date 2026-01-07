'use client'

import { useCallback, useEffect, useRef } from 'react'

type SoundType = 'message' | 'notification' | 'success' | 'error' | 'click'

// Base64 encoded short sounds (very small audio files)
const SOUNDS: Record<SoundType, string> = {
  // Short gentle chime for messages
  message: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2QkpOVj4J1ZmJtfI2YmZaQhHRlY3B+jpaZlpGFd2llbXuLlZiXlIl8cGlpcHuGjZCQjoiCenRwcXV5fYGEhoaGhoWEgn98eXh3d3h5e31/gIGBgIB/fn18e3t6enp6e3x9fn5+fn59fHt6eXl5eXp6e3x9fX5+fn19fHx7enp5eXl5eXl6ent8fH19fX19fHx7e3p6eXl5eXp6ent7fHx8fHx8fHx7e3t7enp6enp6ent7e3x8fHx8fHx8e3t7e3t7e3t7e3t7e3t8fHx8fHx8fHx8fHx8fHt7e3t7e3t7e3t7fHx8fHx8fHx8fHx8fHx8fHx8fHx8',
  // Distinct notification sound
  notification: 'data:audio/wav;base64,UklGRpQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSAGAACAgoKEhomNkJSXmpydn5+enJqXlJCNiYWCgH9+fn5/gIGDhYiKjI6QkZKSkpGQj42LiIaCgH9+fn5+f4CBg4WGiImKi4uLiomIhoWDgYB/fn5+fn9/gIGCg4SFhoaGhoaFhIOCgYB/fn5+fn5/f4CAgYKCg4OEhISEg4OCgYGAgH9/fn5+fn9/gICBgYKCgoKCgoKCgYGBgICAf39/f39/f4CAgIGBgYGBgYGBgYGBgYCAgICAf39/f39/f4CAgICAgYGBgYGBgYGBgYGAgICAgH9/f39/f39/',
  // Positive success sound
  success: 'data:audio/wav;base64,UklGRrQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAGAACAf35+fn+AgYOFh4mLjI2Oj4+Pj46NjIqIhoSCgH9+fX19fn+AgYOEhoiJioqLi4uLiomIh4WEgoGAf35+fn5+f4CBgoSFhoiIiYmKiYmIh4aFhIOCgYB/fn5+fn5/f4CBgoOEhYaGh4eHhoaFhIOCgYGAf39+fn5+fn+AgIGCg4OEhYWFhYWFhISEg4KCgYGAf39/fn5+fn9/gICBgoKDg4SEhISEhIODg4KCgYGAf3+Af39/f39/gICAgYGCgoKDg4ODg4ODgoKCgYGBgICAf39/f39/f4CAgIGBgYKCgoKCgoKCgoGBgYGAgIB/',
  // Neutral error/warning sound
  error: 'data:audio/wav;base64,UklGRoQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YRAGAACAgoSDgH59fX6AhIiMj5GTlJOSj4yIhIB9e3t8f4OHi46RkpOTkpCNiYWBfnt6e36ChomMj5GSk5KRj4yIhIF+e3p7foGFiYyPkZKSkpGPjIiEgX56ent+goaJjI+RkpKRkI6LiISBfnt6e32BhYmMj5GSkpGQjouIhIF+fHt7foKGiYyPkZKSkZCOi4iFgX58e3t+goWJjI+RkpKRkI6LiIWBfnx7e36ChomMj5GSkpGQjouIhYF+fHt7foKFiYyPkZKSkZCOi4iFgX58e3t+goWJjI8=',
  // Short click feedback
  click: 'data:audio/wav;base64,UklGRiQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAGAACAf39/f4CAgICAgYGBgYGBgYGBgYGAgICAgH9/f39/f39/f39/gICAgICAgICAgICAgICAgH9/f39/f39/f39/gICAgICAgICAgICAgH9/f39/f39/f39/f4CAgICAgICAgICAgIB/f39/f39/f39/f3+AgICAgICAgICAgICAf39/f39/f39/f39/gICAgICAgICAgICAgH9/f39/f39/f39/f4CAgICAgICAgICAgIB/f39/f39/f39/f3+AgICAgICAgICAgICAf39/f39/f39/f39/',
}

interface UseSoundOptions {
  enabled?: boolean
  volume?: number
}

export function useSound(options: UseSoundOptions = {}) {
  const { enabled = true, volume = 0.3 } = options
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioBuffersRef = useRef<Map<SoundType, AudioBuffer>>(new Map())

  // Initialize audio context and preload sounds
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

        // Preload all sounds
        for (const [type, dataUri] of Object.entries(SOUNDS)) {
          try {
            const response = await fetch(dataUri)
            const arrayBuffer = await response.arrayBuffer()
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
            audioBuffersRef.current.set(type as SoundType, audioBuffer)
          } catch (error) {
            console.warn(`[Sound] Failed to load ${type}:`, error)
          }
        }
      } catch (error) {
        console.warn('[Sound] Audio context not supported:', error)
      }
    }

    initAudio()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [enabled])

  const play = useCallback((type: SoundType) => {
    if (!enabled || !audioContextRef.current) return

    const buffer = audioBuffersRef.current.get(type)
    if (!buffer) return

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }

      const source = audioContextRef.current.createBufferSource()
      const gainNode = audioContextRef.current.createGain()

      source.buffer = buffer
      gainNode.gain.value = volume

      source.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      source.start(0)
    } catch (error) {
      console.warn('[Sound] Playback error:', error)
    }
  }, [enabled, volume])

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
