import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE /api/dossiers/[id] - Supprimer un dossier
// Le dossier ne peut être supprimé que si le mandat n'est pas encore validé
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await params

    // Récupérer le dossier avec ses étapes
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        steps: {
          include: {
            template: true,
          },
        },
        documents: true,
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est le propriétaire du dossier
    const isOwner = dossier.clientId === user.id || dossier.artisanId === user.id
    const isAdmin = user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier que le mandat n'est pas encore validé
    // Le dossier peut être supprimé tant que mandatStatus !== 'APPROVED'
    if (dossier.mandatStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un dossier dont le mandat a été validé' },
        { status: 400 }
      )
    }

    // Vérifier aussi l'étape MANDATE_SIGNATURE n'est pas validée
    const mandateStep = dossier.steps.find(s => s.template.code === 'MANDATE_SIGNATURE')
    if (mandateStep && mandateStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un dossier dont le mandat a été validé' },
        { status: 400 }
      )
    }

    // Supprimer les fichiers physiques des documents
    for (const doc of dossier.documents) {
      try {
        const filePath = path.join(process.cwd(), 'public', doc.filePath)
        await fs.unlink(filePath)
      } catch (err) {
        // Ignorer les erreurs si le fichier n'existe pas
        console.warn(`Impossible de supprimer le fichier: ${doc.filePath}`, err)
      }
    }

    // Supprimer le dossier d'upload s'il existe
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', id)
      await fs.rm(uploadDir, { recursive: true, force: true })
    } catch (err) {
      // Ignorer si le dossier n'existe pas
      console.warn(`Impossible de supprimer le dossier d'uploads`, err)
    }

    // Supprimer le dossier (la cascade supprime documents, steps, messages, notifications, activity logs)
    await prisma.dossier.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Dossier supprimé avec succès' })
  } catch (error) {
    console.error('Error deleting dossier:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du dossier' },
      { status: 500 }
    )
  }
}
