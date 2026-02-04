'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Shield,
  Lock,
  ArrowRight,
  Info,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'

interface PaymentFormProps {
  dossierId: string
  paymentStatus: string
  paymentAmount: number | null
  paymentCompletedAt: string | null
}

export function PaymentForm({
  dossierId,
  paymentStatus,
  paymentAmount,
  paymentCompletedAt,
}: PaymentFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [isPolling, setIsPolling] = useState(false)

  // Check URL params for success/cancel
  const successParam = searchParams.get('success')
  const canceledParam = searchParams.get('canceled')

  // Poll payment status after successful redirect from Stripe
  const pollPaymentStatus = useCallback(async () => {
    setIsPolling(true)
    let attempts = 0
    const maxAttempts = 10

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status?dossierId=${dossierId}`)
        const data = await response.json()

        if (data.paymentStatus === 'SUCCEEDED') {
          router.refresh()
          setIsPolling(false)
          return true
        }
      } catch (err) {
        console.error('Error polling status:', err)
      }

      attempts++
      if (attempts < maxAttempts) {
        setTimeout(checkStatus, 2000)
      } else {
        setIsPolling(false)
        router.refresh()
      }
      return false
    }

    checkStatus()
  }, [dossierId, router])

  useEffect(() => {
    if (successParam === 'true' && paymentStatus !== 'SUCCEEDED') {
      pollPaymentStatus()
    }
  }, [successParam, paymentStatus, pollPaymentStatus])

  const handlePayment = async () => {
    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dossierId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la création du paiement')
        return
      }

      // Redirect to Stripe Checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusDisplay = () => {
    switch (paymentStatus) {
      case 'PENDING':
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          badge: <Badge variant="warning">Paiement en attente</Badge>,
          message: 'Un paiement est en cours. Veuillez finaliser votre paiement ou réessayer.',
          canPay: true,
        }
      case 'SUCCEEDED':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: <Badge variant="success">Payé</Badge>,
          message: 'Votre paiement a été confirmé. Vous pouvez passer à l\'étape suivante.',
          canPay: false,
        }
      case 'FAILED':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          badge: <Badge variant="error">Échec</Badge>,
          message: 'Votre paiement a échoué. Veuillez réessayer.',
          canPay: true,
        }
      default:
        return {
          icon: <CreditCard className="h-5 w-5 text-gray-400" />,
          badge: <Badge variant="secondary">Non payé</Badge>,
          message: null,
          canPay: true,
        }
    }
  }

  const statusDisplay = getStatusDisplay()
  const formattedAmount = paymentAmount ? (paymentAmount / 100).toFixed(0) : '290'
  const formattedDate = paymentCompletedAt
    ? new Date(paymentCompletedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  // Show polling state
  if (isPolling || (successParam === 'true' && paymentStatus !== 'SUCCEEDED')) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmation du paiement en cours...
            </h3>
            <p className="text-gray-600">
              Veuillez patienter pendant que nous vérifions votre paiement.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show canceled message
  if (canceledParam === 'true' && paymentStatus !== 'SUCCEEDED') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle>Paiement annulé</CardTitle>
                <CardDescription>
                  Vous avez annulé le paiement
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="warning" title="Paiement non finalisé">
            Le paiement a été annulé. Vous pouvez réessayer à tout moment.
          </Alert>

          <Button onClick={() => router.push(`/dossier/${dossierId}/etape/PAYMENT`)} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer le paiement
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusDisplay.icon}
            <div>
              <CardTitle>Paiement des frais de dossier</CardTitle>
              <CardDescription>
                Frais d'accompagnement KOPRO pour votre dossier MaPrimeRénov'
              </CardDescription>
            </div>
          </div>
          {statusDisplay.badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Message */}
        {statusDisplay.message && (
          <Alert
            variant={
              paymentStatus === 'SUCCEEDED' ? 'success' : paymentStatus === 'FAILED' ? 'error' : 'info'
            }
            title={
              paymentStatus === 'SUCCEEDED'
                ? 'Paiement confirmé'
                : paymentStatus === 'FAILED'
                ? 'Échec du paiement'
                : 'Information'
            }
          >
            {statusDisplay.message}
          </Alert>
        )}

        {/* Payment Success Details */}
        {paymentStatus === 'SUCCEEDED' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 mb-2">
                  Paiement de {formattedAmount} € confirmé
                </p>
                {formattedDate && (
                  <p className="text-sm text-green-700">
                    Effectué le {formattedDate}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-green-300 text-green-700 hover:bg-green-100"
                  onClick={() => router.push(`/dossier/${dossierId}/etape/MANDATE_SIGNATURE`)}
                >
                  Continuer vers la signature du mandat
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {statusDisplay.canPay && (
          <>
            {error && (
              <Alert variant="error" title="Erreur">
                {error}
              </Alert>
            )}

            {/* Amount Display */}
            <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl">
              <div className="text-center">
                <p className="text-sm text-primary-600 font-medium mb-2">Montant à régler</p>
                <p className="text-4xl font-bold text-primary-700">{formattedAmount} €</p>
                <p className="text-sm text-primary-600 mt-2">Paiement unique</p>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Ce qui est inclus :</h4>
              <ul className="space-y-2">
                {[
                  'Accompagnement complet de votre dossier MaPrimeRénov\'',
                  'Vérification de tous vos documents',
                  'Suivi personnalisé par nos experts',
                  'Assistance jusqu\'à l\'obtention des aides',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-6 py-4 border-t border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="h-4 w-4" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Cryptage SSL</span>
              </div>
            </div>

            {/* Information */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Paiement sécurisé via Stripe</p>
                  <p>
                    Vous serez redirigé vers la page de paiement sécurisée Stripe.
                    Vos informations bancaires ne sont jamais stockées sur nos serveurs.
                  </p>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-6 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Redirection vers Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payer {formattedAmount} € par carte
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
