'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatDateTime } from '@/lib/utils'
import { useSoundNotifications } from '@/hooks/use-sound'
import {
  Bell,
  X,
  Check,
  CheckCheck,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  ChevronRight,
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: string
  dossier?: {
    reference: string
  }
}

interface NotificationDropdownProps {
  userId: string
  initialCount?: number
  soundEnabled?: boolean
}

export function NotificationDropdown({
  userId,
  initialCount = 0,
  soundEnabled = true,
}: NotificationDropdownProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { playNotification, playClick } = useSoundNotifications(soundEnabled)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications
  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('[Notifications] Fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Poll for new notifications
  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/realtime/counts')
        if (response.ok) {
          const data = await response.json()
          if (data.notifications > unreadCount) {
            setUnreadCount(data.notifications)
            setHasNew(true)
            playNotification()
            setTimeout(() => setHasNew(false), 2000)
            // Refresh full list
            fetchNotifications()
          }
        }
      } catch (error) {
        // Silent fail
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [unreadCount, playNotification])

  const handleOpen = () => {
    playClick()
    setIsOpen(!isOpen)
    if (!isOpen) {
      fetchNotifications()
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('[Notifications] Mark read error:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('[Notifications] Mark all read error:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    playClick()
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      router.push(notification.link)
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'STEP_VALIDATED':
      case 'DOCUMENT_VALIDATED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'STEP_REJECTED':
      case 'DOCUMENT_REJECTED':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'NEW_MESSAGE':
      case 'SUPPORT_REQUEST':
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'STEP_AVAILABLE':
      case 'ACTION_REQUIRED':
        return <Clock className="h-5 w-5 text-amber-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
          hasNew && 'animate-pulse'
        )}
      >
        <Bell className={cn('h-5 w-5', hasNew && 'animate-wiggle')} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Tout marquer lu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2" />
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Bell className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(notification => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3',
                      !notification.isRead && 'bg-primary-50/50'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm',
                          !notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                        )}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{formatDateTime(notification.createdAt)}</span>
                        {notification.dossier && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {notification.dossier.reference}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {notification.link && (
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-gray-50">
            <button
              onClick={() => {
                router.push('/notifications')
                setIsOpen(false)
              }}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 py-1"
            >
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
