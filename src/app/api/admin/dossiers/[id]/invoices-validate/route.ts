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

    // Get dossier with steps and documents
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        client: true,
        steps: {
          include: { template: true },
          orderBy: { template: { order: 'asc' } },
        },
        documents: {
          where: { type: 'FACTURE' },
        },
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Pour l'approbation, vérifier que les factures sont en attente
    if (action === 'APPROVE' && dossier.invoicesStatus !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Les factures ne sont pas en attente de validation' },
        { status: 400 }
      )
    }

    // Pour le rejet, autoriser PENDING_REVIEW ou si déjà rejeté (re-rejet avec nouveau message)
    if (action === 'REJECT' && !['PENDING_REVIEW', 'REJECTED'].includes(dossier.invoicesStatus || '')) {
      return NextResponse.json(
        { error: 'Les factures ne peuvent pas être rejetées dans cet état' },
        { status: 400 }
      )
    }

    // Find the invoice step
    const invoiceStep = dossier.steps.find(s => s.template.code === 'INVOICE_DEPOSIT')
    if (!invoiceStep) {
      return NextResponse.json(
        { error: 'Étape factures non trouvée' },
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
            invoicesStatus: 'APPROVED',
            invoicesReviewMessage: null,
            currentStep: 8,
          },
        })

        // Validate the invoice step
        await tx.dossierStep.update({
          where: { id: invoiceStep.id },
          data: {
            status: 'VALIDATED',
            validatedAt: new Date(),
            validatedBy: admin.id,
            blockedReason: null,
          },
        })

        // Mark all invoice documents as validated
        await tx.document.updateMany({
          where: {
            dossierId,
            type: 'FACTURE',
          },
          data: {
            status: 'VALIDATED',
          },
        })

        // Unlock next step (FINAL_RECAP - step 8)
        const nextStep = dossier.steps.find(s => s.template.code === 'FINAL_RECAP')
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
                title: 'Factures validées',
                message: 'Vos factures ont été validées. Votre dossier est maintenant complet !',
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
              type: 'STEP_VALIDATED',
              title: 'Factures validées',
              message: 'Vos factures finales ont été vérifiées et validées. Votre dossier est complet !',
              link: `/dossier/${dossierId}`,
            },
          })
        }

        // Create system message
        await tx.message.create({
          data: {
            dossierId,
            content: 'Les factures finales ont été validées par l\'administration. Le dossier est maintenant complet.',
            messageType: 'SYSTEM',
            category: 'STEP_VALIDATION',
          },
        })

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            dossierId,
            action: 'INVOICES_APPROVED',
            details: `Factures validées (${dossier.documents.length} document(s))`,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Factures validées avec succès',
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
            invoicesStatus: 'REJECTED',
            invoicesReviewMessage: message,
          },
        })

        // Keep step available for re-submission
        await tx.dossierStep.update({
          where: { id: invoiceStep.id },
          data: {
            status: 'AVAILABLE',
            blockedReason: message,
          },
        })

        // Mark all invoice documents as rejected
        await tx.document.updateMany({
          where: {
            dossierId,
            type: 'FACTURE',
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
              type: 'STEP_REJECTED',
              title: 'Factures rejetées',
              message: `Vos factures ont été rejetées : ${message}. Veuillez les corriger.`,
              link: `/dossier/${dossierId}/etape/INVOICE_DEPOSIT`,
            },
          })
        }

        // Create system message
        await tx.message.create({
          data: {
            dossierId,
            content: `Les factures ont été rejetées : ${message}. Veuillez déposer des factures corrigées.`,
            messageType: 'SYSTEM',
            category: 'STEP_REJECTION',
          },
        })

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: admin.id,
            dossierId,
            action: 'INVOICES_REJECTED',
            details: `Factures rejetées : ${message}`,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Factures rejetées',
      })
    }
  } catch (error) {
    console.error('Error validating invoices:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}
