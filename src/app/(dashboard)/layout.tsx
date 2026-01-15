import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { DashboardProviders } from '@/components/providers/dashboard-providers'
import { UserAvatarProvider } from '@/contexts/user-avatar-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  // Get user's dossiers with steps (for chat and action required check)
  const dossiers = await prisma.dossier.findMany({
    where: { clientId: user.id },
    select: {
      id: true,
      reference: true,
      steps: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const dossier = dossiers[0] || null

  // Check if any action is required (AVAILABLE, IN_PROGRESS, or BLOCKED status)
  const hasActionRequired = dossier?.steps.some(
    step => step.status === 'AVAILABLE' || step.status === 'IN_PROGRESS' || step.status === 'BLOCKED'
  ) ?? false

  // Get user preferences and avatar
  const userPrefs = await prisma.user.findUnique({
    where: { id: user.id },
    select: { soundEnabled: true, avatarUrl: true },
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
    <UserAvatarProvider initialAvatarUrl={userPrefs?.avatarUrl ?? null}>
      <DashboardProviders
        userId={user.id}
        dossiers={dossiers}
        unreadMessages={unreadMessages}
        soundEnabled={userPrefs?.soundEnabled ?? true}
      >
        <div className="min-h-screen flex relative">
          {/* App gradient background with logo watermark */}
          <div className="app-gradient-background">
            <img
              src="/logo.svg"
              alt=""
              className="app-logo-background"
            />
          </div>

          <Sidebar
            user={user}
            dossier={dossier}
            unreadNotifications={unreadNotifications}
            unreadMessages={unreadMessages}
            hasActionRequired={hasActionRequired}
          />
          <TopBar initialNotificationCount={unreadNotifications} />
          <main className="flex-1 p-6 lg:p-8 overflow-auto relative z-10">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </DashboardProviders>
    </UserAvatarProvider>
  )
}
