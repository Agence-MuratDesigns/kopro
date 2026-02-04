export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { sendEventToUser } from '@/lib/realtime'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Valider ou rejeter les infos projet
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const admin = await requireRole(['ADMIN'])
    const body = await request.json()

    const { action, message } = body

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez APPROVE ou REJECT.' },
        { status: 400 }
      )
    }

    if (action === 'REJECT' && !message) {
      return NextResponse.json(
        { error: 'Un message est requis pour le rejet' },
        { status: 400 }
      )
    }

    // Get dossier with steps and client
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        client: true,
        steps: {
          include: { template: true },
          orderBy: { template: { order: 'asc' } },
        },
        documents: true,
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check if project info is pending review
    if (dossier.projectInfoStatus !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Les informations projet ne sont pas en attente de validation' },
        { status: 400 }
      )
    }

    // Find PROJECT_INFO step
    const projectInfoStep = dossier.steps.find(s => s.template.code === 'PROJECT_INFO')
    if (!projectInfoStep) {
      return NextResponse.json(
        { error: 'Étape des informations projet non trouvée' },
        { status: 400 }
      )
    }

    // Find next step (PAYMENT - step 4)
    const paymentStep = dossier.steps.find(s => s.template.code === 'PAYMENT')

    // Get project documents
    const projectDocs = dossier.documents.filter(d => d.stepId === projectInfoStep.id)

    const notifyUserId = dossier.clientId || dossier.artisanId

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        // Update dossier
        await tx.dossier.update({
          where: { id: dossierId },
          data: {
            projectInfoStatus: 'APPROVED',
            projectInfoReviewedAt: new Date(),
            projectInfoReviewMessage: null,
          },
        })

        // Validate PROJECT_INFO step
        await tx.dossierStep.update({
          where: { id: projectInfoStep.id },
          data: {
            status: 'VALIDATED',
            validatedAt: new Date(),
            validatedBy: admin.id,
          },
        })

        // Unlock PAYMENT step (step 4)
        if (paymentStep) {
          await tx.dossierStep.update({
            where: { id: paymentStep.id },
            data: { status: 'AVAILABLE' },
          })
        }

        // Validate all project documents
        for (const doc of projectDocs) {
          await tx.document.update({
            where: { id: doc.id },
            data: {
              status: 'VALIDATED',
              validatedAt: new Date(),
            },
          })
        }

        // Client notification (only if there's a user to notify)
        if (notifyUserId) {
          await tx.notification.create({
            data: {
              userId: notifyUserId,
              dossierId,
              type: 'PROJECT_INFO_VALIDATED',
              title: 'Informations projet validées',
              message: 'Vos informations projet ont été validées. Vous pouvez maintenant procéder au paiement.',
              link: `/dossier/${dossierId}/etape/PAYMENT`,
            },
          })
        }

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            dossierId,
            action: 'PROJECT_INFO_VALIDATED',
            details: `Informations projet validées par ${admin.firstName} ${admin.lastName}`,
          },
        })
      })

      // Real-time notifications (only if there's a user to notify)
      if (notifyUserId) {
        sendEventToUser(notifyUserId, 'step_update', {
          dossierId,
          stepCode: 'PROJECT_INFO',
          status: 'VALIDATED',
          action: 'approved',
          nextStepCode: 'PAYMENT',
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Informations projet validées avec succès',
      })
    } else {
      // REJECT
      await prisma.$transaction(async (tx) => {
        // Update dossier
        await tx.dossier.update({
          where: { id: dossierId },
          data: {
            projectInfoStatus: 'REJECTED',
            projectInfoReviewedAt: new Date(),
            projectInfoReviewMessage: message,
          },
        })

        // Keep PROJECT_INFO step available for correction
        await tx.dossierStep.update({
          where: { id: projectInfoStep.id },
          data: {
            status: 'AVAILABLE',
            blockedReason: message,
          },
        })

        // Reject all project documents
        for (const doc of projectDocs) {
          await tx.document.update({
            where: { id: doc.id },
            data: {
              status: 'REJECTED',
              rejectionReason: message,
            },
          })
        }

        // Client notification (only if there's a user to notify)
        if (notifyUserId) {
          await tx.notification.create({
            data: {
              userId: notifyUserId,
              dossierId,
              type: 'PROJECT_INFO_REJECTED',
              title: 'Informations projet à corriger',
              message: `Vos informations projet nécessitent des corrections: ${message}`,
              link: `/dossier/${dossierId}/etape/PROJECT_INFO`,
            },
          })
        }

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            dossierId,
            action: 'PROJECT_INFO_REJECTED',
            details: `Informations projet rejetées par ${admin.firstName} ${admin.lastName}: ${message}`,
          },
        })
      })

      // Real-time notifications (only if there's a user to notify)
      if (notifyUserId) {
        sendEventToUser(notifyUserId, 'step_update', {
          dossierId,
          stepCode: 'PROJECT_INFO',
          status: 'REJECTED',
          action: 'rejected',
          message,
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Informations projet rejetées',
      })
    }
  } catch (error) {
    console.error('Error validating project info:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}
