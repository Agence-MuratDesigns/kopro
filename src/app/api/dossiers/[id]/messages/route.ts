import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyAdminsOfClientAction, sendEventToUser } from '@/lib/realtime'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    // Get dossier
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        client: { select: { id: true } },
        advisor: { select: { id: true } },
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Verify user has access
    const isClient = session.userId === dossier.clientId
    const isAdvisor = session.role === 'ADMIN'

    if (!isClient && !isAdvisor) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: body.content.trim(),
        senderId: session.userId,
        dossierId: id,
        messageType: isClient ? 'CLIENT' : 'ADMIN',
      },
    })

    // Notify recipient
    if (isClient) {
      // Notify admins/advisors
      const staff = await prisma.user.findMany({
        where: { role: { in: ['ADMIN'] } },
      })

      for (const admin of staff) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            dossierId: id,
            type: 'MESSAGE_RECEIVED',
            title: 'Nouveau message client',
            message: `Nouveau message sur le dossier ${dossier.reference}`,
            link: `/admin/messages?dossier=${id}`,
          },
        })
      }
    } else {
      // Notify client
      await prisma.notification.create({
        data: {
          userId: dossier.clientId,
          dossierId: id,
          type: 'MESSAGE_RECEIVED',
          title: 'Nouveau message de KOPRO',
          message: 'Vous avez reçu un nouveau message de votre conseiller.',
          link: `/messages?dossier=${id}`,
        },
      })
    }

    // Real-time notification
    if (isClient) {
      // Get client name for notification
      const client = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { firstName: true, lastName: true },
      })
      notifyAdminsOfClientAction('message', {
        dossierId: id,
        clientName: client ? `${client.firstName} ${client.lastName}` : 'Client',
        message: `Nouveau message sur le dossier ${dossier.reference}`,
      })
    } else {
      // Notify client in real-time
      sendEventToUser(dossier.clientId, 'message', {
        dossierId: id,
        message: 'Nouveau message de votre conseiller',
      })
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
