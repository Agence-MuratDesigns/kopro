'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Send, Loader2, Smile, Paperclip, X } from 'lucide-react'

interface AdminMessageFormProps {
  dossierId: string
  clientName?: string
}

// Réponses rapides prédéfinies
const quickReplies = [
  { label: 'Merci', text: 'Merci pour votre message. Je reviens vers vous rapidement.' },
  { label: 'Document reçu', text: 'Bien reçu, votre document est en cours de vérification.' },
  { label: 'En attente', text: 'Votre dossier est en cours de traitement, nous vous tiendrons informé.' },
  { label: 'Validé', text: 'Parfait ! Tout est en ordre, vous pouvez passer à l\'étape suivante.' },
]

export function AdminMessageForm({ dossierId, clientName }: AdminMessageFormProps) {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  // Auto-resize du textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/dossiers/${dossierId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Erreur lors de l\'envoi')
        return
      }

      setContent('')
      router.refresh()
    } catch {
      alert('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickReply = (text: string) => {
    setContent(text)
    setShowQuickReplies(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Envoi avec Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (content.trim()) {
        handleSubmit(e)
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Réponses rapides */}
      {showQuickReplies && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Réponses rapides</span>
            <button
              onClick={() => setShowQuickReplies(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply.text)}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-primary-50 hover:text-primary-700 transition-colors"
              >
                {reply.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-end gap-2 p-2 rounded-2xl border-2 transition-colors ${
          isFocused ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200 bg-gray-50'
        }`}>
          {/* Boutons à gauche */}
          <div className="flex items-center gap-1 pb-1">
            <button
              type="button"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className={`p-2 rounded-lg transition-colors ${
                showQuickReplies
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Réponses rapides"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={clientName ? `Répondre à ${clientName}...` : 'Écrire un message...'}
              className="w-full resize-none bg-transparent px-2 py-2 text-sm focus:outline-none placeholder:text-gray-400"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
          </div>

          {/* Bouton envoi */}
          <Button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="rounded-xl px-4 gap-2 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Envoyer</span>
              </>
            )}
          </Button>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">Entrée</kbd> pour envoyer
        </p>
      </form>
    </div>
  )
}
