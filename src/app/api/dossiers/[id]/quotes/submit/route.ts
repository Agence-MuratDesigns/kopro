export const dynamic = 'force-dynamic'

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

    // Verify ownership and get dossier with client info
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        client: true,
        steps: {
          where: { template: { code: 'QUOTE_DEPOSIT' } },
          include: { template: true },
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

    // Check if quotes step is accessible
    const quoteStep = dossier.steps[0]
    if (!quoteStep || quoteStep.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas encore accessible' },
        { status: 403 }
      )
    }

    // Check current status
    if (dossier.quotesStatus === 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Les devis sont déjà en cours de validation' },
        { status: 400 }
      )
    }

    if (dossier.quotesStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Les devis ont déjà été validés' },
        { status: 400 }
      )
    }

    // Get all quote documents for this dossier
    const quoteDocuments = await prisma.document.findMany({
      where: {
        dossierId: id,
        type: 'DEVIS',
      },
    })

    // Check if all selected work types have at least one quote
    const selectedWorks: string[] = dossier.selectedWorks ? JSON.parse(dossier.selectedWorks) : []
    const workTypesWithQuotes = Array.from(new Set(quoteDocuments.map(doc => doc.workType).filter(Boolean))) as string[]

    const missingWorkTypes = selectedWorks.filter(
      work => !workTypesWithQuotes.includes(work)
    )

    if (missingWorkTypes.length > 0) {
      return NextResponse.json(
        {
          error: 'Veuillez déposer au moins un devis pour chaque type de travaux sélectionné',
          missingWorkTypes,
        },
        { status: 400 }
      )
    }

    // Update dossier and step status in a transaction
    await prisma.$transaction(async (tx) => {
      // Update dossier quotes status
      await tx.dossier.update({
        where: { id },
        data: {
          quotesStatus: 'PENDING_REVIEW',
          quotesSubmittedAt: new Date(),
          quotesReviewMessage: null,
        },
      })

      // Update step status
      await tx.dossierStep.update({
        where: { id: quoteStep.id },
        data: {
          status: 'PENDING_VALIDATION',
        },
      })

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
            title: 'Devis à vérifier',
            message: `Devis à vérifier – ${clientName}`,
            link: `/admin/dossiers/${id}`,
          },
        })
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          dossierId: id,
          userId: session.userId,
          action: 'QUOTES_SUBMITTED',
          details: `Devis soumis pour validation - ${quoteDocuments.length} document(s)`,
        },
      })
    })

    // Notify admins in real-time
    const clientNameRealtime = dossier.client
      ? `${dossier.client.firstName} ${dossier.client.lastName}`
      : dossier.endClientFirstName
        ? `${dossier.endClientFirstName} ${dossier.endClientLastName || ''}`
        : 'Client'
    notifyAdminsOfClientAction('quotes_submitted', {
      dossierId: id,
      clientName: clientNameRealtime,
      message: `Devis déposés par ${clientNameRealtime}`,
    })

    return NextResponse.json({
      success: true,
      message: 'Vos devis ont bien été transmis. Ils sont en cours de vérification.',
    })
  } catch (error) {
    console.error('Quote submit error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
