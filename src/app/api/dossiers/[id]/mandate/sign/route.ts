import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { notifyAdminsOfClientAction } from '@/lib/realtime'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()

    // Get dossier and verify ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        client: true,
        steps: {
          include: { template: true },
          orderBy: { template: { order: 'asc' } },
        },
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    if (dossier.clientId !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Find the mandate step
    const mandateStep = dossier.steps.find(s => s.template.code === 'MANDATE_SIGNATURE')
    if (!mandateStep) {
      return NextResponse.json(
        { error: 'Étape de signature du mandat non trouvée' },
        { status: 400 }
      )
    }

    // Check if step is available
    if (mandateStep.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas encore accessible' },
        { status: 400 }
      )
    }

    if (mandateStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Cette étape est déjà validée' },
        { status: 400 }
      )
    }

    // Only accept multipart/form-data for manual upload
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Seul l\'upload de fichier PDF est accepté' },
        { status: 400 }
      )
    }

    // Manual upload
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Seuls les fichiers PDF sont acceptés' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 10 Mo' },
        { status: 400 }
      )
    }

    // Save file
    const uploadsDir = path.join(process.cwd(), 'uploads', 'mandates')
    await mkdir(uploadsDir, { recursive: true })

    const fileName = `mandate_${dossierId}_${Date.now()}.pdf`
    const filePath = path.join(uploadsDir, fileName)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document record
    await prisma.document.create({
      data: {
        name: `Mandat signé - ${dossier.client.firstName} ${dossier.client.lastName}`,
        type: 'MANDAT',
        fileName: fileName,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.type,
        status: 'PENDING',
        uploaderId: user.id,
        dossierId: dossierId,
        stepId: mandateStep.id,
      },
    })

    await prisma.$transaction(async (tx) => {
      // Update dossier
      await tx.dossier.update({
        where: { id: dossierId },
        data: {
          mandatStatus: 'PENDING_REVIEW',
          mandatSignedAt: new Date(),
          mandatMethod: 'MANUAL',
          mandatReviewMessage: null,
        },
      })

      // Update step status
      await tx.dossierStep.update({
        where: { id: mandateStep.id },
        data: {
          status: 'PENDING_VALIDATION',
          startedAt: mandateStep.startedAt || new Date(),
        },
      })

      // Notify admins
      const admins = await tx.user.findMany({
        where: { role: { in: ['ADMIN'] } },
      })

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            dossierId,
            type: 'MANDATE_SUBMITTED',
            title: 'Mandat signé à vérifier',
            message: `${dossier.client.firstName} ${dossier.client.lastName} a déposé son mandat signé.`,
            link: `/admin/dossiers/${dossierId}`,
          },
        })
      }

      // Notify client
      await tx.notification.create({
        data: {
          userId: dossier.clientId,
          dossierId,
          type: 'MANDATE_SUBMITTED',
          title: 'Mandat reçu',
          message: 'Votre mandat signé a bien été reçu. Il est en cours de vérification.',
          link: `/dossier/${dossierId}`,
        },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          dossierId,
          action: 'MANDATE_SIGNED',
          details: 'Mandat signé (signature manuscrite)',
        },
      })
    })

    // Notify admins in real-time
    notifyAdminsOfClientAction('mandate_submitted', {
      dossierId,
      clientName: `${dossier.client.firstName} ${dossier.client.lastName}`,
      message: 'Nouveau mandat signé à vérifier',
    })

    return NextResponse.json({
      success: true,
      message: 'Mandat reçu. Vérification en cours.',
      status: 'PENDING_REVIEW',
    })
  } catch (error) {
    console.error('Error signing mandate:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la signature du mandat' },
      { status: 500 }
    )
  }
}
