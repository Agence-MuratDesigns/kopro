import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

const subjectLabels: Record<string, string> = {
  GENERAL: 'Question générale',
  DOSSIER: 'Mon dossier en cours',
  DOCUMENTS: 'Documents à fournir',
  AIDES: 'Aides financières',
  TRAVAUX: 'Travaux et artisans',
  TECHNIQUE: 'Problème technique',
  OTHER: 'Autre',
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { subject, message, dossierId } = body

    // Validate subject
    if (!subject || !subjectLabels[subject]) {
      return NextResponse.json(
        { error: 'Veuillez sélectionner un sujet valide' },
        { status: 400 }
      )
    }

    // Validate message
    if (!message?.trim() || message.length < 10) {
      return NextResponse.json(
        { error: 'Votre message doit contenir au moins 10 caractères' },
        { status: 400 }
      )
    }

    // If dossierId provided, verify user owns it
    let targetDossierId = dossierId
    if (dossierId) {
      const dossier = await prisma.dossier.findFirst({
        where: { id: dossierId, clientId: user.id },
      })
      if (!dossier) {
        targetDossierId = null
      }
    }

    // If no dossierId, find user's first dossier
    if (!targetDossierId) {
      const firstDossier = await prisma.dossier.findFirst({
        where: { clientId: user.id },
        select: { id: true },
      })
      targetDossierId = firstDossier?.id
    }

    // If still no dossier, can't create message
    if (!targetDossierId) {
      return NextResponse.json(
        { error: 'Aucun dossier trouvé pour envoyer le message' },
        { status: 400 }
      )
    }

    // Create message with subject prefix
    const formattedMessage = `[${subjectLabels[subject]}]\n\n${message.trim()}`

    const newMessage = await prisma.message.create({
      data: {
        content: formattedMessage,
        messageType: 'CLIENT',
        senderId: user.id,
        dossierId: targetDossierId,
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
        type: 'SUPPORT_REQUEST',
        title: 'Nouvelle demande de support',
        message: `${user.firstName} ${user.lastName} - ${subjectLabels[subject]}`,
        link: `/admin/messages?dossier=${targetDossierId}`,
        dossierId: targetDossierId,
      })),
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        dossierId: targetDossierId,
        action: 'SUPPORT_REQUEST',
        details: `Demande de support: ${subjectLabels[subject]}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: newMessage,
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    )
  }
}
