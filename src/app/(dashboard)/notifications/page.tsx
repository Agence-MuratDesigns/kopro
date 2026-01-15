import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  Info,
} from 'lucide-react'
import { MarkAllReadButton } from './mark-all-read-button'

const notificationIcons: Record<string, any> = {
  STEP_AVAILABLE: Info,
  STEP_VALIDATED: CheckCircle,
  STEP_BLOCKED: AlertCircle,
  DOCUMENT_REQUIRED: FileText,
  DOCUMENT_VALIDATED: CheckCircle,
  DOCUMENT_REJECTED: AlertCircle,
  MESSAGE_RECEIVED: MessageSquare,
  DOSSIER_UPDATE: Bell,
  PAYMENT_INFO: Info,
}

const notificationColors: Record<string, string> = {
  STEP_AVAILABLE: 'text-blue-500 bg-blue-50',
  STEP_VALIDATED: 'text-green-500 bg-green-50',
  STEP_BLOCKED: 'text-red-500 bg-red-50',
  DOCUMENT_REQUIRED: 'text-yellow-500 bg-yellow-50',
  DOCUMENT_VALIDATED: 'text-green-500 bg-green-50',
  DOCUMENT_REJECTED: 'text-red-500 bg-red-50',
  MESSAGE_RECEIVED: 'text-purple-500 bg-purple-50',
  DOSSIER_UPDATE: 'text-gray-500 bg-gray-50',
  PAYMENT_INFO: 'text-emerald-500 bg-emerald-50',
}

export default async function NotificationsPage() {
  const user = await requireAuth()

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: {
      dossier: {
        select: { reference: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Mark notifications as read
  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      isRead: false,
    },
    data: { isRead: true },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-kopro-dark">Notifications</h1>
          <p className="text-kopro-grey mt-2 text-lg">
            {unreadCount > 0
              ? `${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''} notification${unreadCount > 1 ? 's' : ''}`
              : 'Toutes les notifications sont lues'}
          </p>
        </div>
        {notifications.length > 0 && <MarkAllReadButton />}
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => {
                const Icon = notificationIcons[notification.type] || Bell
                const colorClass = notificationColors[notification.type] || 'text-gray-500 bg-gray-50'

                const content = (
                  <div
                    className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <Badge variant="info" className="shrink-0">Nouveau</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{formatDateTime(notification.createdAt)}</span>
                        {notification.dossier && (
                          <span>Dossier: {notification.dossier.reference}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )

                if (notification.link) {
                  return (
                    <Link key={notification.id} href={notification.link}>
                      {content}
                    </Link>
                  )
                }

                return <div key={notification.id}>{content}</div>
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
