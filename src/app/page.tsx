import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function HomePage() {
  const session = await getSession()

  if (session) {
    // Redirect based on role
    if (session.role === 'ADMIN') {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  }

  // Not logged in, redirect to login
  redirect('/login')
}
