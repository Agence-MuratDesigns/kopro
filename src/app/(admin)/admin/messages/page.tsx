import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminMessageForm } from './admin-message-form'
import { ConversationList } from './conversation-list'
import { ConversationHeader } from './conversation-header'
import { MessageThread } from './message-thread'
import { MessageSquare, Inbox } from 'lucide-react'

interface Props {
  searchParams: Promise<{ dossier?: string }>
}

export default async function AdminMessagesPage({ searchParams }: Props) {
  const params = await searchParams
  const user = await requireRole(['ADMIN'])

  // Get dossiers with unread messages and last message
  const dossiers = await prisma.dossier.findMany({
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      artisan: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          companyName: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          messageType: true,
        }
      },
      _count: {
        select: {
          messages: {
            where: { isRead: false, messageType: 'CLIENT' },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const selectedDossierId = params.dossier || dossiers[0]?.id
  const selectedDossier = dossiers.find(d => d.id === selectedDossierId)

  let messages: any[] = []

  if (selectedDossierId) {
    messages = await prisma.message.findMany({
      where: { dossierId: selectedDossierId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Mark as read
    await prisma.message.updateMany({
      where: {
        dossierId: selectedDossierId,
        isRead: false,
        messageType: 'CLIENT',
      },
      data: { isRead: true },
    })
  }

  // Stats pour l'en-tête
  const totalUnread = dossiers.reduce((acc, d) => acc + d._count.messages, 0)
  const totalConversations = dossiers.filter(d => d.messages.length > 0).length

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in">
      {/* Header de la page */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary-600" />
              Messages
            </h1>
            <p className="text-gray-500 mt-0.5">
              Gérez vos conversations avec les clients
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Conversations actives</p>
              <p className="text-xl font-bold text-gray-900">{totalConversations}</p>
            </div>
            {totalUnread > 0 && (
              <div className="px-4 py-2 bg-kopro-required/10 rounded-xl">
                <p className="text-sm text-kopro-required font-medium">
                  {totalUnread} message{totalUnread > 1 ? 's' : ''} non lu{totalUnread > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex-1 grid md:grid-cols-12 gap-4 min-h-0">
        {/* Liste des conversations (sidebar gauche) */}
        <div className="md:col-span-4 lg:col-span-3 min-h-0">
          <ConversationList
            dossiers={dossiers}
            selectedDossierId={selectedDossierId}
          />
        </div>

        {/* Zone de conversation principale */}
        <div className="md:col-span-8 lg:col-span-9 min-h-0">
          {selectedDossier ? (
            <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header de la conversation */}
              <ConversationHeader
                dossier={selectedDossier}
                messageCount={messages.length}
              />

              {/* Thread des messages */}
              <MessageThread messages={messages} />

              {/* Formulaire de réponse */}
              <div className="flex-shrink-0 border-t border-gray-100 p-4 bg-white">
                <AdminMessageForm
                  dossierId={selectedDossierId}
                  clientName={selectedDossier.client
                    ? `${selectedDossier.client.firstName} ${selectedDossier.client.lastName}`
                    : selectedDossier.endClientFirstName
                      ? `${selectedDossier.endClientFirstName} ${selectedDossier.endClientLastName || ''}`
                      : selectedDossier.artisan?.companyName || 'Client'
                  }
                />
              </div>
            </div>
          ) : (
            /* État vide - pas de dossier sélectionné */
            <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-gray-100">
              <div className="text-center p-8">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Inbox className="h-10 w-10 text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Aucune conversation
                </h2>
                <p className="text-gray-500 max-w-sm">
                  Sélectionnez une conversation dans la liste pour afficher les messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
