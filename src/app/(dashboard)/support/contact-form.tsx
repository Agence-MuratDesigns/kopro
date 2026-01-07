'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Loader2, Send } from 'lucide-react'

interface ContactFormProps {
  dossierId?: string
}

const subjects = [
  { value: 'GENERAL', label: 'Question générale' },
  { value: 'DOSSIER', label: 'Mon dossier en cours' },
  { value: 'DOCUMENTS', label: 'Documents à fournir' },
  { value: 'AIDES', label: 'Aides financières' },
  { value: 'TRAVAUX', label: 'Travaux et artisans' },
  { value: 'TECHNIQUE', label: 'Problème technique' },
  { value: 'OTHER', label: 'Autre' },
]

export function ContactForm({ dossierId }: ContactFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.subject) {
      setError('Veuillez sélectionner un sujet')
      return
    }

    if (!formData.message.trim() || formData.message.length < 10) {
      setError('Votre message doit contenir au moins 10 caractères')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dossierId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'envoi')
        return
      }

      setSuccess(true)
      setFormData({ subject: '', message: '' })
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert variant="success" title="Message envoyé !">
        <p>
          Votre message a bien été envoyé. Notre équipe vous répondra dans les plus brefs délais.
          Vous pouvez également suivre la conversation dans l'onglet Messages.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setSuccess(false)}
        >
          Envoyer un autre message
        </Button>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
      )}

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Sujet *
        </label>
        <select
          id="subject"
          value={formData.subject}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, subject: e.target.value }))
            setError('')
          }}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Sélectionnez un sujet</option>
          {subjects.map((subject) => (
            <option key={subject.value} value={subject.value}>
              {subject.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message *
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, message: e.target.value }))
            setError('')
          }}
          placeholder="Décrivez votre question ou problème en détail..."
          disabled={isLoading}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.message.length} caractères (minimum 10)
        </p>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <p>
          Votre message sera également visible dans votre espace Messages pour faciliter le suivi de la conversation.
        </p>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Envoyer le message
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
