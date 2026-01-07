import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardProviders } from '@/components/providers/dashboard-providers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  // Get user's dossiers (for chat)
  const dossiers = await prisma.dossier.findMany({
    where: { clientId: user.id },
    select: { id: true, reference: true },
    orderBy: { createdAt: 'desc' },
  })

  const dossier = dossiers[0] || null

  // Get user preferences
  const userPrefs = await prisma.user.findUnique({
    where: { id: user.id },
    select: { soundEnabled: true },
  })

  // Get unread counts
  const [unreadNotifications, unreadMessages] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
    prisma.message.count({
      where: {
        dossier: { clientId: user.id },
        isRead: false,
        messageType: { in: ['ADMIN', 'SYSTEM'] },
      },
    }),
  ])

  return (
    <DashboardProviders
      userId={user.id}
      dossiers={dossiers}
      unreadMessages={unreadMessages}
      soundEnabled={userPrefs?.soundEnabled ?? true}
    >
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          user={user}
          dossier={dossier}
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
        />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </DashboardProviders>
  )
}
