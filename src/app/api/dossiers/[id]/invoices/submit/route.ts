import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyAdminsOfClientAction } from '@/lib/realtime'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await context.params

    // Get dossier with steps and documents
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true,
        steps: {
          include: { template: true },
        },
        documents: {
          where: { type: 'FACTURE' },
        },
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check access: client owns the dossier OR artisan manages it
    const isOwner = dossier.clientId === session.userId
    const isArtisanManager = dossier.artisanId === session.userId
    if (!isOwner && !isArtisanManager) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Check if already submitted and pending review
    if (dossier.invoicesStatus === 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Les factures sont déjà en cours de vérification' },
        { status: 400 }
      )
    }

    if (dossier.invoicesStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Les factures ont déjà été validées' },
        { status: 400 }
      )
    }

    // Verify step is accessible
    const invoiceStep = dossier.steps.find(s => s.template.code === 'INVOICE_DEPOSIT')
    if (!invoiceStep || !['AVAILABLE', 'IN_PROGRESS'].includes(invoiceStep.status)) {
      // Allow if rejected to enable resubmission
      if (dossier.invoicesStatus !== 'REJECTED') {
        return NextResponse.json(
          { error: 'Cette étape n\'est pas accessible' },
          { status: 400 }
        )
      }
    }

    // Group documents by work type
    const documentsByWorkType = dossier.documents.reduce((acc, doc) => {
      if (doc.workType) {
        if (!acc[doc.workType]) acc[doc.workType] = []
        acc[doc.workType].push(doc)
      }
      return acc
    }, {} as Record<string, typeof dossier.documents>)

    // Parse selected works from JSON string
    const selectedWorks: string[] = dossier.selectedWorks
      ? JSON.parse(dossier.selectedWorks)
      : []

    // Check all selected work types have at least one invoice
    const missingWorkTypes = selectedWorks.filter(
      (workType: string) => !documentsByWorkType[workType] || documentsByWorkType[workType].length === 0
    )

    if (missingWorkTypes.length > 0) {
      return NextResponse.json(
        { error: `Veuillez déposer au moins une facture pour chaque type de travaux sélectionné` },
        { status: 400 }
      )
    }

    // Submit invoices
    await prisma.$transaction(async (tx) => {
      // Update dossier status
      await tx.dossier.update({
        where: { id },
        data: {
          invoicesStatus: 'PENDING_REVIEW',
          invoicesSubmittedAt: new Date(),
          invoicesReviewMessage: null,
        },
      })

      // Update step status to pending validation
      if (invoiceStep) {
        await tx.dossierStep.update({
          where: { id: invoiceStep.id },
          data: {
            status: 'PENDING_VALIDATION',
            blockedReason: null,
          },
        })
      }

      // Create notification for admins
      const admins = await tx.user.findMany({
        where: { role: { in: ['ADMIN'] } },
      })

      const clientName = dossier.client
        ? `${dossier.client.firstName} ${dossier.client.lastName}`
        : dossier.endClientFirstName
          ? `${dossier.endClientFirstName} ${dossier.endClientLastName || ''}`
          : 'Client'

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            dossierId: id,
            type: 'DOCUMENT_REQUIRED',
            title: 'Factures finales déposées',
            message: `${clientName} a déposé ses factures finales. Vérification requise.`,
            link: `/admin/dossiers/${id}`,
          },
        })
      }

      // Create system message
      await tx.message.create({
        data: {
          dossierId: id,
          content: 'Les factures finales ont été déposées et sont en attente de vérification.',
          messageType: 'SYSTEM',
          category: 'INFO',
        },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.userId,
          dossierId: id,
          action: 'INVOICES_SUBMITTED',
          details: `${dossier.documents.length} facture(s) soumise(s) pour vérification`,
        },
      })
    })

    // Notify admins in real-time
    const clientNameRealtime = dossier.client
      ? `${dossier.client.firstName} ${dossier.client.lastName}`
      : dossier.endClientFirstName
        ? `${dossier.endClientFirstName} ${dossier.endClientLastName || ''}`
        : 'Client'
    notifyAdminsOfClientAction('invoices_submitted', {
      dossierId: id,
      clientName: clientNameRealtime,
      message: `Factures finales déposées par ${clientNameRealtime}`,
    })

    return NextResponse.json({
      success: true,
      message: 'Vos factures ont bien été transmises. Elles sont en cours de vérification.',
    })
  } catch (error) {
    console.error('Invoice submit error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
