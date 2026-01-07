import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { AdminMessageForm } from './admin-message-form'
import { MessageSquare, User } from 'lucide-react'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ dossier?: string }>
}

export default async function AdminMessagesPage({ searchParams }: Props) {
  const params = await searchParams
  const user = await requireRole(['ADMIN', 'ADVISOR'])

  // Get dossiers with unread messages
  const dossiers = await prisma.dossier.findMany({
    include: {
      client: {
        select: { firstName: true, lastName: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          messages: {
            where: { isRead: false, isFromClient: true },
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
        isFromClient: true,
      },
      data: { isRead: true },
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">
          Gérez les conversations avec vos clients
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 h-[calc(100vh-250px)]">
        {/* Dossiers List */}
        <div className="md:col-span-1">
          <Card className="h-full overflow-hidden">
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm">Dossiers</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto h-[calc(100%-60px)]">
              <div className="divide-y">
                {dossiers.map(dossier => (
                  <Link
                    key={dossier.id}
                    href={`/admin/messages?dossier=${dossier.id}`}
                    className={`block px-4 py-3 hover:bg-gray-50 ${
                      dossier.id === selectedDossierId ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{dossier.reference}</p>
                        <p className="text-xs text-gray-500">
                          {dossier.client.firstName} {dossier.client.lastName}
                        </p>
                      </div>
                      {dossier._count.messages > 0 && (
                        <Badge variant="error" className="text-xs">
                          {dossier._count.messages}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <div className="md:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                {selectedDossier
                  ? `${selectedDossier.reference} - ${selectedDossier.client.firstName} ${selectedDossier.client.lastName}`
                  : 'Messages'}
              </CardTitle>
            </CardHeader>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun message</p>
                  </div>
                </div>
              ) : (
                messages.map(message => {
                  const isFromClient = message.isFromClient

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromClient ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          isFromClient
                            ? 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
                            : 'bg-primary-600 text-white rounded-l-lg rounded-tr-lg'
                        } p-4`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${isFromClient ? 'text-gray-500' : 'text-primary-100'}`}>
                            {message.sender.firstName} {message.sender.lastName}
                          </span>
                          {isFromClient && (
                            <Badge variant="default" className="text-xs py-0">
                              Client
                            </Badge>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            isFromClient ? 'text-gray-400' : 'text-primary-200'
                          }`}
                        >
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message Form */}
            {selectedDossierId && (
              <div className="border-t p-4">
                <AdminMessageForm dossierId={selectedDossierId} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
