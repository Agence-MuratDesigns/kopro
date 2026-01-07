'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

interface RealtimeEvent {
  type: 'notification' | 'message' | 'step_update' | 'document_update' | 'dossier_update'
  data: any
  timestamp: number
}

interface RealtimeContextType {
  isConnected: boolean
  lastEvent: RealtimeEvent | null
  unreadNotifications: number
  unreadMessages: number
  currentAction: string | null
  subscribe: (callback: (event: RealtimeEvent) => void) => () => void
  refreshCounts: () => void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function RealtimeProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const subscribersRef = useRef<Set<(event: RealtimeEvent) => void>>(new Set())
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`/api/realtime/events?userId=${userId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      console.log('[Realtime] Connected')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const realtimeEvent: RealtimeEvent = {
          type: data.type,
          data: data.payload,
          timestamp: Date.now(),
        }

        setLastEvent(realtimeEvent)

        // Update counts based on event type
        if (data.type === 'notification') {
          setUnreadNotifications(prev => prev + 1)
        } else if (data.type === 'message') {
          setUnreadMessages(prev => prev + 1)
        } else if (data.type === 'counts') {
          setUnreadNotifications(data.payload.notifications || 0)
          setUnreadMessages(data.payload.messages || 0)
        }

        // Notify all subscribers
        subscribersRef.current.forEach(callback => callback(realtimeEvent))
      } catch (error) {
        console.error('[Realtime] Parse error:', error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()

      // Reconnect after 5 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[Realtime] Reconnecting...')
        connect()
      }, 5000)
    }
  }, [userId])

  const refreshCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/realtime/counts')
      if (response.ok) {
        const data = await response.json()
        setUnreadNotifications(data.notifications || 0)
        setUnreadMessages(data.messages || 0)
      }
    } catch (error) {
      console.error('[Realtime] Refresh counts error:', error)
    }
  }, [])

  const subscribe = useCallback((callback: (event: RealtimeEvent) => void) => {
    subscribersRef.current.add(callback)
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  useEffect(() => {
    connect()
    refreshCounts()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect, refreshCounts])

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        lastEvent,
        unreadNotifications,
        unreadMessages,
        currentAction,
        subscribe,
        refreshCounts,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

export function useRealtimeEvent(
  eventType: RealtimeEvent['type'] | RealtimeEvent['type'][],
  callback: (event: RealtimeEvent) => void
) {
  const { subscribe } = useRealtime()

  useEffect(() => {
    const types = Array.isArray(eventType) ? eventType : [eventType]

    const unsubscribe = subscribe((event) => {
      if (types.includes(event.type)) {
        callback(event)
      }
    })

    return unsubscribe
  }, [eventType, callback, subscribe])
}
