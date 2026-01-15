import { requireRole } from '@/lib/auth'
import { Navbar } from '@/components/layout/navbar'
import { AdminRealtimeProvider } from '@/components/providers/admin-realtime-provider'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole(['ADMIN'])

  return (
    <AdminRealtimeProvider userId={user.id}>
      <div className="min-h-screen relative">
        {/* App gradient background with logo watermark */}
        <div className="app-gradient-background">
          <img
            src="/logo.svg"
            alt=""
            className="app-logo-background"
          />
        </div>

        <Navbar user={user} />
        <main className="container py-8 relative z-10">
          {children}
        </main>
      </div>
    </AdminRealtimeProvider>
  )
}
