import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    // Verify the dossier belongs to the user
    const dossier = await prisma.dossier.findFirst({
      where: {
        id,
        clientId: user.id,
      },
    })

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossier non trouvé' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      projectType,
      projectAddress,
      projectCity,
      projectPostalCode,
      estimatedBudget,
      revenueCategory,
      householdSize,
    } = body

    // Validate postal code format if provided
    if (projectPostalCode && !/^\d{5}$/.test(projectPostalCode)) {
      return NextResponse.json(
        { error: 'Le code postal doit contenir 5 chiffres' },
        { status: 400 }
      )
    }

    // Update the dossier
    const updatedDossier = await prisma.dossier.update({
      where: { id },
      data: {
        projectType,
        projectAddress,
        projectCity,
        projectPostalCode,
        estimatedBudget,
        revenueCategory,
        householdSize,
      },
    })

    return NextResponse.json({
      success: true,
      dossier: updatedDossier,
    })
  } catch (error) {
    console.error('Error updating project info:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
