import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { MessageForm } from './message-form'
import { MessageSquare, User } from 'lucide-react'

interface Props {
  searchParams: Promise<{ dossier?: string }>
}

export default async function MessagesPage({ searchParams }: Props) {
  const params = await searchParams
  const user = await requireAuth()

  // Get client's dossiers
  const dossiers = await prisma.dossier.findMany({
    where: { clientId: user.id },
    select: { id: true, reference: true },
  })

  const selectedDossierId = params.dossier || dossiers[0]?.id

  let messages: any[] = []
  let selectedDossier = null

  if (selectedDossierId) {
    selectedDossier = dossiers.find(d => d.id === selectedDossierId)

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

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        dossierId: selectedDossierId,
        isRead: false,
        isFromClient: false,
      },
      data: { isRead: true },
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-1">
          Échangez avec votre conseiller KOPRO
        </p>
      </div>

      {dossiers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              Créez un dossier pour commencer à échanger avec votre conseiller.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-4 gap-6">
          {/* Dossiers List */}
          {dossiers.length > 1 && (
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Dossiers</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {dossiers.map(dossier => (
                      <a
                        key={dossier.id}
                        href={`/messages?dossier=${dossier.id}`}
                        className={`block px-4 py-3 hover:bg-gray-50 ${
                          dossier.id === selectedDossierId ? 'bg-primary-50' : ''
                        }`}
                      >
                        <p className="font-medium text-sm">{dossier.reference}</p>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages */}
          <div className={dossiers.length > 1 ? 'md:col-span-3' : 'md:col-span-4'}>
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {selectedDossier ? `Dossier ${selectedDossier.reference}` : 'Messages'}
                </CardTitle>
              </CardHeader>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun message pour le moment</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Envoyez un message à votre conseiller
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map(message => {
                    const isFromUser = message.senderId === user.id

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] ${
                            isFromUser
                              ? 'bg-primary-600 text-white rounded-l-lg rounded-tr-lg'
                              : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
                          } p-4`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${isFromUser ? 'text-primary-100' : 'text-gray-500'}`}>
                              {isFromUser
                                ? 'Vous'
                                : `${message.sender.firstName} ${message.sender.lastName}`}
                            </span>
                            {!isFromUser && message.sender.role !== 'CLIENT' && (
                              <Badge variant="info" className="text-xs py-0">
                                KOPRO
                              </Badge>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              isFromUser ? 'text-primary-200' : 'text-gray-400'
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
                  <MessageForm dossierId={selectedDossierId} />
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
