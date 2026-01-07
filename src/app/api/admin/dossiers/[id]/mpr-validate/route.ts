import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const admin = await requireRole(['ADMIN', 'ADVISOR'])
    const body = await request.json()
    const { action, message } = body

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 }
      )
    }

    // Get dossier
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

    if (dossier.mprStatus !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'L\'identifiant n\'est pas en attente de validation' },
        { status: 400 }
      )
    }

    // Find the MPR step
    const mprStep = dossier.steps.find(s => s.template.code === 'MPR_IDENTIFIER')
    if (!mprStep) {
      return NextResponse.json(
        { error: 'Étape MPR non trouvée' },
        { status: 400 }
      )
    }

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        // Update dossier
        await tx.dossier.update({
          where: { id: dossierId },
          data: {
            mprStatus: 'APPROVED',
            mprReviewedAt: new Date(),
            mprReviewedById: admin.id,
            mprReviewMessage: null,
          },
        })

        // Validate the MPR step
        await tx.dossierStep.update({
          where: { id: mprStep.id },
          data: {
            status: 'VALIDATED',
            validatedAt: new Date(),
            validatedBy: admin.id,
          },
        })

        // Unlock next step
        const nextStep = dossier.steps.find(s => s.template.order === mprStep.template.order + 1)
        if (nextStep) {
          await tx.dossierStep.update({
            where: { id: nextStep.id },
            data: { status: 'AVAILABLE' },
          })

          // Notify client about next step
          await tx.notification.create({
            data: {
              userId: dossier.clientId,
              dossierId,
              type: 'STEP_AVAILABLE',
              title: 'Nouvelle étape disponible',
              message: `L'étape "${nextStep.template.name}" est maintenant accessible.`,
              link: `/dossier/${dossierId}/etape/${nextStep.template.code}`,
            },
          })
        }

        // Log in MPR history
        await tx.mprHistory.create({
          data: {
            dossierId,
            previousValue: dossier.mprId,
            newValue: dossier.mprId,
            action: 'APPROVED',
            actorId: admin.id,
            actorType: 'ADMIN',
          },
        })

        // Notify client
        await tx.notification.create({
          data: {
            userId: dossier.clientId,
            dossierId,
            type: 'MPR_APPROVED',
            title: 'Identifiant MaPrimeRénov\' validé',
            message: 'Votre identifiant MaPrimeRénov\' a été vérifié et validé. Vous pouvez passer à l\'étape suivante.',
            link: `/dossier/${dossierId}`,
          },
        })

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            dossierId,
            action: 'MPR_ID_APPROVED',
            details: `Identifiant MPR validé : ${dossier.mprId}`,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Identifiant validé avec succès',
      })
    } else {
      // REJECT
      if (!message?.trim()) {
        return NextResponse.json(
          { error: 'Une raison de rejet est requise' },
          { status: 400 }
        )
      }

      await prisma.$transaction(async (tx) => {
        // Update dossier
        await tx.dossier.update({
          where: { id: dossierId },
          data: {
            mprStatus: 'REJECTED',
            mprReviewedAt: new Date(),
            mprReviewedById: admin.id,
            mprReviewMessage: message,
          },
        })

        // Keep step available for re-submission
        await tx.dossierStep.update({
          where: { id: mprStep.id },
          data: {
            status: 'AVAILABLE',
            blockedReason: message,
          },
        })

        // Log in MPR history
        await tx.mprHistory.create({
          data: {
            dossierId,
            previousValue: dossier.mprId,
            newValue: null,
            action: 'REJECTED',
            actorId: admin.id,
            actorType: 'ADMIN',
            message,
          },
        })

        // Notify client
        await tx.notification.create({
          data: {
            userId: dossier.clientId,
            dossierId,
            type: 'MPR_REJECTED',
            title: 'Identifiant MaPrimeRénov\' rejeté',
            message: `Votre identifiant a été rejeté : ${message}. Veuillez le corriger.`,
            link: `/dossier/${dossierId}/etape/MPR_IDENTIFIER`,
          },
        })

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            dossierId,
            action: 'MPR_ID_REJECTED',
            details: `Identifiant MPR rejeté : ${message}`,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Identifiant rejeté',
      })
    }
  } catch (error) {
    console.error('Error validating MPR:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}
