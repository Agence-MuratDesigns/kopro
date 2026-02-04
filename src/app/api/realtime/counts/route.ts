export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const [notifications, messages] = await Promise.all([
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

    return NextResponse.json({ notifications, messages })
  } catch (error) {
    console.error('[Counts] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
