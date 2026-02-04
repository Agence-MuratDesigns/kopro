import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// GET - Get current admin profile
export async function GET() {
  try {
    const user = await requireRole(['ADMIN'])

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        emailNotifications: true,
        pushNotifications: true,
        preferredChannel: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

// PATCH - Update admin profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN'])

    const body = await request.json()
    const { firstName, lastName, email, phone } = body

    // Validation du prénom/nom
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/
    if (firstName && !nameRegex.test(firstName.trim())) {
      return NextResponse.json(
        { error: 'Le prénom doit contenir entre 2 et 50 caractères' },
        { status: 400 }
      )
    }
    if (lastName && !nameRegex.test(lastName.trim())) {
      return NextResponse.json(
        { error: 'Le nom doit contenir entre 2 et 50 caractères' },
        { status: 400 }
      )
    }

    // Validation de l'email
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim().toLowerCase())) {
        return NextResponse.json(
          { error: 'Adresse email invalide' },
          { status: 400 }
        )
      }

      // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          id: { not: user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà utilisée' },
          { status: 400 }
        )
      }
    }

    // Mise à jour du profil
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        phone: phone?.trim() || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PROFILE_UPDATE',
        details: 'Profil administrateur mis à jour',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      profile: updatedProfile,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}
