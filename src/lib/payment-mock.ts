import { prisma } from '@/lib/prisma'

const MOCK_PAYMENT_AMOUNT = 29000 // 290 EUR in cents

interface MockPaymentResult {
  success: boolean
  paymentId: string
  redirectUrl: string
}

/**
 * Process a mock payment without Stripe
 * This simulates a successful payment for testing purposes
 */
export async function processMockPayment(
  dossierId: string,
  userId: string
): Promise<MockPaymentResult> {
  const result = await prisma.$transaction(async (tx) => {
    // Get dossier with steps
    const dossier = await tx.dossier.findUnique({
      where: { id: dossierId },
      include: {
        steps: {
          include: { template: true },
          orderBy: { template: { order: 'asc' } },
        },
      },
    })

    if (!dossier) {
      throw new Error('Dossier not found')
    }

    // Find PAYMENT and MANDATE_SIGNATURE steps
    const paymentStep = dossier.steps.find(s => s.template.code === 'PAYMENT')
    const mandateStep = dossier.steps.find(s => s.template.code === 'MANDATE_SIGNATURE')

    if (!paymentStep) {
      throw new Error('Payment step not found')
    }

    // Create mock payment record
    const payment = await tx.payment.create({
      data: {
        dossierId,
        userId,
        amount: MOCK_PAYMENT_AMOUNT,
        currency: 'eur',
        status: 'SUCCEEDED',
        stripeSessionId: `mock_session_${Date.now()}`,
        stripePaymentId: `mock_payment_${Date.now()}`,
        description: "Frais d'accompagnement KOPRO - Dossier MaPrimeRénov' (Mock)",
        paidAt: new Date(),
      },
    })

    // Update dossier payment status
    await tx.dossier.update({
      where: { id: dossierId },
      data: {
        servicePaymentStatus: 'SUCCEEDED',
        servicePaymentAmount: MOCK_PAYMENT_AMOUNT,
        servicePaymentCompletedAt: new Date(),
      },
    })

    // Validate PAYMENT step
    await tx.dossierStep.update({
      where: { id: paymentStep.id },
      data: {
        status: 'VALIDATED',
        validatedAt: new Date(),
      },
    })

    // Unlock MANDATE_SIGNATURE step
    if (mandateStep) {
      await tx.dossierStep.update({
        where: { id: mandateStep.id },
        data: { status: 'AVAILABLE' },
      })
    }

    // Get the user to notify (client or artisan)
    const notifyUserId = dossier.clientId || dossier.artisanId

    // Create notification for user
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
        userId,
        dossierId,
        action: 'PAYMENT_COMPLETED',
        details: `Paiement de ${MOCK_PAYMENT_AMOUNT / 100} EUR effectué (mode test)`,
      },
    })

    return payment
  })

  return {
    success: true,
    paymentId: result.id,
    redirectUrl: `/dossier/${dossierId}/etape/PAYMENT?success=true`,
  }
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY
  return Boolean(key && key !== 'mock' && key.startsWith('sk_'))
}
