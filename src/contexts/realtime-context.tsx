'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

// Event types for real-time updates
export type RealtimeEventType =
  | 'notification'
  | 'message'
  | 'step_update'
  | 'document_update'
  | 'dossier_update'
  | 'counts'
  | 'action_start'
  | 'action_complete'
  | 'typing'

export interface RealtimeEvent {
  type: RealtimeEventType
  data: any
  timestamp: number
}

// Action state for tracking pending operations
export interface ActionState {
  id: string
  type: string
  description: string
  startedAt: number
  dossierId?: string
}

interface RealtimeContextType {
  // Connection state
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'

  // Events
  lastEvent: RealtimeEvent | null

  // Counts
  unreadNotifications: number
  unreadMessages: number

  // Actions tracking
  pendingActions: ActionState[]
  currentAction: ActionState | null

  // Methods
  subscribe: (callback: (event: RealtimeEvent) => void) => () => void
  refreshCounts: () => void
  startAction: (type: string, description: string, dossierId?: string) => string
  completeAction: (actionId: string) => void

  // Helpers
  decrementNotifications: () => void
  decrementMessages: () => void
  setNotificationCount: (count: number) => void
  setMessageCount: (count: number) => void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function RealtimeProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingActions, setPendingActions] = useState<ActionState[]>([])

  const subscribersRef = useRef<Set<(event: RealtimeEvent) => void>>(new Set())
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 10

  const isConnected = connectionStatus === 'connected'
  const currentAction = pendingActions.length > 0 ? pendingActions[0] : null

  // Broadcast event to all subscribers
  const broadcastToSubscribers = useCallback((event: RealtimeEvent) => {
    subscribersRef.current.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('[Realtime] Subscriber error:', error)
      }
    })
  }, [])

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setConnectionStatus('connecting')
    const eventSource = new EventSource(`/api/realtime/events?userId=${userId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setConnectionStatus('connected')
      reconnectAttempts.current = 0
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
        switch (data.type) {
          case 'notification':
            setUnreadNotifications(prev => prev + 1)
            break
          case 'message':
            setUnreadMessages(prev => prev + 1)
            break
          case 'counts':
            setUnreadNotifications(data.payload.notifications || 0)
            setUnreadMessages(data.payload.messages || 0)
            break
          case 'step_update':
          case 'document_update':
          case 'dossier_update':
            // These events may affect UI state, but counts are handled separately
            break
        }

        // Notify all subscribers
        broadcastToSubscribers(realtimeEvent)
      } catch (error) {
        console.error('[Realtime] Parse error:', error)
      }
    }

    eventSource.onerror = () => {
      setConnectionStatus('disconnected')
      eventSource.close()

      // Exponential backoff for reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`[Realtime] Reconnecting (attempt ${reconnectAttempts.current})...`)
          connect()
        }, delay)
      } else {
        setConnectionStatus('error')
        console.error('[Realtime] Max reconnection attempts reached')
      }
    }
  }, [userId, broadcastToSubscribers])

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

  // Action tracking
  const startAction = useCallback((type: string, description: string, dossierId?: string): string => {
    const id = Math.random().toString(36).substring(2, 9)
    const action: ActionState = {
      id,
      type,
      description,
      startedAt: Date.now(),
      dossierId,
    }
    setPendingActions(prev => [...prev, action])
    return id
  }, [])

  const completeAction = useCallback((actionId: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId))
  }, [])

  // Count helpers
  const decrementNotifications = useCallback(() => {
    setUnreadNotifications(prev => Math.max(0, prev - 1))
  }, [])

  const decrementMessages = useCallback(() => {
    setUnreadMessages(prev => Math.max(0, prev - 1))
  }, [])

  const setNotificationCount = useCallback((count: number) => {
    setUnreadNotifications(count)
  }, [])

  const setMessageCount = useCallback((count: number) => {
    setUnreadMessages(count)
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
        connectionStatus,
        lastEvent,
        unreadNotifications,
        unreadMessages,
        pendingActions,
        currentAction,
        subscribe,
        refreshCounts,
        startAction,
        completeAction,
        decrementNotifications,
        decrementMessages,
        setNotificationCount,
        setMessageCount,
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
