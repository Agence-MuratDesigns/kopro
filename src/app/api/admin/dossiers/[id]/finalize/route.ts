import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { totalWorksAmount, mprAmount, ceeAmount, notes } = body

    // Get dossier
    const dossier = await prisma.dossier.findUnique({
      where: { id },
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

    // Verify all previous steps are validated
    const finalStep = dossier.steps.find(s => s.template.code === 'FINAL_RECAP')
    const previousSteps = dossier.steps.filter(s => s.template.code !== 'FINAL_RECAP')
    const allPreviousValidated = previousSteps.every(s => s.status === 'VALIDATED')

    if (!allPreviousValidated) {
      return NextResponse.json(
        { error: 'Toutes les étapes précédentes doivent être validées avant de clôturer le dossier' },
        { status: 400 }
      )
    }

    // Update dossier
    const updatedDossier = await prisma.dossier.update({
      where: { id },
      data: {
        status: 'CLOTURE',
        isActive: false,
        closedAt: new Date(),
        closedById: session.userId,
        totalWorksAmount: totalWorksAmount ?? dossier.totalWorksAmount,
        mprAmount: mprAmount ?? dossier.mprAmount,
        ceeAmount: ceeAmount ?? dossier.ceeAmount,
        paymentStatus: 'IN_PROGRESS',
      },
    })

    // Update final step to VALIDATED
    if (finalStep) {
      await prisma.dossierStep.update({
        where: { id: finalStep.id },
        data: {
          status: 'VALIDATED',
          completedAt: new Date(),
        },
      })
    }

    // Create notification for client or artisan
    const notifyUserId = dossier.clientId || dossier.artisanId
    if (notifyUserId) {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          dossierId: id,
          type: 'STEP_COMPLETED',
          title: 'Dossier clôturé',
          message: `Le dossier ${dossier.reference} est désormais complet. Les démarches pour le versement des aides sont en cours.`,
          link: `/dossier/${id}/etape/FINAL_RECAP`,
        },
      })
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: 'DOSSIER_CLOSED',
        details: `Dossier clôturé par ${session.role}`,
        userId: session.userId,
        dossierId: id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Dossier clôturé avec succès',
      dossier: updatedDossier,
    })
  } catch (error) {
    console.error('Finalize dossier error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
