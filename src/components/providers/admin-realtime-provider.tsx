'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface AdminRealtimeEvent {
  type: 'dossier_update' | 'mpr_submitted' | 'mandate_submitted' | 'quotes_submitted' | 'invoices_submitted' | 'work_started' | 'message' | 'admin_refresh'
  data: {
    dossierId?: string
    clientName?: string
    action?: string
    message?: string
  }
  timestamp: number
}

interface AdminRealtimeContextType {
  isConnected: boolean
  lastEvent: AdminRealtimeEvent | null
  pendingCount: number
  subscribe: (callback: (event: AdminRealtimeEvent) => void) => () => void
  triggerRefresh: () => void
}

const AdminRealtimeContext = createContext<AdminRealtimeContextType | null>(null)

export function AdminRealtimeProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<AdminRealtimeEvent | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const subscribersRef = useRef<Set<(event: AdminRealtimeEvent) => void>>(new Set())
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`/api/realtime/admin-events?userId=${userId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      console.log('[Admin Realtime] Connected')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'admin_counts') {
          setPendingCount(data.payload.pendingValidations || 0)
          return
        }

        const realtimeEvent: AdminRealtimeEvent = {
          type: data.type,
          data: data.payload,
          timestamp: Date.now(),
        }

        setLastEvent(realtimeEvent)

        // Auto-refresh the page for important updates
        if (['mpr_submitted', 'mandate_submitted', 'quotes_submitted', 'invoices_submitted', 'work_started', 'dossier_update'].includes(data.type)) {
          router.refresh()
        }

        // Notify all subscribers
        subscribersRef.current.forEach(callback => callback(realtimeEvent))
      } catch (error) {
        console.error('[Admin Realtime] Parse error:', error)
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
        console.log('[Admin Realtime] Reconnecting...')
        connect()
      }, 5000)
    }
  }, [userId, router])

  const subscribe = useCallback((callback: (event: AdminRealtimeEvent) => void) => {
    subscribersRef.current.add(callback)
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  const triggerRefresh = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  return (
    <AdminRealtimeContext.Provider
      value={{
        isConnected,
        lastEvent,
        pendingCount,
        subscribe,
        triggerRefresh,
      }}
    >
      {children}
    </AdminRealtimeContext.Provider>
  )
}

export function useAdminRealtime() {
  const context = useContext(AdminRealtimeContext)
  if (!context) {
    throw new Error('useAdminRealtime must be used within an AdminRealtimeProvider')
  }
  return context
}
