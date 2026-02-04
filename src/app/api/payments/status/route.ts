import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dossierId = searchParams.get('dossierId')

    if (!dossierId) {
      return NextResponse.json({ error: 'ID du dossier requis' }, { status: 400 })
    }

    // Verify dossier ownership or admin access
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      select: {
        id: true,
        clientId: true,
        artisanId: true,
        servicePaymentStatus: true,
        servicePaymentAmount: true,
        servicePaymentCompletedAt: true,
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check access rights
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    })

    const isOwner = dossier.clientId === session.userId || dossier.artisanId === session.userId
    const isAdmin = user?.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Get latest payment record if exists
    const payment = await prisma.payment.findFirst({
      where: { dossierId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        amount: true,
        paidAt: true,
        failedAt: true,
        errorMessage: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      paymentStatus: dossier.servicePaymentStatus,
      paymentAmount: dossier.servicePaymentAmount,
      paymentCompletedAt: dossier.servicePaymentCompletedAt,
      latestPayment: payment,
    })
  } catch (error) {
    console.error('Error fetching payment status:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du statut' },
      { status: 500 }
    )
  }
}
