export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const dossierId = searchParams.get('dossierId')

    if (!dossierId) {
      return NextResponse.json({ error: 'dossierId requis' }, { status: 400 })
    }

    // Verify user owns this dossier
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, clientId: user.id },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Mark all non-client messages as read
    await prisma.message.updateMany({
      where: {
        dossierId,
        isRead: false,
        messageType: { in: ['ADMIN', 'SYSTEM'] },
      },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Mark Read] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
