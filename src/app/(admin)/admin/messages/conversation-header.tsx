'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  User,
  ExternalLink,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  MailOpen,
  Archive,
  Trash2,
  X
} from 'lucide-react'
import Link from 'next/link'

interface ConversationHeaderProps {
  dossier: {
    id: string
    reference: string
    currentStep: number
    status: string
    client: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone?: string | null
      address?: string | null
    } | null
    artisan?: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone?: string | null
      companyName: string | null
    } | null
    endClientFirstName?: string | null
    endClientLastName?: string | null
    endClientEmail?: string | null
    endClientPhone?: string | null
    _count?: {
      messages: number
    }
  }
  messageCount: number
  onMarkAsUnread?: () => void
}

const stepLabels: Record<number, string> = {
  1: 'Création compte',
  2: 'Identifiant MPR',
  3: 'Signature mandat',
  4: 'Sélection travaux',
  5: 'Dépôt devis',
  6: 'Démarrage travaux',
  7: 'Dépôt factures',
  8: 'Récapitulatif final'
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING_VALIDATION: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700'
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  IN_PROGRESS: 'En cours',
  PENDING_VALIDATION: 'En attente',
  COMPLETED: 'Terminé'
}

export function ConversationHeader({ dossier, messageCount, onMarkAsUnread }: ConversationHeaderProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showClientInfo, setShowClientInfo] = useState(false)

  // Déterminer le nom et l'email à afficher (client avec compte, ou client final pour artisan)
  const displayName = dossier.client
    ? `${dossier.client.firstName} ${dossier.client.lastName}`
    : dossier.endClientFirstName
      ? `${dossier.endClientFirstName} ${dossier.endClientLastName || ''}`
      : 'Client non renseigné'

  const displayEmail = dossier.client?.email || dossier.artisan?.email || dossier.endClientEmail
  const displayPhone = dossier.client?.phone || dossier.artisan?.phone || dossier.endClientPhone
  const isArtisanManaged = !!dossier.artisan

  const handleMarkAsUnread = async () => {
    // Ici on pourrait appeler une API pour marquer comme non lu
    if (onMarkAsUnread) {
      onMarkAsUnread()
    }
    setShowMenu(false)
  }

  return (
    <div className="border-b border-gray-100 bg-white">
      {/* Header principal */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            {/* Indicateur en ligne (fictif pour l'instant) */}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-kopro-success rounded-full border-2 border-white" />
          </div>

          {/* Infos client */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">
                {displayName}
              </h2>
              <button
                onClick={() => setShowClientInfo(!showClientInfo)}
                className="text-gray-400 hover:text-primary-600 transition-colors"
                title="Voir plus d'infos"
              >
                <User className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{dossier.reference}</span>
              <span className="text-gray-300">•</span>
              <Badge className={`text-xs py-0 ${statusColors[dossier.status] || 'bg-gray-100'}`}>
                {statusLabels[dossier.status] || dossier.status}
              </Badge>
              {isArtisanManaged && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-accent">Artisan: {dossier.artisan?.companyName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Étape actuelle */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 rounded-full">
            <Clock className="h-3.5 w-3.5 text-primary-600" />
            <span className="text-xs font-medium text-primary-700">
              Étape {dossier.currentStep}: {stepLabels[dossier.currentStep]}
            </span>
          </div>

          {/* Lien vers le dossier */}
          <Link href={`/admin/dossiers/${dossier.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Voir dossier</span>
            </Button>
          </Link>

          {/* Menu actions */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 animate-scale-in">
                  <button
                    onClick={handleMarkAsUnread}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <MailOpen className="h-4 w-4" />
                    Marquer comme non lu
                  </button>
                  {displayEmail && (
                    <Link
                      href={`mailto:${displayEmail}`}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Mail className="h-4 w-4" />
                      Envoyer un email
                    </Link>
                  )}
                  <hr className="my-1 border-gray-100" />
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    <Archive className="h-4 w-4" />
                    Archiver (bientôt)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Panneau d'informations client (dépliable) */}
      {showClientInfo && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              {isArtisanManaged ? 'Informations contact' : 'Informations client'}
            </h3>
            <button
              onClick={() => setShowClientInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {displayEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${displayEmail}`}
                  className="text-primary-600 hover:underline truncate"
                >
                  {displayEmail}
                </a>
              </div>
            )}
            {displayPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${displayPhone}`}
                  className="text-gray-600 hover:text-primary-600"
                >
                  {displayPhone}
                </a>
              </div>
            )}
            {dossier.client?.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 truncate">{dossier.client.address}</span>
              </div>
            )}
          </div>

          {/* Stats de la conversation */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{messageCount} message{messageCount > 1 ? 's' : ''} échangé{messageCount > 1 ? 's' : ''}</span>
            </div>
            <Link
              href={`/admin/dossiers/${dossier.id}`}
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ouvrir le dossier complet
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
