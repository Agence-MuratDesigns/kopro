export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { sendEventToUser } from '@/lib/realtime'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Submit MPR identifier (AUTO-VALIDATION - pas de validation admin)
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

    // Check ownership (client or artisan)
    const isOwner = dossier.clientId === user.id || dossier.artisanId === user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Determine actor type for history
    const actorType = dossier.artisanId === user.id ? 'ARTISAN' : 'CLIENT'

    // Validate MPR ID format
    const mprIdRegex = /^MPR-\d{4}[A-Z]{2}$/
    if (!mprIdRegex.test(mprId)) {
      return NextResponse.json(
        { error: 'Format invalide. L\'identifiant doit être au format MPR-XXXXAB' },
        { status: 400 }
      )
    }

    // Find the MPR step
    const mprStep = dossier.steps.find(s => s.template.code === 'MPR_IDENTIFIER')
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

    // Find the next step (PROJECT_INFO)
    const nextStep = dossier.steps.find(s => s.template.code === 'PROJECT_INFO')

    // AUTO-VALIDATION: Valider directement l'étape et débloquer la suivante
    await prisma.$transaction(async (tx) => {
      // Update dossier - directement APPROVED (auto-validation)
      await tx.dossier.update({
        where: { id: dossierId },
        data: {
          mprId,
          mprStatus: 'APPROVED', // Auto-validation
          mprSubmittedAt: new Date(),
          mprLastUpdatedAt: new Date(),
          mprReviewedAt: new Date(), // Validé automatiquement
          mprReviewMessage: null,
        },
      })

      // Valider l'étape MPR directement
      await tx.dossierStep.update({
        where: { id: mprStep.id },
        data: {
          status: 'VALIDATED',
          startedAt: mprStep.startedAt || new Date(),
          validatedAt: new Date(),
        },
      })

      // Débloquer l'étape suivante (PROJECT_INFO)
      if (nextStep) {
        await tx.dossierStep.update({
          where: { id: nextStep.id },
          data: { status: 'AVAILABLE' },
        })
      }

      // Log in MPR history
      await tx.mprHistory.create({
        data: {
          dossierId,
          previousValue,
          newValue: mprId,
          action,
          actorId: user.id,
          actorType,
        },
      })

      // Auto-validation entry in history
      await tx.mprHistory.create({
        data: {
          dossierId,
          previousValue: mprId,
          newValue: mprId,
          action: 'APPROVED',
          actorId: null, // Système
          actorType: 'SYSTEM',
          message: 'Validation automatique (format vérifié)',
        },
      })

      // Notification client : étape suivante disponible
      if (nextStep) {
        await tx.notification.create({
          data: {
            userId: user.id,
            dossierId,
            type: 'STEP_AVAILABLE',
            title: 'Identifiant enregistré',
            message: `Votre identifiant MaPrimeRénov' a été enregistré. Vous pouvez maintenant compléter les informations de votre projet.`,
            link: `/dossier/${dossierId}/etape/PROJECT_INFO`,
          },
        })
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          dossierId,
          action: 'MPR_ID_VALIDATED',
          details: `Identifiant MPR enregistré et validé automatiquement : ${mprId}`,
        },
      })
    })

    // Notify client in real-time
    sendEventToUser(user.id, 'step_update', {
      dossierId,
      stepCode: 'MPR_IDENTIFIER',
      status: 'VALIDATED',
      action: 'auto_validated',
      nextStepCode: 'PROJECT_INFO',
    })

    return NextResponse.json({
      success: true,
      message: 'Identifiant enregistré avec succès. Passez à l\'étape suivante.',
      autoValidated: true,
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
        artisanId: true,
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

    // Check ownership (client or artisan)
    const isOwner = dossier.clientId === user.id || dossier.artisanId === user.id
    if (!isOwner) {
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
