import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DEV ONLY: Skip step for testing purposes
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Cette fonctionnalité n\'est pas disponible en production' },
      { status: 403 }
    )
  }

  try {
    const { id: dossierId } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { stepCode } = body

    if (!stepCode) {
      return NextResponse.json({ error: 'Code d\'étape requis' }, { status: 400 })
    }

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

    // Find the step to skip
    const stepToSkip = dossier.steps.find(s => s.template.code === stepCode)
    if (!stepToSkip) {
      return NextResponse.json({ error: 'Étape non trouvée' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // Mark step as validated
      await tx.dossierStep.update({
        where: { id: stepToSkip.id },
        data: {
          status: 'VALIDATED',
          validatedAt: new Date(),
          startedAt: stepToSkip.startedAt || new Date(),
        },
      })

      // Update dossier fields based on step
      const updateData: any = {}

      switch (stepCode) {
        case 'MPR_IDENTIFIER':
          updateData.mprId = 'MPR-0000XX'
          updateData.mprStatus = 'APPROVED'
          updateData.mprSubmittedAt = new Date()
          updateData.mprReviewedAt = new Date()
          break
        case 'MANDATE_SIGNATURE':
          updateData.mandatStatus = 'APPROVED'
          updateData.mandatSignedAt = new Date()
          updateData.mandatMethod = 'ELECTRONIC'
          break
        case 'WORK_SELECTION':
          updateData.selectedWorks = JSON.stringify(['ISOLATION', 'HEATING'])
          updateData.worksSelectedAt = new Date()
          break
        case 'QUOTE_DEPOSIT':
          updateData.quotesStatus = 'APPROVED'
          updateData.quotesSubmittedAt = new Date()
          break
        case 'WORK_AUTHORIZATION':
          updateData.workStatus = 'IN_PROGRESS'
          updateData.workStartedAt = new Date()
          break
        case 'INVOICE_DEPOSIT':
          updateData.invoicesStatus = 'APPROVED'
          updateData.invoicesSubmittedAt = new Date()
          break
      }

      if (Object.keys(updateData).length > 0) {
        await tx.dossier.update({
          where: { id: dossierId },
          data: updateData,
        })
      }

      // Unlock next step
      const nextStep = dossier.steps.find(
        s => s.template.order === stepToSkip.template.order + 1
      )
      if (nextStep) {
        await tx.dossierStep.update({
          where: { id: nextStep.id },
          data: { status: 'AVAILABLE' },
        })
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          dossierId,
          action: 'STEP_SKIPPED_DEV',
          details: `Étape ${stepCode} passée (mode développement)`,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: `Étape ${stepCode} passée avec succès`,
    })
  } catch (error) {
    console.error('Error skipping step:', error)
    return NextResponse.json(
      { error: 'Erreur lors du passage de l\'étape' },
      { status: 500 }
    )
  }
}
