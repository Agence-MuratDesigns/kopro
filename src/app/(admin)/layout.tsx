import { requireRole } from '@/lib/auth'
import { Navbar } from '@/components/layout/navbar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole(['ADMIN', 'ADVISOR'])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <main className="container py-8">
        {children}
      </main>
    </div>
  )
}
