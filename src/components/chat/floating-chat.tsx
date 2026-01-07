'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSoundNotifications } from '@/hooks/use-sound'
import { useRealtime, useRealtimeEvent } from '@/contexts/realtime-context'
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Info,
  Bot,
  Wifi,
  WifiOff,
  Minimize2,
  Maximize2,
} from 'lucide-react'

interface Message {
  id: string
  content: string
  messageType: 'CLIENT' | 'ADMIN' | 'SYSTEM'
  category?: string
  createdAt: string
  sender?: {
    firstName: string
    lastName: string
    role: string
  }
}

interface Dossier {
  id: string
  reference: string
}

interface FloatingChatProps {
  userId: string
  dossiers: Dossier[]
  initialMessages?: Message[]
  unreadCount?: number
  soundEnabled?: boolean
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <div className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
        <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot" />
      </div>
    </div>
  )
}

// Connection status indicator
function ConnectionStatus({ status }: { status: 'connecting' | 'connected' | 'disconnected' | 'error' }) {
  const statusConfig = {
    connecting: { icon: Wifi, label: 'Connexion...', className: 'connection-connecting' },
    connected: { icon: Wifi, label: 'Connecte', className: 'connection-connected' },
    disconnected: { icon: WifiOff, label: 'Deconnecte', className: 'connection-disconnected' },
    error: { icon: WifiOff, label: 'Erreur', className: 'connection-disconnected' },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <div className={cn('connection-indicator', config.className)} />
      <span>{config.label}</span>
    </div>
  )
}

