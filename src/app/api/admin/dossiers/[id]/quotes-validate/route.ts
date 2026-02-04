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

    // Get dossier with steps and client
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

    // Pour l'approbation, vérifier que les devis sont en attente
    if (action === 'APPROVE' && dossier.quotesStatus !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Les devis ne sont pas en attente de validation' },
        { status: 400 }
      )
    }

    // Pour le rejet, autoriser PENDING_REVIEW ou si déjà rejeté (re-rejet avec nouveau message)
    if (action === 'REJECT' && !['PENDING_REVIEW', 'REJECTED'].includes(dossier.quotesStatus || '')) {
      return NextResponse.json(
        { error: 'Les devis ne peuvent pas être rejetés dans cet état' },
        { status: 400 }
      )
    }

    // Find the quote deposit step
    const quoteStep = dossier.steps.find(s => s.template.code === 'QUOTE_DEPOSIT')
    if (!quoteStep) {
      return NextResponse.json(
        { error: 'Étape de dépôt des devis non trouvée' },
        { status: 400 }
      )
    }

    // Get quote documents
    const quoteDocuments = await prisma.document.findMany({
      where: {
        dossierId,
        type: 'DEVIS',
      },
    })

    const notifyUserId = dossier.clientId || dossier.artisanId

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        // Update dossier quotes status
        await tx.dossier.update({
          where: { id: dossierId },
          data: {
            quotesStatus: 'APPROVED',
            quotesReviewMessage: null,
          },
        })

        // Validate the quote step
        await tx.dossierStep.update({
          where: { id: quoteStep.id },
          data: {
            status: 'VALIDATED',
            validatedAt: new Date(),
            validatedBy: admin.id,
            blockedReason: null,
          },
        })

        // Update all quote documents to VALIDATED
        await tx.document.updateMany({
          where: {
            dossierId,
            type: 'DEVIS',
          },
          data: {
            status: 'VALIDATED',
            validatedAt: new Date(),
          },
        })

        // Unlock next step (WORK_AUTHORIZATION)
        const nextStep = dossier.steps.find(s => s.template.order === quoteStep.template.order + 1)
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

        // Notify client about quotes validation (only if there's a user to notify)
        if (notifyUserId) {
          await tx.notification.create({
            data: {
              userId: notifyUserId,
              dossierId,
              type: 'STEP_VALIDATED',
              title: 'Devis validés',
              message: 'Vos devis ont été vérifiés et validés. Vous pouvez passer à l\'étape suivante.',
              link: `/dossier/${dossierId}`,
            },
          })
        }

        // Log activity
        await tx.activityLog.create({
          data: {
            dossierId,
            userId: admin.id,
            action: 'QUOTES_VALIDATED',
            details: `Devis validés - ${quoteDocuments.length} document(s)`,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Devis validés avec succès',
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
        // Update dossier quotes status
        await tx.dossier.update({
          where: { id: dossierId },
          data: {
            quotesStatus: 'REJECTED',
            quotesReviewMessage: message,
          },
        })

        // Update step status - keep available for re-submission
        await tx.dossierStep.update({
          where: { id: quoteStep.id },
          data: {
            status: 'AVAILABLE',
            blockedReason: message,
          },
        })

        // Update all quote documents to REJECTED
        await tx.document.updateMany({
          where: {
            dossierId,
            type: 'DEVIS',
          },
          data: {
            status: 'REJECTED',
            rejectionReason: message,
          },
        })

        // Notify client about rejection (only if there's a user to notify)
        if (notifyUserId) {
          await tx.notification.create({
            data: {
              userId: notifyUserId,
              dossierId,
              type: 'STEP_REJECTED',
              title: 'Devis rejetés',
              message: `Vos devis ont été rejetés : ${message}. Veuillez les corriger et redéposer.`,
              link: `/dossier/${dossierId}/etape/QUOTE_DEPOSIT`,
            },
          })
        }

        // Log activity
        await tx.activityLog.create({
          data: {
            dossierId,
            userId: admin.id,
            action: 'QUOTES_REJECTED',
            details: `Devis rejetés: ${message}`,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Devis rejetés',
      })
    }
  } catch (error) {
    console.error('Error validating quotes:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}
