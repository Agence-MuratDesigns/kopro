import { requireAuth } from '@/lib/auth'
import { Navbar } from '@/components/layout/navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <main className="container py-8">
        {children}
      </main>
    </div>
  )
}