export function FloatingChat({
  userId,
  dossiers,
  initialMessages = [],
  unreadCount = 0,
  soundEnabled = true,
}: FloatingChatProps) {
  const router = useRouter()
  const { connectionStatus, unreadMessages } = useRealtime()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedDossierId, setSelectedDossierId] = useState(dossiers[0]?.id || '')
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { playMessage, playClick, playSuccess } = useSoundNotifications(soundEnabled)

  // Listen for real-time message events
  useRealtimeEvent('message', useCallback((event) => {
    if (event.data?.dossierId === selectedDossierId && isOpen) {
      // Add the new message to the list
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === event.data.id)) return prev
        return [...prev, event.data]
      })
      playMessage()
    } else if (!isOpen) {
      // Show notification when chat is closed
      setHasNewMessage(true)
      playMessage()
      setTimeout(() => setHasNewMessage(false), 3000)
    }
  }, [selectedDossierId, isOpen, playMessage]))

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch messages when panel opens or dossier changes
  const fetchMessages = useCallback(async () => {
    if (!selectedDossierId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/messages?dossierId=${selectedDossierId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        // Mark as read
        await fetch(`/api/messages/mark-read?dossierId=${selectedDossierId}`, {
          method: 'POST',
        })
        setLocalUnreadCount(0)
      }
    } catch (error) {
      console.error('[Chat] Fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDossierId])

  useEffect(() => {
    if (isOpen && selectedDossierId) {
      fetchMessages()
    }
  }, [isOpen, selectedDossierId, fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Poll for new messages when open
  useEffect(() => {
    if (!isOpen || !selectedDossierId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/messages?dossierId=${selectedDossierId}&since=${messages[messages.length - 1]?.createdAt || ''}`)
        if (response.ok) {
          const data = await response.json()
          if (data.messages?.length > 0) {
            setMessages(prev => [...prev, ...data.messages])
            playMessage()
          }
        }
      } catch (error) {
        // Silent fail for polling
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isOpen, selectedDossierId, messages, playMessage])

  // Handle new message notification when closed
  useEffect(() => {
    if (!isOpen && unreadCount > localUnreadCount) {
      setLocalUnreadCount(unreadCount)
      setHasNewMessage(true)
      playMessage()
      setTimeout(() => setHasNewMessage(false), 2000)
    }
  }, [unreadCount, localUnreadCount, isOpen, playMessage])

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedDossierId || isSending) return

    playClick()
    setIsSending(true)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          dossierId: selectedDossierId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('[Chat] Send error:', error)
    } finally {
      setIsSending(false)
    }
  }

  const toggleOpen = () => {
    playClick()
    if (isMinimized) {
      setIsMinimized(false)
    } else {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setLocalUnreadCount(0)
        // Focus input when opening
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    playClick()
    setIsMinimized(!isMinimized)
  }

  const getMessageIcon = (message: Message) => {
    if (message.messageType === 'SYSTEM') {
      switch (message.category) {
        case 'STEP_VALIDATION':
          return <CheckCircle className="h-4 w-4 text-green-500" />
        case 'STEP_REJECTION':
          return <AlertCircle className="h-4 w-4 text-red-500" />
        default:
          return <Info className="h-4 w-4 text-blue-500" />
      }
    }
    if (message.messageType === 'ADMIN') {
      return <Bot className="h-4 w-4 text-purple-500" />
    }
    return null
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleOpen}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300',
          'flex items-center justify-center',
          'bg-primary-600 hover:bg-primary-700 text-white',
          hasNewMessage && 'animate-bounce',
          isOpen && 'scale-0 opacity-0'
        )}
      >
        <MessageSquare className="h-6 w-6" />
        {localUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {localUnreadCount > 9 ? '9+' : localUnreadCount}
          </span>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300',
          'flex flex-col bg-white border border-gray-200',
          isOpen && !isMinimized && 'h-[500px] max-h-[calc(100vh-3rem)] opacity-100 scale-100',
          isOpen && isMinimized && 'h-auto opacity-100 scale-100',
          !isOpen && 'h-0 opacity-0 scale-95 pointer-events-none'
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 bg-primary-600 text-white cursor-pointer"
          onClick={isMinimized ? toggleOpen : undefined}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
              <MessageSquare className="h-5 w-5" />
              {connectionStatus === 'connected' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-primary-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">Messages KOPRO</h3>
              <div className="flex items-center gap-2">
                <ConnectionStatus status={connectionStatus} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleMinimize}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title={isMinimized ? 'Agrandir' : 'Reduire'}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={toggleOpen}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content area - hidden when minimized */}
        {!isMinimized && (
          <>
            {/* Dossier selector */}
            {dossiers.length > 1 && (
              <div className="p-2 border-b bg-gray-50">
                <select
                  value={selectedDossierId}
                  onChange={(e) => setSelectedDossierId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {dossiers.map(dossier => (
                    <option key={dossier.id} value={dossier.id}>
                      Dossier {dossier.reference}
                    </option>
                  ))}
                </select>
              </div>
            )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="h-10 w-10 mb-2 text-gray-300" />
              <p className="text-sm">Aucun message</p>
              <p className="text-xs">Envoyez un message pour commencer</p>
            </div>
          ) : (
            messages.map(message => {
              const isClient = message.messageType === 'CLIENT'
              const isSystem = message.messageType === 'SYSTEM'

              if (isSystem) {
                return (
                  <div key={message.id} className="flex justify-center">
                    <div className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs',
                      message.category === 'STEP_VALIDATION' && 'bg-green-50 text-green-700',
                      message.category === 'STEP_REJECTION' && 'bg-red-50 text-red-700',
                      !message.category && 'bg-blue-50 text-blue-700'
                    )}>
                      {getMessageIcon(message)}
                      <span>{message.content}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    isClient ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2',
                      isClient
                        ? 'bg-primary-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    )}
                  >
                    {!isClient && (
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium text-purple-600">
                          {message.sender?.firstName || 'KOPRO'}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={cn(
                      'text-xs mt-1',
                      isClient ? 'text-primary-200' : 'text-gray-400'
                    )}>
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-white">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Votre message..."
              className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              disabled={isSending || !selectedDossierId}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending || !selectedDossierId}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                newMessage.trim() && !isSending
                  ? 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-105'
                  : 'bg-gray-200 text-gray-400'
              )}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
          </>
        )}
      </div>
    </>
  )
}
