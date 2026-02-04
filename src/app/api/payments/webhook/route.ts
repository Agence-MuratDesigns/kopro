import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendEventToUser } from '@/lib/realtime'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !webhookSecret) {
      console.error('Stripe webhook not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = verifyWebhookSignature(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleSuccessfulPayment(session)
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleExpiredSession(session)
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handleFailedPayment(paymentIntent)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { dossierId, userId } = session.metadata || {}

  if (!dossierId) {
    console.error('Missing dossierId in session metadata')
    return
  }

  // Check idempotency - prevent duplicate processing
  const existingPayment = await prisma.payment.findUnique({
    where: { stripeSessionId: session.id },
  })

  if (existingPayment?.status === 'SUCCEEDED') {
    console.log('Payment already processed:', session.id)
    return
  }

  // Get dossier with steps
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      steps: {
        include: { template: true },
        orderBy: { template: { order: 'asc' } },
      },
    },
  })

  if (!dossier) {
    console.error('Dossier not found:', dossierId)
    return
  }

  const paymentStep = dossier.steps.find(s => s.template.code === 'PAYMENT')
  const nextStep = dossier.steps.find(s => s.template.code === 'MANDATE_SIGNATURE')

  await prisma.$transaction(async (tx) => {
    // Update payment record
    if (existingPayment) {
      await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: 'SUCCEEDED',
          stripePaymentId: session.payment_intent as string,
          paidAt: new Date(),
        },
      })
    }

    // Update dossier
    await tx.dossier.update({
      where: { id: dossierId },
      data: {
        servicePaymentStatus: 'SUCCEEDED',
        servicePaymentAmount: session.amount_total,
        servicePaymentCompletedAt: new Date(),
      },
    })

    // Validate payment step
    if (paymentStep) {
      await tx.dossierStep.update({
        where: { id: paymentStep.id },
        data: {
          status: 'VALIDATED',
          validatedAt: new Date(),
        },
      })
    }

    // Unlock next step (MANDATE_SIGNATURE)
    if (nextStep) {
      await tx.dossierStep.update({
        where: { id: nextStep.id },
        data: { status: 'AVAILABLE' },
      })
    }

    // Create notification
    const notifyUserId = dossier.clientId || dossier.artisanId
    if (notifyUserId) {
      await tx.notification.create({
        data: {
          userId: notifyUserId,
          dossierId,
          type: 'PAYMENT_COMPLETED',
          title: 'Paiement confirmé',
          message: 'Votre paiement a été accepté. Vous pouvez maintenant signer le mandat.',
          link: `/dossier/${dossierId}/etape/MANDATE_SIGNATURE`,
        },
      })
    }

    // Log activity
    await tx.activityLog.create({
      data: {
        userId: userId || null,
        dossierId,
        action: 'PAYMENT_COMPLETED',
        details: `Paiement de ${(session.amount_total || 0) / 100} € confirmé`,
      },
    })
  })

  // Send real-time notification
  const notifyUserId = dossier.clientId || dossier.artisanId
  if (notifyUserId) {
    sendEventToUser(notifyUserId, 'payment_completed', {
      dossierId,
      amount: session.amount_total,
      nextStepCode: 'MANDATE_SIGNATURE',
    })
  }

  console.log(`Payment completed for dossier ${dossierId}`)
}

async function handleExpiredSession(session: Stripe.Checkout.Session) {
  const { dossierId } = session.metadata || {}
  if (!dossierId) return

  await prisma.payment.updateMany({
    where: { stripeSessionId: session.id },
    data: { status: 'FAILED', errorMessage: 'Session expirée' },
  })

  await prisma.dossier.update({
    where: { id: dossierId },
    data: { servicePaymentStatus: 'DRAFT' },
  })

  console.log(`Session expired for dossier ${dossierId}`)
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentId: paymentIntent.id },
  })

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage: paymentIntent.last_payment_error?.message || 'Paiement refusé',
      },
    })

    await prisma.dossier.update({
      where: { id: payment.dossierId },
      data: { servicePaymentStatus: 'FAILED' },
    })

    // Create notification
    const dossier = await prisma.dossier.findUnique({
      where: { id: payment.dossierId },
    })

    const notifyUserId = dossier?.clientId || dossier?.artisanId
    if (notifyUserId) {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          dossierId: payment.dossierId,
          type: 'PAYMENT_FAILED',
          title: 'Échec du paiement',
          message: 'Votre paiement a échoué. Veuillez réessayer.',
          link: `/dossier/${payment.dossierId}/etape/PAYMENT`,
        },
      })
    }

    console.log(`Payment failed for dossier ${payment.dossierId}`)
  }
}
