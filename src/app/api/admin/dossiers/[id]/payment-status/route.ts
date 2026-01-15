import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { paymentStatus, mprPaidAmount, ceePaidAmount } = body

    // Validate payment status
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'PAID']
    if (paymentStatus && !validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: 'Statut de paiement invalide' },
        { status: 400 }
      )
    }

    // Get dossier
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: { client: true },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Update dossier payment info
    const updatedDossier = await prisma.dossier.update({
      where: { id },
      data: {
        paymentStatus: paymentStatus ?? dossier.paymentStatus,
        mprPaidAmount: mprPaidAmount ?? dossier.mprPaidAmount,
        ceePaidAmount: ceePaidAmount ?? dossier.ceePaidAmount,
      },
    })

    // Create notification for client if payment status changed
    if (paymentStatus && paymentStatus !== dossier.paymentStatus) {
      let notificationMessage = ''
      switch (paymentStatus) {
        case 'IN_PROGRESS':
          notificationMessage = 'Le versement de vos aides est en cours de traitement.'
          break
        case 'PAID':
          notificationMessage = 'Vos aides ont été versées ! Consultez votre récapitulatif pour plus de détails.'
          break
      }

      if (notificationMessage) {
        await prisma.notification.create({
          data: {
            userId: dossier.clientId,
            dossierId: id,
            type: 'DOCUMENT_VALIDATED',
            title: 'Mise à jour du versement',
            message: notificationMessage,
            link: `/dossier/${id}/etape/FINAL_RECAP`,
          },
        })
      }
    }

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: 'PAYMENT_UPDATE',
        details: `Statut de paiement mis à jour: ${paymentStatus || 'montants modifiés'}`,
        userId: session.userId,
        dossierId: id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Statut de paiement mis à jour',
      dossier: updatedDossier,
    })
  } catch (error) {
    console.error('Update payment status error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
