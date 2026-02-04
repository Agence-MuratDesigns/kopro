export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { sendEventToUser } from '@/lib/realtime'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Récupérer les infos projet
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      select: {
        clientId: true,
        artisanId: true,
        projectInfoStatus: true,
        projectInfoSubmittedAt: true,
        projectInfoReviewedAt: true,
        projectInfoReviewMessage: true,
        projectInfoLastSavedAt: true,
        energyType: true,
        housingType: true,
        housingSurface: true,
        constructionYear: true,
        ownershipStatus: true,
        revenueCategory: true,
        householdSize: true,
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check access: client owns the dossier OR artisan manages it
    const isOwner = dossier.clientId === user.id
    const isArtisanManager = user.role === 'ARTISAN' && dossier.artisanId === user.id
    if (!isOwner && !isArtisanManager) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    return NextResponse.json(dossier)
  } catch (error) {
    console.error('Error fetching project info:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

// POST - Soumettre les infos projet pour validation admin
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()
    const body = await request.json()

    const {
      energyType,
      housingType,
      housingSurface,
      constructionYear,
      revenueCategory,
      householdSize,
      ownershipStatus,
    } = body

    // Get dossier and verify ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        steps: {
          include: { template: true },
          orderBy: { template: { order: 'asc' } },
        },
        documents: true,
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check access: client owns the dossier OR artisan manages it
    const isOwner = dossier.clientId === user.id
    const isArtisanManager = user.role === 'ARTISAN' && dossier.artisanId === user.id
    if (!isOwner && !isArtisanManager) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Find PROJECT_INFO step
    const projectInfoStep = dossier.steps.find(s => s.template.code === 'PROJECT_INFO')
    if (!projectInfoStep) {
      return NextResponse.json(
        { error: 'Étape des informations projet non trouvée' },
        { status: 400 }
      )
    }

    // Check if step is available
    if (projectInfoStep.status === 'LOCKED' || projectInfoStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas modifiable' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!energyType || !housingType || !housingSurface || !constructionYear ||
        !revenueCategory || !householdSize || !ownershipStatus) {
      return NextResponse.json(
        { error: 'Tous les champs sont obligatoires' },
        { status: 400 }
      )
    }

    // Check if all required documents are uploaded
    const requiredDocTypes = ['TAXE_FONCIERE', 'AVIS_IMPOSITION', 'CARTE_IDENTITE', 'RIB']
    const uploadedDocTypes = dossier.documents
      .filter(d => d.stepId === projectInfoStep.id)
      .map(d => d.type)

    const missingDocs = requiredDocTypes.filter(t => !uploadedDocTypes.includes(t))
    if (missingDocs.length > 0) {
      return NextResponse.json(
        { error: `Documents manquants: ${missingDocs.join(', ')}` },
        { status: 400 }
      )
    }

    // Get all admins for notifications
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    await prisma.$transaction(async (tx) => {
      // Update dossier with project info
      await tx.dossier.update({
        where: { id: dossierId },
        data: {
          energyType,
          housingType,
          housingSurface: parseFloat(housingSurface.toString()),
          constructionYear: parseInt(constructionYear.toString()),
          revenueCategory,
          householdSize: parseInt(householdSize.toString()),
          ownershipStatus,
          projectInfoStatus: 'PENDING_REVIEW',
          projectInfoSubmittedAt: new Date(),
          projectInfoReviewMessage: null,
        },
      })

      // Update step status
      await tx.dossierStep.update({
        where: { id: projectInfoStep.id },
        data: {
          status: 'PENDING_VALIDATION',
          startedAt: projectInfoStep.startedAt || new Date(),
        },
      })

      // Create notifications for admins
      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            dossierId,
            type: 'PROJECT_INFO_SUBMITTED',
            title: 'Infos projet à valider',
            message: `${user.firstName} ${user.lastName} a soumis ses informations projet.`,
            link: `/admin/dossiers/${dossierId}`,
          },
        })
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          dossierId,
          action: 'PROJECT_INFO_SUBMITTED',
          details: 'Informations projet soumises pour validation',
        },
      })
    })

    // Real-time notification to client
    sendEventToUser(user.id, 'step_update', {
      dossierId,
      stepCode: 'PROJECT_INFO',
      status: 'PENDING_VALIDATION',
      action: 'submitted',
    })

    // Real-time notification to admins
    for (const admin of admins) {
      sendEventToUser(admin.id, 'notification', {
        type: 'PROJECT_INFO_SUBMITTED',
        dossierId,
        message: `Nouvelles infos projet à valider`,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Informations enregistrées. En attente de vérification.',
    })
  } catch (error) {
    console.error('Error submitting project info:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la soumission' },
      { status: 500 }
    )
  }
}

// PUT - Sauvegarde partielle des infos projet (brouillon)
// Permet de sauvegarder les données sans tout compléter
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const { id: dossierId } = await params

    // Verify the dossier belongs to the user
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: dossierId,
        clientId: user.id,
      },
      include: {
        steps: {
          include: { template: true },
        },
      },
    })

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    // Find PROJECT_INFO step
    const projectInfoStep = dossier.steps.find(s => s.template.code === 'PROJECT_INFO')
    if (!projectInfoStep) {
      return NextResponse.json(
        { error: 'Étape des informations projet non trouvée' },
        { status: 400 }
      )
    }

    // Check if step can be edited (DRAFT, REJECTED, or PENDING_REVIEW for modifications)
    if (projectInfoStep.status === 'LOCKED' || projectInfoStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas modifiable' },
        { status: 400 }
      )
    }

    // Also check if APPROVED (admin validated)
    if (dossier.projectInfoStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cette étape a été validée. Veuillez contacter le support pour toute modification.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      energyType,
      housingType,
      housingSurface,
      constructionYear,
      revenueCategory,
      householdSize,
      ownershipStatus,
    } = body

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {
      projectInfoLastSavedAt: new Date(),
    }

    if (energyType !== undefined) updateData.energyType = energyType || null
    if (housingType !== undefined) updateData.housingType = housingType || null
    if (housingSurface !== undefined) {
      updateData.housingSurface = housingSurface ? parseFloat(housingSurface.toString()) : null
    }
    if (constructionYear !== undefined) {
      updateData.constructionYear = constructionYear ? parseInt(constructionYear.toString()) : null
    }
    if (revenueCategory !== undefined) updateData.revenueCategory = revenueCategory || null
    if (householdSize !== undefined) {
      updateData.householdSize = householdSize ? parseInt(householdSize.toString()) : null
    }
    if (ownershipStatus !== undefined) updateData.ownershipStatus = ownershipStatus || null

    // If status is DRAFT, keep it DRAFT (partial save doesn't change status)
    // If status is REJECTED, keep REJECTED until full resubmission
    // If status is PENDING_REVIEW, keep it (user is modifying before admin review)

    // Update the dossier
    const updatedDossier = await prisma.dossier.update({
      where: { id: dossierId },
      data: updateData,
      select: {
        projectInfoLastSavedAt: true,
        energyType: true,
        housingType: true,
        housingSurface: true,
        constructionYear: true,
        revenueCategory: true,
        householdSize: true,
        ownershipStatus: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Informations enregistrées',
      lastSavedAt: updatedDossier.projectInfoLastSavedAt,
      data: updatedDossier,
    })
  } catch (error) {
    console.error('Error saving project info draft:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'enregistrement' },
      { status: 500 }
    )
  }
}
