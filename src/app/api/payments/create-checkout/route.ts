export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createPaymentCheckoutSession, PAYMENT_AMOUNT_CENTS, stripe } from '@/lib/stripe'
import { processMockPayment, isStripeConfigured } from '@/lib/payment-mock'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { dossierId } = await request.json()

    if (!dossierId) {
      return NextResponse.json({ error: 'ID du dossier requis' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Verify dossier ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        steps: { include: { template: true } },
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    const isOwner = dossier.clientId === session.userId || dossier.artisanId === session.userId
    if (!isOwner) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Check if payment step is available
    const paymentStep = dossier.steps.find(s => s.template.code === 'PAYMENT')
    if (!paymentStep) {
      return NextResponse.json(
        { error: 'Étape de paiement non trouvée' },
        { status: 400 }
      )
    }

    if (paymentStep.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'L\'étape de paiement n\'est pas encore disponible' },
        { status: 400 }
      )
    }

    if (paymentStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Le paiement a déjà été effectué' },
        { status: 400 }
      )
    }

    // Check if already paid
    if (dossier.servicePaymentStatus === 'SUCCEEDED') {
      return NextResponse.json(
        { error: 'Le paiement a déjà été effectué' },
        { status: 400 }
      )
    }

    // Use mock payment if Stripe is not configured
    if (!isStripeConfigured() || !stripe) {
      try {
        const mockResult = await processMockPayment(dossierId, session.userId)
        return NextResponse.json({
          success: true,
          sessionUrl: mockResult.redirectUrl,
          sessionId: mockResult.paymentId,
          mock: true,
        })
      } catch (mockError) {
        console.error('Error processing mock payment:', mockError)
        return NextResponse.json(
          { error: 'Erreur lors du paiement (mode test)' },
          { status: 500 }
        )
      }
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const stripeSession = await createPaymentCheckoutSession({
      dossierId,
      userId: session.userId,
      userEmail: user.email,
      customerName: `${user.firstName} ${user.lastName}`,
      successUrl: `${baseUrl}/dossier/${dossierId}/etape/PAYMENT?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dossier/${dossierId}/etape/PAYMENT?canceled=true`,
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        dossierId,
        userId: session.userId,
        amount: PAYMENT_AMOUNT_CENTS,
        currency: 'eur',
        status: 'PENDING',
        stripeSessionId: stripeSession.id,
        customerEmail: user.email,
        description: `Frais d'accompagnement KOPRO - Dossier ${dossier.reference}`,
      },
    })

    // Update dossier payment status
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        servicePaymentStatus: 'PENDING',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        dossierId,
        action: 'PAYMENT_INITIATED',
        details: 'Session de paiement Stripe créée',
      },
    })

    return NextResponse.json({
      success: true,
      sessionUrl: stripeSession.url,
      sessionId: stripeSession.id,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}
