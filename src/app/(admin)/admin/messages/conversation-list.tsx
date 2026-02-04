'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  Clock,
  Mail,
  MailOpen,
  User,
  ChevronDown
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { fr } from 'date-fns/locale/fr'

interface Dossier {
  id: string
  reference: string
  client: {
    firstName: string
    lastName: string
    email?: string
  } | null
  endClientFirstName?: string | null
  endClientLastName?: string | null
  artisan?: {
    companyName: string | null
  } | null
  messages: Array<{
    content: string
    createdAt: Date
    messageType: string
  }>
  _count: {
    messages: number
  }
  updatedAt: Date
}

interface ConversationListProps {
  dossiers: Dossier[]
  selectedDossierId?: string
}

type FilterType = 'all' | 'unread' | 'read'

export function ConversationList({ dossiers, selectedDossierId }: ConversationListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filtrer et trier les dossiers
  const filteredDossiers = useMemo(() => {
    let result = [...dossiers]

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(dossier => {
        const clientName = dossier.client
          ? `${dossier.client.firstName} ${dossier.client.lastName}`
          : dossier.endClientFirstName
            ? `${dossier.endClientFirstName} ${dossier.endClientLastName || ''}`
            : ''
        return (
          dossier.reference.toLowerCase().includes(query) ||
          clientName.toLowerCase().includes(query) ||
          dossier.client?.email?.toLowerCase().includes(query) ||
          dossier.artisan?.companyName?.toLowerCase().includes(query) ||
          dossier.messages[0]?.content.toLowerCase().includes(query)
        )
      })
    }

    // Filtre par type
    switch (filterType) {
      case 'unread':
        result = result.filter(d => d._count.messages > 0)
        break
      case 'read':
        result = result.filter(d => d._count.messages === 0)
        break
    }

    // Trier : non lus en premier, puis par date
    result.sort((a, b) => {
      if (a._count.messages > 0 && b._count.messages === 0) return -1
      if (a._count.messages === 0 && b._count.messages > 0) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return result
  }, [dossiers, searchQuery, filterType])

  const handleSelectDossier = (dossierId: string) => {
    router.push(`/admin/messages?dossier=${dossierId}`)
  }

  const totalUnread = dossiers.reduce((acc, d) => acc + d._count.messages, 0)

  const truncateMessage = (text: string, maxLength: number = 50) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header avec compteur */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Conversations</h2>
          </div>
          {totalUnread > 0 && (
            <Badge variant="error" className="animate-pulse-soft">
              {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom, référence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-9 text-sm bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-primary-100"
          />
        </div>

        {/* Boutons de filtre */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              showFilters || filterType !== 'all'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-3 w-3" />
            Filtres
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {filterType !== 'all' && (
            <button
              onClick={() => setFilterType('all')}
              className="text-xs text-primary-600 hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {/* Options de filtre */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filterType === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tous ({dossiers.length})
            </button>
            <button
              onClick={() => setFilterType('unread')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filterType === 'unread'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Non lus ({dossiers.filter(d => d._count.messages > 0).length})
            </button>
            <button
              onClick={() => setFilterType('read')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filterType === 'read'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Lus ({dossiers.filter(d => d._count.messages === 0).length})
            </button>
          </div>
        )}
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredDossiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Aucune conversation trouvée</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-primary-600 hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDossiers.map(dossier => {
              const isSelected = dossier.id === selectedDossierId
              const hasUnread = dossier._count.messages > 0
              const lastMessage = dossier.messages[0]

              return (
                <button
                  key={dossier.id}
                  onClick={() => handleSelectDossier(dossier.id)}
                  className={`w-full text-left px-4 py-3 transition-all hover:bg-gray-50 ${
                    isSelected
                      ? 'bg-primary-50 border-l-4 border-primary-600'
                      : hasUnread
                        ? 'bg-primary-50/30'
                        : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      hasUnread ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <User className={`h-5 w-5 ${hasUnread ? 'text-primary-600' : 'text-gray-400'}`} />
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-kopro-required rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {dossier.client
                            ? `${dossier.client.firstName} ${dossier.client.lastName}`
                            : dossier.endClientFirstName
                              ? `${dossier.endClientFirstName} ${dossier.endClientLastName || ''}`
                              : 'Client non renseigné'}
                        </span>
                        {hasUnread && (
                          <Badge variant="error" className="flex-shrink-0 text-xs px-1.5 py-0">
                            {dossier._count.messages}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 truncate">
                        {dossier.reference}
                      </p>

                      {/* Preview du dernier message */}
                      {lastMessage && (
                        <p className={`text-xs mt-1 truncate ${hasUnread ? 'text-gray-700' : 'text-gray-400'}`}>
                          {lastMessage.messageType === 'ADMIN' && (
                            <span className="text-primary-500">Vous : </span>
                          )}
                          {truncateMessage(lastMessage.content)}
                        </p>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <Clock className="h-3 w-3 text-gray-300" />
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(dossier.updatedAt), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer avec stats */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {filteredDossiers.length} conversation{filteredDossiers.length > 1 ? 's' : ''}
          {searchQuery && ` pour "${searchQuery}"`}
        </p>
      </div>
    </div>
  )
}
