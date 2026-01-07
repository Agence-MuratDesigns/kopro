import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Submit MPR identifier
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { mprId } = body

    // Get dossier and verify ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
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

    // Validate MPR ID format
    const mprIdRegex = /^MPR-\d{4}[A-Z]{2}$/
    if (!mprIdRegex.test(mprId)) {
      return NextResponse.json(
        { error: 'Format invalide. L\'identifiant doit être au format MPR-XXXXAB' },
        { status: 400 }
      )
    }

    // Find the MPR step
    const mprStep = dossier.steps.find(s => s.template.code === 'IDENTIFIANT_MPR')
    if (!mprStep) {
      return NextResponse.json(
        { error: 'Étape de l\'identifiant MPR non trouvée' },
        { status: 400 }
      )
    }

    // Check if step is available
    if (mprStep.status === 'LOCKED' || mprStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas modifiable' },
        { status: 400 }
      )
    }

    const previousValue = dossier.mprId
    const action = previousValue ? 'MODIFIED' : 'SUBMITTED'

    // Update dossier with MPR ID
    await prisma.$transaction(async (tx) => {
      // Update dossier
      await tx.dossier.update({
        where: { id: dossierId },
        data: {
          mprId,
          mprStatus: 'PENDING_REVIEW',
          mprSubmittedAt: new Date(),
          mprLastUpdatedAt: new Date(),
          mprReviewMessage: null,
        },
      })

      // Update step status
      await tx.dossierStep.update({
        where: { id: mprStep.id },
        data: {
          status: 'PENDING_VALIDATION',
          startedAt: mprStep.startedAt || new Date(),
        },
      })

      // Log in MPR history
      await tx.mprHistory.create({
        data: {
          dossierId,
          previousValue,
          newValue: mprId,
          action,
          actorId: user.id,
          actorType: 'CLIENT',
        },
      })

      // Create notification for admins
      const admins = await tx.user.findMany({
        where: { role: { in: ['ADMIN', 'ADVISOR'] } },
      })

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            dossierId,
            type: 'MPR_SUBMITTED',
            title: 'Nouvel identifiant MPR à valider',
            message: `Le client ${user.firstName} ${user.lastName} a soumis son identifiant MaPrimeRénov' : ${mprId}`,
            link: `/admin/dossiers/${dossierId}`,
          },
        })
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          dossierId,
          action: 'MPR_ID_SUBMITTED',
          details: `Identifiant MPR soumis : ${mprId}`,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Identifiant soumis avec succès',
    })
  } catch (error) {
    console.error('Error submitting MPR ID:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la soumission' },
      { status: 500 }
    )
  }
}

// GET - Get MPR identifier status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      select: {
        clientId: true,
        mprId: true,
        mprStatus: true,
        mprSubmittedAt: true,
        mprReviewedAt: true,
        mprReviewMessage: true,
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    if (dossier.clientId !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json({
      mprId: dossier.mprId,
      mprStatus: dossier.mprStatus,
      mprSubmittedAt: dossier.mprSubmittedAt,
      mprReviewedAt: dossier.mprReviewedAt,
      mprReviewMessage: dossier.mprReviewMessage,
    })
  } catch (error) {
    console.error('Error fetching MPR status:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}
