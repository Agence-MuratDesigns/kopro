'use client'

import { useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Bot,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { format } from 'date-fns/format'
import { isToday } from 'date-fns/isToday'
import { isYesterday } from 'date-fns/isYesterday'
import { fr } from 'date-fns/locale/fr'

interface Message {
  id: string
  content: string
  messageType: string
  category?: string | null
  createdAt: Date | string
  sender?: {
    id: string
    firstName: string
    lastName: string
    role: string
  } | null
}

interface MessageThreadProps {
  messages: Message[]
  autoScroll?: boolean
}

// Icônes et couleurs pour les messages système
const systemMessageConfig: Record<string, { icon: React.ElementType; bgColor: string; textColor: string }> = {
  STEP_VALIDATION: { icon: CheckCircle2, bgColor: 'bg-green-50', textColor: 'text-green-700' },
  STEP_REJECTION: { icon: XCircle, bgColor: 'bg-red-50', textColor: 'text-red-700' },
  WARNING: { icon: AlertTriangle, bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  INFO: { icon: Info, bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
}

function formatMessageDate(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return "Aujourd'hui"
  if (isYesterday(d)) return 'Hier'
  return format(d, 'EEEE d MMMM', { locale: fr })
}

function formatMessageTime(date: Date | string): string {
  return format(new Date(date), 'HH:mm', { locale: fr })
}

export function MessageThread({ messages, autoScroll = true }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll au dernier message
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll])

  // Grouper les messages par date
  const groupedMessages = messages.reduce((groups, message) => {
    const dateKey = formatMessageDate(message.createdAt)
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(message)
    return groups
  }, {} as Record<string, Message[]>)

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-1">Aucun message</h3>
          <p className="text-sm text-gray-400">
            Commencez la conversation en envoyant un message au client
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {Object.entries(groupedMessages).map(([dateLabel, dayMessages]) => (
        <div key={dateLabel}>
          {/* Séparateur de date */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex-1 border-t border-gray-100" />
            <span className="px-3 text-xs font-medium text-gray-400 bg-white">
              {dateLabel}
            </span>
            <div className="flex-1 border-t border-gray-100" />
          </div>

          {/* Messages du jour */}
          <div className="space-y-3">
            {dayMessages.map((message, index) => {
              const isFromClient = message.messageType === 'CLIENT'
              const isSystem = message.messageType === 'SYSTEM'
              const isFromAdmin = message.messageType === 'ADMIN'

              // Message système
              if (isSystem) {
                const config = systemMessageConfig[message.category || 'INFO'] || systemMessageConfig.INFO
                const Icon = config.icon

                return (
                  <div key={message.id} className="flex justify-center animate-fade-in">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.textColor}`} />
                      <span className={`text-sm font-medium ${config.textColor}`}>
                        {message.content}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              }

              // Message client ou admin
              return (
                <div
                  key={message.id}
                  className={`flex ${isFromClient ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${isFromClient ? '' : 'flex-row-reverse'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isFromClient
                        ? 'bg-gray-100'
                        : 'bg-gradient-to-br from-primary-500 to-primary-600'
                    }`}>
                      {isFromClient ? (
                        <User className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>

                    {/* Bulle de message */}
                    <div
                      className={`group relative ${
                        isFromClient
                          ? 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-md'
                          : 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl rounded-tr-md'
                      } px-4 py-3 shadow-sm`}
                    >
                      {/* Header du message */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${
                          isFromClient ? 'text-gray-500' : 'text-primary-100'
                        }`}>
                          {message.sender
                            ? `${message.sender.firstName} ${message.sender.lastName}`
                            : isFromAdmin
                              ? 'Admin'
                              : 'Client'
                          }
                        </span>
                        {isFromClient && (
                          <Badge variant="default" className="text-xs py-0 px-1.5">
                            Client
                          </Badge>
                        )}
                      </div>

                      {/* Contenu */}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </p>

                      {/* Heure */}
                      <p className={`text-xs mt-2 ${
                        isFromClient ? 'text-gray-400' : 'text-primary-200'
                      }`}>
                        {formatMessageTime(message.createdAt)}
                      </p>

                      {/* Indicateur de lecture (pour messages admin) */}
                      {isFromAdmin && (
                        <div className="absolute -bottom-1 -right-1 flex">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary-300" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
