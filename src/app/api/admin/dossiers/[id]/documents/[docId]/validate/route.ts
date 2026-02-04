export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string; docId: string }>
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session || !['ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id, docId } = await context.params

    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: { dossier: true },
    })

    if (!document || document.dossierId !== id) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    await prisma.document.update({
      where: { id: docId },
      data: {
        status: 'VALIDATED',
        validatedAt: new Date(),
      },
    })

    // Notify client or artisan
    const notifyUserId = document.dossier.clientId || document.dossier.artisanId
    if (notifyUserId) {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          dossierId: id,
          type: 'DOCUMENT_VALIDATED',
          title: 'Document validé',
          message: `Le document "${document.name}" a été validé.`,
          link: `/dossier/${id}`,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Validate document error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
