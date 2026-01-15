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
    const body = await request.json()

    if (!body.reason) {
      return NextResponse.json({ error: 'Raison requise' }, { status: 400 })
    }

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
        status: 'REJECTED',
        rejectionReason: body.reason,
      },
    })

    // Notify client
    await prisma.notification.create({
      data: {
        userId: document.dossier.clientId,
        dossierId: id,
        type: 'DOCUMENT_REJECTED',
        title: 'Document refusé',
        message: `Votre document "${document.name}" a été refusé : ${body.reason}`,
        link: `/dossier/${id}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reject document error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
