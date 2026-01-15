import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { newEmail, password } = await request.json()

    if (!newEmail || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Get current user with password
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, email: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, currentUser.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Check if email is already taken
    const emailExists = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
    })

    if (emailExists && emailExists.id !== user.id) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà utilisée' },
        { status: 400 }
      )
    }

    // Update email
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail.toLowerCase() },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_CHANGED',
        details: `Email modifié de ${currentUser.email} vers ${newEmail}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating email:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
