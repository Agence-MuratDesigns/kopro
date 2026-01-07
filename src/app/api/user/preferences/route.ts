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

    const body = await request.json()
    const { soundEnabled, emailNotifications, pushNotifications, preferredChannel } = body

    // Validate preferredChannel
    if (preferredChannel && !['INTERFACE', 'EMAIL', 'BOTH'].includes(preferredChannel)) {
      return NextResponse.json(
        { error: 'Canal préféré invalide' },
        { status: 400 }
      )
    }

    // Update user preferences
    await prisma.user.update({
      where: { id: user.id },
      data: {
        soundEnabled: soundEnabled ?? true,
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? true,
        preferredChannel: preferredChannel || 'BOTH',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PREFERENCES_UPDATE',
        details: 'Préférences mises à jour',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Preferences] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des préférences' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        soundEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        preferredChannel: true,
      },
    })

    return NextResponse.json(userData)
  } catch (error) {
    console.error('[Preferences GET] Error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
