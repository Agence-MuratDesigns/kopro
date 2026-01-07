import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  // Get user's dossier
  const dossier = await prisma.dossier.findFirst({
    where: { clientId: user.id },
    select: { id: true, reference: true },
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
        isFromClient: false,
      },
    }),
  ])

  return (
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
  )
}
