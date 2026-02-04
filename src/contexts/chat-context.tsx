'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface ChatContextType {
  isOpen: boolean
  pendingDossierId: string | null
  pendingMessage: string | null
  openChat: (dossierId?: string, message?: string) => void
  closeChat: () => void
  toggleChat: () => void
  clearPending: () => void
}

const ChatContext = createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingDossierId, setPendingDossierId] = useState<string | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const openChat = useCallback((dossierId?: string, message?: string) => {
    if (dossierId) setPendingDossierId(dossierId)
    if (message) setPendingMessage(message)
    setIsOpen(true)
  }, [])
  const closeChat = useCallback(() => setIsOpen(false), [])
  const toggleChat = useCallback(() => setIsOpen(prev => !prev), [])
  const clearPending = useCallback(() => {
    setPendingDossierId(null)
    setPendingMessage(null)
  }, [])

  return (
    <ChatContext.Provider value={{ isOpen, pendingDossierId, pendingMessage, openChat, closeChat, toggleChat, clearPending }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
