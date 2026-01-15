import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DossiersListPage() {
  const user = await requireAuth()

  // Get the client's dossier (single dossier per client)
  const dossier = await prisma.dossier.findFirst({
    where: { clientId: user.id },
  })

  // Redirect to dashboard if no dossier or to the dossier details
  if (!dossier) {
    redirect('/dashboard')
  }

  redirect(`/dossier/${dossier.id}`)
}
