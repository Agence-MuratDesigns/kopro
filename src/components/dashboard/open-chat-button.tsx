'use client'

import { Button } from '@/components/ui/button'
import { useChat } from '@/contexts/chat-context'
import { MessageSquare } from 'lucide-react'

export function OpenChatButton() {
  const { toggleChat } = useChat()

  return (
    <Button variant="outline" size="sm" className="w-full" onClick={toggleChat}>
      <MessageSquare className="h-4 w-4 mr-2" />
      Envoyer un message
    </Button>
  )
}
