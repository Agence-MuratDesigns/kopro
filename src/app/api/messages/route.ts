import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { sendEventToUser } from '@/app/api/realtime/events/route'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const dossierId = searchParams.get('dossierId')
    const since = searchParams.get('since')

    if (!dossierId) {
      return NextResponse.json({ error: 'dossierId requis' }, { status: 400 })
    }

    // Verify user owns this dossier
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, clientId: user.id },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    const whereClause: any = { dossierId }
    if (since) {
      whereClause.createdAt = { gt: new Date(since) }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('[Messages GET] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { content, dossierId } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    if (!dossierId) {
      return NextResponse.json({ error: 'dossierId requis' }, { status: 400 })
    }

    // Verify user owns this dossier
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, clientId: user.id },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        messageType: 'CLIENT',
        senderId: user.id,
        dossierId,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    })

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'ADVISOR'] } },
      select: { id: true },
    })

    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'NEW_MESSAGE',
        title: 'Nouveau message',
        message: `Message de ${user.firstName} ${user.lastName}`,
        link: `/admin/messages?dossier=${dossierId}`,
        dossierId,
      })),
    })

    // Send realtime event to admins
    admins.forEach(admin => {
      sendEventToUser(admin.id, 'message', {
        dossierId,
        message,
      })
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        dossierId,
        action: 'MESSAGE_SENT',
        details: 'Message envoyé',
      },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('[Messages POST] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
