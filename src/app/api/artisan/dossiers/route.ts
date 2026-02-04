export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// GET - List all dossiers managed by the artisan
export async function GET() {
  try {
    const user = await requireRole(['ARTISAN'])

    const dossiers = await prisma.dossier.findMany({
      where: { artisanId: user.id },
      select: {
        id: true,
        reference: true,
        status: true,
        currentStep: true,
        isActive: true,
        endClientFirstName: true,
        endClientLastName: true,
        endClientEmail: true,
        endClientPhone: true,
        endClientAddress: true,
        endClientPostalCode: true,
        endClientCity: true,
        projectType: true,
        projectAddress: true,
        projectCity: true,
        mprId: true,
        mprStatus: true,
        mprAmount: true,
        ceeAmount: true,
        totalWorksAmount: true,
        createdAt: true,
        updatedAt: true,
        steps: {
          select: {
            id: true,
            status: true,
            template: {
              select: {
                code: true,
                name: true,
                order: true,
              },
            },
          },
          orderBy: {
            template: {
              order: 'asc',
            },
          },
        },
        _count: {
          select: {
            documents: true,
            messages: { where: { isRead: false, messageType: 'ADMIN' } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Transform data to include calculated fields
    const transformedDossiers = dossiers.map((dossier) => {
      const validatedSteps = dossier.steps.filter(
        (s) => s.status === 'VALIDATED'
      ).length
      const totalSteps = dossier.steps.length
      const progress =
        totalSteps > 0 ? Math.round((validatedSteps / totalSteps) * 100) : 0

      const currentStepInfo = dossier.steps.find(
        (s) =>
          s.status === 'AVAILABLE' ||
          s.status === 'IN_PROGRESS' ||
          s.status === 'PENDING_VALIDATION'
      )

      return {
        ...dossier,
        progress,
        validatedSteps,
        totalSteps,
        currentStepName: currentStepInfo?.template.name || null,
        unreadMessages: dossier._count.messages,
        documentsCount: dossier._count.documents,
      }
    })

    return NextResponse.json({ dossiers: transformedDossiers })
  } catch (error) {
    console.error('Error fetching artisan dossiers:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des dossiers' },
      { status: 500 }
    )
  }
}

// POST - Create new dossier for a client
export async function POST(request: NextRequest) {
  try {
    const artisan = await requireRole(['ARTISAN'])

    const body = await request.json()
    const {
      // Client info (required)
      endClientFirstName,
      endClientLastName,
      endClientAddress,
      endClientPostalCode,
      endClientCity,
      // Client info (optional)
      endClientEmail,
      endClientPhone,
      // Project info (optional)
      projectType,
      housingType,
      housingSurface,
      energyType,
      revenueCategory,
      selectedWorks,
      estimatedBudget,
    } = body

    // Validation - required client fields
    if (
      !endClientFirstName ||
      !endClientLastName ||
      !endClientAddress ||
      !endClientPostalCode ||
      !endClientCity
    ) {
      return NextResponse.json(
        { error: 'Les informations du client sont obligatoires (nom, prénom, adresse)' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (endClientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(endClientEmail)) {
        return NextResponse.json(
          { error: 'Adresse email client invalide' },
          { status: 400 }
        )
      }
    }

    // Generate reference
    const year = new Date().getFullYear()
    const count = await prisma.dossier.count({
      where: {
        reference: {
          startsWith: `KPR-${year}`,
        },
      },
    })
    const reference = `KPR-${year}-${String(count + 1).padStart(4, '0')}`

    // Create dossier in transaction
    const dossier = await prisma.$transaction(async (tx) => {
      // Create dossier (no clientId since client has no account)
      const newDossier = await tx.dossier.create({
        data: {
          reference,
          artisanId: artisan.id,
          clientId: null, // Client has no account
          status: 'EN_COURS',
          currentStep: 2,
          mprStatus: 'DRAFT',
          // Client info
          endClientFirstName,
          endClientLastName,
          endClientEmail: endClientEmail || null,
          endClientPhone: endClientPhone || null,
          endClientAddress,
          endClientPostalCode,
          endClientCity,
          // Project info
          projectType: projectType || null,
          projectAddress: endClientAddress,
          projectCity: endClientCity,
          projectPostalCode: endClientPostalCode,
          housingType: housingType || null,
          housingSurface: housingSurface ? parseFloat(housingSurface) : null,
          energyType: energyType || null,
          revenueCategory: revenueCategory || null,
          selectedWorks: selectedWorks ? JSON.stringify(selectedWorks) : null,
          estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        },
      })

      // Get step templates
      const templates = await tx.stepTemplate.findMany({
        orderBy: { order: 'asc' },
      })

      // Create dossier steps
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i]
        let status = 'LOCKED'

        if (i === 0) {
          // Step 1 (Création) - automatically validated since artisan created it
          status = 'VALIDATED'
        } else if (i === 1) {
          // Step 2 (Identifiant MPR) - available for artisan to fill
          status = 'AVAILABLE'
        }

        await tx.dossierStep.create({
          data: {
            dossierId: newDossier.id,
            templateId: template.id,
            status,
            validatedAt: status === 'VALIDATED' ? new Date() : null,
            validatedBy: status === 'VALIDATED' ? artisan.id : null,
          },
        })
      }

      // Notify artisan
      await tx.notification.create({
        data: {
          userId: artisan.id,
          dossierId: newDossier.id,
          type: 'DOSSIER_CREATED',
          title: 'Nouveau dossier créé',
          message: `Le dossier ${reference} pour ${endClientFirstName} ${endClientLastName} a été créé.`,
          link: `/dossier/${newDossier.id}`,
        },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: artisan.id,
          dossierId: newDossier.id,
          action: 'ARTISAN_DOSSIER_CREATED',
          details: `Dossier créé par artisan pour ${endClientFirstName} ${endClientLastName}`,
        },
      })

      return newDossier
    })

    return NextResponse.json({
      success: true,
      message: 'Dossier créé avec succès',
      dossier: {
        id: dossier.id,
        reference: dossier.reference,
        endClientFirstName: dossier.endClientFirstName,
        endClientLastName: dossier.endClientLastName,
      },
    })
  } catch (error) {
    console.error('Error creating artisan dossier:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du dossier' },
      { status: 500 }
    )
  }
}
