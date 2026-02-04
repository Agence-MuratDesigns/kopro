import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// PATCH - Change password
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN'])

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validation des champs requis
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur avec son mot de passe
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Le mot de passe actuel est incorrect' },
        { status: 400 }
      )
    }

    // Validation du nouveau mot de passe
    const passwordValidation = {
      minLength: newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    }

    if (!Object.values(passwordValidation).every(Boolean)) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe ne respecte pas les critères de sécurité' },
        { status: 400 }
      )
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await bcrypt.compare(newPassword, currentUser.password)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'ancien' },
        { status: 400 }
      )
    }

    // Hasher et mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        details: 'Mot de passe administrateur modifié',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe' },
      { status: 500 }
    )
  }
}
