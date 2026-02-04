import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'

// PATCH - Update notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN'])

    const body = await request.json()
    const { emailNotifications, pushNotifications, preferredChannel } = body

    // Validation du canal préféré
    const validChannels = ['INTERFACE', 'EMAIL', 'BOTH']
    if (preferredChannel && !validChannels.includes(preferredChannel)) {
      return NextResponse.json(
        { error: 'Canal de notification invalide' },
        { status: 400 }
      )
    }

    // Mise à jour des préférences
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? true,
        preferredChannel: preferredChannel || 'BOTH',
      },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        preferredChannel: true,
      },
    })

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'NOTIFICATION_SETTINGS_UPDATED',
        details: 'Préférences de notification mises à jour',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Préférences de notification mises à jour',
      settings: updatedUser,
    })
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des préférences' },
      { status: 500 }
    )
  }
}
