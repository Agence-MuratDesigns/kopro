import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { sendEventToUser } from '@/lib/realtime'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Récupérer les infos projet (admin)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    await requireRole(['ADMIN'])

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      select: {
        id: true,
        clientId: true,
        projectInfoStatus: true,
        projectInfoSubmittedAt: true,
        projectInfoReviewedAt: true,
        projectInfoReviewMessage: true,
        energyType: true,
        housingType: true,
        housingSurface: true,
        constructionYear: true,
        ownershipStatus: true,
        revenueCategory: true,
        householdSize: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    return NextResponse.json(dossier)
  } catch (error) {
    console.error('Error fetching project info (admin):', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

// PATCH - Modifier les infos projet (admin)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const admin = await requireRole(['ADMIN'])
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

    // Get dossier
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: { client: true },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {}
    if (energyType !== undefined) updateData.energyType = energyType
    if (housingType !== undefined) updateData.housingType = housingType
    if (housingSurface !== undefined) updateData.housingSurface = parseFloat(housingSurface.toString())
    if (constructionYear !== undefined) updateData.constructionYear = parseInt(constructionYear.toString())
    if (revenueCategory !== undefined) updateData.revenueCategory = revenueCategory
    if (householdSize !== undefined) updateData.householdSize = parseInt(householdSize.toString())
    if (ownershipStatus !== undefined) updateData.ownershipStatus = ownershipStatus

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucun champ à mettre à jour' },
        { status: 400 }
      )
    }

    const notifyUserId = dossier.clientId || dossier.artisanId

    await prisma.$transaction(async (tx) => {
      // Update dossier
      await tx.dossier.update({
        where: { id: dossierId },
        data: updateData,
      })

      // Client notification (only if there's a user to notify)
      if (notifyUserId) {
        await tx.notification.create({
          data: {
            userId: notifyUserId,
            dossierId,
            type: 'PROJECT_INFO_UPDATED',
            title: 'Informations mises à jour',
            message: 'Vos informations projet ont été mises à jour par l\'équipe KOPRO.',
            link: `/dossier/${dossierId}/etape/PROJECT_INFO`,
          },
        })
      }

      // Log activity with details of what changed
      const changedFields = Object.keys(updateData).join(', ')
      await tx.activityLog.create({
        data: {
          userId: admin.id,
          dossierId,
          action: 'PROJECT_INFO_UPDATED_BY_ADMIN',
          details: `Informations projet modifiées par ${admin.firstName} ${admin.lastName}: ${changedFields}`,
        },
      })
    })

    // Real-time notification to client (only if there's a user to notify)
    if (notifyUserId) {
      sendEventToUser(notifyUserId, 'notification', {
        type: 'PROJECT_INFO_UPDATED',
        dossierId,
        message: 'Vos informations projet ont été mises à jour',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Informations projet mises à jour',
    })
  } catch (error) {
    console.error('Error updating project info (admin):', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}
