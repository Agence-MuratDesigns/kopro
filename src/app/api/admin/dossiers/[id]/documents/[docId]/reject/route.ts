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

    await prisma.$transaction(async (tx) => {
      // Update document status
      await tx.document.update({
        where: { id: docId },
        data: {
          status: 'REJECTED',
          rejectionReason: body.reason,
        },
      })

      // If it's a DEVIS or FACTURE, also update the dossier status
      if (document.type === 'DEVIS') {
        await tx.dossier.update({
          where: { id },
          data: {
            quotesStatus: 'REJECTED',
            quotesReviewMessage: body.reason,
          },
        })
        // Update step status to allow re-submission
        const quoteStep = await tx.dossierStep.findFirst({
          where: {
            dossierId: id,
            template: { code: 'QUOTE_DEPOSIT' },
          },
        })
        if (quoteStep) {
          await tx.dossierStep.update({
            where: { id: quoteStep.id },
            data: {
              status: 'AVAILABLE',
              blockedReason: body.reason,
            },
          })
        }
      } else if (document.type === 'FACTURE') {
        await tx.dossier.update({
          where: { id },
          data: {
            invoicesStatus: 'REJECTED',
            invoicesReviewMessage: body.reason,
          },
        })
        // Update step status to allow re-submission
        const invoiceStep = await tx.dossierStep.findFirst({
          where: {
            dossierId: id,
            template: { code: 'INVOICE_DEPOSIT' },
          },
        })
        if (invoiceStep) {
          await tx.dossierStep.update({
            where: { id: invoiceStep.id },
            data: {
              status: 'AVAILABLE',
              blockedReason: body.reason,
            },
          })
        }
      }

      // Notify client or artisan
      const notifyUserId = document.dossier.clientId || document.dossier.artisanId
      if (notifyUserId) {
        await tx.notification.create({
          data: {
            userId: notifyUserId,
            dossierId: id,
            type: 'DOCUMENT_REJECTED',
            title: 'Document refusé',
            message: `Le document "${document.name}" a été refusé : ${body.reason}`,
            link: `/dossier/${id}`,
          },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reject document error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
