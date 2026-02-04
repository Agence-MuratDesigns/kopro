export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// GET - Get artisan details with their dossiers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN'])
    const { id } = await params

    const artisan = await prisma.user.findUnique({
      where: { id, role: 'ARTISAN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        siret: true,
        companyAddress: true,
        companyPostalCode: true,
        companyCity: true,
        rgeQualifications: true,
        isActive: true,
        createdAt: true,
        firstLoginAt: true,
        lastLoginAt: true,
        managedDossiers: {
          select: {
            id: true,
            reference: true,
            status: true,
            currentStep: true,
            endClientFirstName: true,
            endClientLastName: true,
            endClientCity: true,
            projectType: true,
            createdAt: true,
            updatedAt: true,
            mprStatus: true,
            steps: {
              select: {
                id: true,
                status: true,
                template: {
                  select: {
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
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!artisan) {
      return NextResponse.json(
        { error: 'Artisan non trouvé' },
        { status: 404 }
      )
    }

    // Transform data
    const transformedArtisan = {
      ...artisan,
      rgeQualifications: artisan.rgeQualifications
        ? JSON.parse(artisan.rgeQualifications)
        : [],
      dossiersCount: artisan.managedDossiers.length,
    }

    return NextResponse.json({ artisan: transformedArtisan })
  } catch (error) {
    console.error('Error fetching artisan:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'artisan' },
      { status: 500 }
    )
  }
}

// PATCH - Update artisan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(['ADMIN'])
    const { id } = await params
    const body = await request.json()

    const {
      firstName,
      lastName,
      phone,
      companyName,
      siret,
      companyAddress,
      companyPostalCode,
      companyCity,
      rgeQualifications,
      isActive,
    } = body

    // Check if artisan exists
    const existingArtisan = await prisma.user.findUnique({
      where: { id, role: 'ARTISAN' },
    })

    if (!existingArtisan) {
      return NextResponse.json(
        { error: 'Artisan non trouvé' },
        { status: 404 }
      )
    }

    // Validate SIRET if changed
    if (siret && siret !== existingArtisan.siret) {
      const siretRegex = /^\d{14}$/
      if (!siretRegex.test(siret)) {
        return NextResponse.json(
          { error: 'Le numéro SIRET doit contenir exactement 14 chiffres' },
          { status: 400 }
        )
      }

      // Check if new SIRET already exists
      const existingSiret = await prisma.user.findFirst({
        where: { siret, NOT: { id } },
      })

      if (existingSiret) {
        return NextResponse.json(
          { error: 'Ce numéro SIRET est déjà enregistré' },
          { status: 400 }
        )
      }
    }

    // Update artisan
    const updatedArtisan = await prisma.$transaction(async (tx) => {
      const artisan = await tx.user.update({
        where: { id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(companyName && { companyName }),
          ...(siret && { siret }),
          ...(companyAddress && { companyAddress }),
          ...(companyPostalCode && { companyPostalCode }),
          ...(companyCity && { companyCity }),
          ...(rgeQualifications !== undefined && {
            rgeQualifications: rgeQualifications
              ? JSON.stringify(rgeQualifications)
              : null,
          }),
          ...(typeof isActive === 'boolean' && { isActive }),
        },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: admin.id,
          action: 'ARTISAN_UPDATED',
          details: `Compte artisan ${artisan.companyName} mis à jour`,
        },
      })

      return artisan
    })

    return NextResponse.json({
      success: true,
      message: 'Artisan mis à jour avec succès',
      artisan: {
        id: updatedArtisan.id,
        email: updatedArtisan.email,
        companyName: updatedArtisan.companyName,
        isActive: updatedArtisan.isActive,
      },
    })
  } catch (error) {
    console.error('Error updating artisan:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'artisan' },
      { status: 500 }
    )
  }
}

// DELETE - Disable artisan account (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(['ADMIN'])
    const { id } = await params

    // Check if artisan exists
    const existingArtisan = await prisma.user.findUnique({
      where: { id, role: 'ARTISAN' },
      include: {
        _count: {
          select: { managedDossiers: true },
        },
      },
    })

    if (!existingArtisan) {
      return NextResponse.json(
        { error: 'Artisan non trouvé' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { isActive: false },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: admin.id,
          action: 'ARTISAN_DISABLED',
          details: `Compte artisan ${existingArtisan.companyName} désactivé (${existingArtisan._count.managedDossiers} dossiers)`,
        },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Compte artisan désactivé avec succès',
    })
  } catch (error) {
    console.error('Error disabling artisan:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la désactivation de l\'artisan' },
      { status: 500 }
    )
  }
}
