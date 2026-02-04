import Stripe from 'stripe'

// Stripe client singleton
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not defined - Stripe features will be disabled')
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null

// Constants
export const PAYMENT_AMOUNT_CENTS = 29000 // 290 EUR
export const PAYMENT_CURRENCY = 'eur'
export const PAYMENT_DESCRIPTION = "Frais d'accompagnement KOPRO - Dossier MaPrimeRénov'"

// Helper to create checkout session
export async function createPaymentCheckoutSession(params: {
  dossierId: string
  userId: string
  userEmail: string
  customerName: string
  successUrl: string
  cancelUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: params.userEmail,
    line_items: [
      {
        price_data: {
          currency: PAYMENT_CURRENCY,
          product_data: {
            name: "Frais d'accompagnement KOPRO",
            description: `Accompagnement dossier MaPrimeRénov' - ${params.customerName}`,
          },
          unit_amount: PAYMENT_AMOUNT_CENTS,
        },
        quantity: 1,
      },
    ],
    metadata: {
      dossierId: params.dossierId,
      userId: params.userId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    locale: 'fr',
  })

  return session
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
