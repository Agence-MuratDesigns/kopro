export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const admin = await requireRole(['ADMIN'])
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

    if (dossier.mandatStatus !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Le mandat n\'est pas en attente de validation' },
        { status: 400 }
      )
    }

    // Find the mandate step
    const mandateStep = dossier.steps.find(s => s.template.code === 'MANDATE_SIGNATURE')
    if (!mandateStep) {
      return NextResponse.json(
        { error: 'Étape du mandat non trouvée' },
        { status: 400 }
      )
    }

    const notifyUserId = dossier.clientId || dossier.artisanId

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        // Update dossier
        await tx.dossier.update({
          where: { id: dossierId },
          data: {
            mandatStatus: 'APPROVED',
            mandatReviewMessage: null,
          },
        })

        // Validate the mandate step
        await tx.dossierStep.update({
          where: { id: mandateStep.id },
          data: {
            status: 'VALIDATED',
            validatedAt: new Date(),
            validatedBy: admin.id,
          },
        })

        // Validate mandate documents
        await tx.document.updateMany({
          where: {
            dossierId,
            type: 'MANDAT',
            status: 'PENDING',
          },
          data: {
            status: 'VALIDATED',
            validatedAt: new Date(),
          },
        })

        // Unlock next step
        const nextStep = dossier.steps.find(s => s.template.order === mandateStep.template.order + 1)
        if (nextStep) {
          await tx.dossierStep.update({
            where: { id: nextStep.id },
            data: { status: 'AVAILABLE' },
          })

          // Notify client about next step (only if there's a user to notify)
          if (notifyUserId) {
            await tx.notification.create({
              data: {
                userId: notifyUserId,
                dossierId,
                type: 'STEP_AVAILABLE',
                title: 'Nouvelle étape disponible',
                message: `L'étape "${nextStep.template.name}" est maintenant accessible.`,
                link: `/dossier/${dossierId}/etape/${nextStep.template.code}`,
              },
            })
          }
        }

        // Notify client (only if there's a user to notify)
        if (notifyUserId) {
          await tx.notification.create({
            data: {
              userId: notifyUserId,
              dossierId,
              type: 'MANDATE_APPROVED',
              title: 'Mandat validé',
              message: 'Votre mandat signé a été vérifié et validé. Vous pouvez passer à l\'étape suivante.',
              link: `/dossier/${dossierId}`,
            },
          })
        }

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            dossierId,
            action: 'MANDATE_APPROVED',
            details: 'Mandat validé par l\'administration',
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Mandat validé avec succès',
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
            mandatStatus: 'REJECTED',
            mandatReviewMessage: message,
          },
        })

        // Keep step available for re-submission
        await tx.dossierStep.update({
          where: { id: mandateStep.id },
          data: {
            status: 'AVAILABLE',
            blockedReason: message,
          },
        })

        // Reject mandate documents
        await tx.document.updateMany({
          where: {
            dossierId,
            type: 'MANDAT',
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            rejectionReason: message,
          },
        })

        // Notify client (only if there's a user to notify)
        if (notifyUserId) {
          await tx.notification.create({
            data: {
              userId: notifyUserId,
              dossierId,
              type: 'MANDATE_REJECTED',
              title: 'Mandat rejeté',
              message: `Votre mandat a été rejeté : ${message}. Veuillez le corriger.`,
              link: `/dossier/${dossierId}/etape/MANDATE_SIGNATURE`,
            },
          })
        }

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            dossierId,
            action: 'MANDATE_REJECTED',
            details: `Mandat rejeté : ${message}`,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Mandat rejeté',
      })
    }
  } catch (error) {
    console.error('Error validating mandate:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}
