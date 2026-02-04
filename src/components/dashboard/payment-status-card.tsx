'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { CreditCard, CheckCircle, Clock, ArrowRight, AlertCircle } from 'lucide-react'

interface PaymentStatusCardProps {
  dossierId: string
  paymentStatus: string
  paymentAmount: number | null
  paymentCompletedAt: Date | string | null
  currentStepCode?: string
}

export function PaymentStatusCard({
  dossierId,
  paymentStatus,
  paymentAmount,
  paymentCompletedAt,
  currentStepCode,
}: PaymentStatusCardProps) {
  const isPaid = paymentStatus === 'SUCCEEDED'
  const isPending = paymentStatus === 'PENDING' || paymentStatus === 'PROCESSING'
  const isFailed = paymentStatus === 'FAILED'
  const isPaymentStep = currentStepCode === 'PAYMENT'

  const formattedAmount = paymentAmount
    ? formatCurrency(paymentAmount / 100)
    : formatCurrency(290)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Frais de service
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`p-4 rounded-lg ${
            isPaid
              ? 'bg-green-50 border border-green-200'
              : isPending
              ? 'bg-amber-50 border border-amber-200'
              : isFailed
              ? 'bg-red-50 border border-red-200'
              : 'bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isPaid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : isPending ? (
                <Clock className="h-5 w-5 text-amber-600" />
              ) : isFailed ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CreditCard className="h-5 w-5 text-gray-400" />
              )}
              <span
                className={`font-medium ${
                  isPaid
                    ? 'text-green-700'
                    : isPending
                    ? 'text-amber-700'
                    : isFailed
                    ? 'text-red-700'
                    : 'text-gray-600'
                }`}
              >
                {isPaid
                  ? 'Paiement confirmé'
                  : isPending
                  ? 'En attente'
                  : isFailed
                  ? 'Échec du paiement'
                  : 'À payer'}
              </span>
            </div>
            <Badge
              variant={
                isPaid ? 'success' : isPending ? 'warning' : isFailed ? 'error' : 'secondary'
              }
            >
              {formattedAmount}
            </Badge>
          </div>

          {isPaid && paymentCompletedAt && (
            <p className="text-sm text-green-600">
              Payé le {formatDate(paymentCompletedAt)}
            </p>
          )}

          {isFailed && (
            <p className="text-sm text-red-600">
              Le paiement a échoué. Veuillez réessayer.
            </p>
          )}

          {!isPaid && isPaymentStep && (
            <Link href={`/dossier/${dossierId}/etape/PAYMENT`}>
              <Button variant="primary" size="sm" className="w-full mt-3">
                {isFailed ? 'Réessayer le paiement' : 'Procéder au paiement'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
