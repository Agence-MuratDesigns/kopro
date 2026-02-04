export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { NAME_REGEX } from '@/lib/utils'

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, phone, address, addressComplement, postalCode, city } = body

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: 'Le prénom et le nom sont obligatoires' },
        { status: 400 }
      )
    }

    // Validate name format
    if (!NAME_REGEX.test(firstName.trim()) || !NAME_REGEX.test(lastName.trim())) {
      return NextResponse.json(
        { error: 'Le prénom et le nom doivent contenir entre 2 et 50 caractères (lettres, accents, tirets, apostrophes)' },
        { status: 400 }
      )
    }

    // Validate postal code if provided
    if (postalCode && !/^\d{5}$/.test(postalCode)) {
      return NextResponse.json(
        { error: 'Le code postal doit contenir 5 chiffres' },
        { status: 400 }
      )
    }

    // Validate phone format if provided
    const cleanPhone = phone?.replace(/\s/g, '')
    if (cleanPhone && !/^(?:(?:\+33|0033|0)[1-9](?:[0-9]{8}))$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Le numéro de téléphone n\'est pas valide' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone || null,
        address: address?.trim() || null,
        addressComplement: addressComplement?.trim() || null,
        postalCode: postalCode || null,
        city: city?.trim() || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        addressComplement: true,
        postalCode: true,
        city: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PROFILE_UPDATE',
        details: 'Profil mis à jour',
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}
