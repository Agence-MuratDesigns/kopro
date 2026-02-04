import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { unlink } from 'fs/promises'
import path from 'path'

interface RouteParams {
  params: Promise<{ id: string; docId: string }>
}

// DELETE - Supprimer un document projet
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId, docId } = await params
    const user = await requireAuth()

    // Get document and verify ownership
    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        dossier: {
          include: {
            steps: {
              include: { template: true },
            },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    if (document.dossierId !== dossierId) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    // Check access: client owns the dossier OR artisan manages it
    const isOwner = document.dossier.clientId === user.id
    const isArtisanManager = user.role === 'ARTISAN' && document.dossier.artisanId === user.id
    if (!isOwner && !isArtisanManager) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Find PROJECT_INFO step
    const projectInfoStep = document.dossier.steps.find(s => s.template.code === 'PROJECT_INFO')

    // Check if document belongs to PROJECT_INFO step
    if (document.stepId !== projectInfoStep?.id) {
      return NextResponse.json(
        { error: 'Ce document ne peut pas être supprimé ici' },
        { status: 400 }
      )
    }

    // Check if step is available
    if (projectInfoStep.status === 'LOCKED' || projectInfoStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas modifiable' },
        { status: 400 }
      )
    }

    // Try to delete the file
    try {
      const filePath = path.join(process.cwd(), 'public', document.filePath)
      await unlink(filePath)
    } catch {
      // File might not exist, continue anyway
      console.warn('Could not delete file:', document.filePath)
    }

    // Delete document record
    await prisma.document.delete({ where: { id: docId } })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        dossierId,
        action: 'DOCUMENT_DELETE',
        details: `Document supprimé: ${document.name}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}
