import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { notifyAdminsOfClientAction } from '@/lib/realtime'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Notify work has started
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

    // Check if work has already started
    if (dossier.workStatus !== 'NOT_STARTED') {
      return NextResponse.json(
        { error: 'Les travaux ont déjà été notifiés' },
        { status: 400 }
      )
    }

    // Verify that quotes have been validated (step 5 completed)
    if (dossier.quotesStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Les devis doivent être validés avant de notifier le début des travaux' },
        { status: 400 }
      )
    }

    // Find the work authorization step (step 6)
    const workAuthStep = dossier.steps.find(s => s.template.code === 'WORK_AUTHORIZATION')
    if (!workAuthStep) {
      return NextResponse.json(
        { error: 'Étape d\'autorisation des travaux non trouvée' },
        { status: 400 }
      )
    }

    // Check if step is available
    if (workAuthStep.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas encore accessible' },
        { status: 400 }
      )
    }

    if (workAuthStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Cette étape a déjà été validée' },
        { status: 400 }
      )
    }

    // Find the next step (invoice deposit - step 7)
    const invoiceStep = dossier.steps.find(s => s.template.code === 'INVOICE_DEPOSIT')

    await prisma.$transaction(async (tx) => {
      // Update dossier with work started
      await tx.dossier.update({
        where: { id: dossierId },
        data: {
          workStatus: 'IN_PROGRESS',
          workStartedAt: new Date(),
          currentStep: 7, // Move to step 7
        },
      })

      // Update step 6 as validated (auto-validation when client notifies)
      await tx.dossierStep.update({
        where: { id: workAuthStep.id },
        data: {
          status: 'VALIDATED',
          startedAt: workAuthStep.startedAt || new Date(),
          completedAt: new Date(),
          validatedAt: new Date(),
        },
      })

      // Unlock the next step (invoice deposit - step 7)
      if (invoiceStep) {
        await tx.dossierStep.update({
          where: { id: invoiceStep.id },
          data: {
            status: 'AVAILABLE',
          },
        })
      }

      // Create notification for admins
      const admins = await tx.user.findMany({
        where: { role: { in: ['ADMIN'] } },
      })

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            dossierId,
            type: 'WORK_STARTED',
            title: 'Travaux démarrés',
            message: `Le client ${user.firstName} ${user.lastName} a notifié le début des travaux`,
            link: `/admin/dossiers/${dossierId}`,
          },
        })
      }

      // Create notification for client
      await tx.notification.create({
        data: {
          userId: user.id,
          dossierId,
          type: 'WORK_STARTED_CONFIRMATION',
          title: 'Début des travaux confirmé',
          message: 'Le début des travaux a bien été enregistré. N\'oubliez pas de conserver toutes vos factures.',
          link: `/dossier/${dossierId}`,
        },
      })

      // Create system message in dossier
      await tx.message.create({
        data: {
          dossierId,
          content: `Les travaux ont démarré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}. Pensez à conserver toutes vos factures et attestations de fin de travaux.`,
          messageType: 'SYSTEM',
          category: 'WORK_STARTED',
        },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          dossierId,
          action: 'WORK_STARTED',
          details: 'Le client a notifié le début des travaux',
        },
      })
    })

    // Notify admins in real-time
    notifyAdminsOfClientAction('work_started', {
      dossierId,
      clientName: `${user.firstName} ${user.lastName}`,
      message: `${user.firstName} ${user.lastName} a démarré ses travaux`,
    })

    return NextResponse.json({
      success: true,
      message: 'Le début des travaux a bien été enregistré',
    })
  } catch (error) {
    console.error('Error notifying work start:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la notification' },
      { status: 500 }
    )
  }
}

// GET - Get work status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      select: {
        clientId: true,
        workStatus: true,
        workStartedAt: true,
        quotesStatus: true,
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    if (dossier.clientId !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json({
      workStatus: dossier.workStatus,
      workStartedAt: dossier.workStartedAt,
      quotesStatus: dossier.quotesStatus,
      canStartWork: dossier.quotesStatus === 'APPROVED' && dossier.workStatus === 'NOT_STARTED',
    })
  } catch (error) {
    console.error('Error fetching work status:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}
