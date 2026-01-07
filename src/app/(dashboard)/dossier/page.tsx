import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function DossierIndexPage() {
  const user = await requireAuth()

  // Get first dossier
  const dossier = await prisma.dossier.findFirst({
    where: { clientId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  if (dossier) {
    redirect(`/dossier/${dossier.id}`)
  } else {
    redirect('/dossier/nouveau')
  }
}
