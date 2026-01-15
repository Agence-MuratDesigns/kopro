import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

interface Context {
  params: Promise<{ id: string; docId: string }>
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id, docId } = await context.params

    // Verify dossier ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id },
    })

    if (!dossier || dossier.clientId !== session.userId) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check if quotes can be modified
    if (dossier.quotesStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Les devis ont déjà été validés et ne peuvent pas être modifiés' },
        { status: 400 }
      )
    }

    if (dossier.quotesStatus === 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Les devis sont en cours de validation et ne peuvent pas être modifiés' },
        { status: 400 }
      )
    }

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id: docId },
    })

    if (!document || document.dossierId !== id) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    // Check document type
    if (document.type !== 'DEVIS') {
      return NextResponse.json(
        { error: 'Ce document n\'est pas un devis' },
        { status: 400 }
      )
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), document.filePath)
      await unlink(filePath)
    } catch {
      // File might not exist, continue anyway
      console.warn(`Could not delete file: ${document.filePath}`)
    }

    // Delete document record
    await prisma.document.delete({
      where: { id: docId },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        dossierId: id,
        userId: session.userId,
        action: 'DOCUMENT_REMOVED',
        details: `Devis supprimé: ${document.name}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Quote delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
