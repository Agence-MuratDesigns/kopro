export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Only artisans can update company info
    if (user.role !== 'ARTISAN') {
      return NextResponse.json(
        { error: 'Accès réservé aux artisans' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { companyName, siret, companyAddress, companyPostalCode, companyCity, rgeQualifications } = body

    // Validate SIRET format (14 digits)
    if (siret && !/^\d{14}$/.test(siret)) {
      return NextResponse.json(
        { error: 'Le SIRET doit contenir 14 chiffres' },
        { status: 400 }
      )
    }

    // Validate postal code if provided
    if (companyPostalCode && !/^\d{5}$/.test(companyPostalCode)) {
      return NextResponse.json(
        { error: 'Le code postal doit contenir 5 chiffres' },
        { status: 400 }
      )
    }

    // Update user company info
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        companyName: companyName?.trim() || null,
        siret: siret || null,
        companyAddress: companyAddress?.trim() || null,
        companyPostalCode: companyPostalCode || null,
        companyCity: companyCity?.trim() || null,
        rgeQualifications: rgeQualifications || null,
      },
      select: {
        id: true,
        companyName: true,
        siret: true,
        companyAddress: true,
        companyPostalCode: true,
        companyCity: true,
        rgeQualifications: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'COMPANY_INFO_UPDATE',
        details: 'Informations entreprise mises à jour',
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Artisan company update error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des informations entreprise' },
      { status: 500 }
    )
  }
}
