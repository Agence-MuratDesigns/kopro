import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { MessageForm } from './message-form'
import { MessageSquare, User, Bot, CheckCircle, AlertCircle, Info } from 'lucide-react'

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

    // Mark messages as read (admin and system messages)
    await prisma.message.updateMany({
      where: {
        dossierId: selectedDossierId,
        isRead: false,
        messageType: { in: ['ADMIN', 'SYSTEM'] },
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
                    const isSystem = message.messageType === 'SYSTEM'
                    const isAdmin = message.messageType === 'ADMIN'

                    // System message - centered with special styling
                    if (isSystem) {
                      const getSystemIcon = () => {
                        switch (message.category) {
                          case 'STEP_VALIDATION':
                            return <CheckCircle className="h-4 w-4 text-green-500" />
                          case 'STEP_REJECTION':
                            return <AlertCircle className="h-4 w-4 text-red-500" />
                          default:
                            return <Info className="h-4 w-4 text-blue-500" />
                        }
                      }

                      const getSystemStyle = () => {
                        switch (message.category) {
                          case 'STEP_VALIDATION':
                            return 'bg-green-50 border-green-200 text-green-800'
                          case 'STEP_REJECTION':
                            return 'bg-red-50 border-red-200 text-red-800'
                          default:
                            return 'bg-blue-50 border-blue-200 text-blue-800'
                        }
                      }

                      return (
                        <div key={message.id} className="flex justify-center my-4">
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getSystemStyle()}`}>
                            {getSystemIcon()}
                            <span className="text-sm">{message.content}</span>
                            <span className="text-xs opacity-70">
                              {formatDateTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] ${
                            isFromUser
                              ? 'bg-primary-600 text-white rounded-l-lg rounded-tr-lg'
                              : isAdmin
                              ? 'bg-purple-100 text-gray-900 rounded-r-lg rounded-tl-lg border border-purple-200'
                              : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
                          } p-4`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${isFromUser ? 'text-primary-100' : 'text-gray-500'}`}>
                              {isFromUser
                                ? 'Vous'
                                : message.sender
                                ? `${message.sender.firstName} ${message.sender.lastName}`
                                : 'KOPRO'}
                            </span>
                            {!isFromUser && isAdmin && (
                              <Badge variant="secondary" className="text-xs py-0 bg-purple-200 text-purple-800">
                                Conseiller KOPRO
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
