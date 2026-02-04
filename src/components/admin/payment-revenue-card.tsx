'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface RecentPayment {
  amount: number
  paidAt: Date | string | null
  dossier: { reference: string }
}

interface PaymentRevenueCardProps {
  totalRevenue: number
  totalPayments: number
  pendingPayments: number
  recentPayments: RecentPayment[]
}

export function PaymentRevenueCard({
  totalRevenue,
  totalPayments,
  pendingPayments,
  recentPayments,
}: PaymentRevenueCardProps) {
  const [showRecent, setShowRecent] = useState(false)

  const formattedRevenue = formatCurrency(totalRevenue / 100)

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[var(--accent)]" />
          Frais de service encaissés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--success)]/10 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-[var(--success)]" />
              <p className="text-sm text-[var(--grey)]">Total collecté</p>
            </div>
            <p className="text-2xl font-bold text-[var(--success)]">
              {formattedRevenue}
            </p>
          </div>
          <div className="p-4 bg-[var(--accent)]/10 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-sm text-[var(--grey)]">Paiements réussis</p>
            </div>
            <p className="text-2xl font-bold text-[var(--accent)]">
              {totalPayments}
            </p>
          </div>
          <div className="p-4 bg-[var(--accent-2)]/10 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-[var(--accent-2)]" />
              <p className="text-sm text-[var(--grey)]">En attente</p>
            </div>
            <p className="text-2xl font-bold text-[var(--accent-2)]">
              {pendingPayments}
            </p>
          </div>
        </div>

        {recentPayments.length > 0 && (
          <>
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => setShowRecent(!showRecent)}
            >
              <span>Derniers paiements ({recentPayments.length})</span>
              {showRecent ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {showRecent && (
              <div className="space-y-2">
                {recentPayments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-[var(--dark)]">
                        {payment.dossier.reference}
                      </p>
                      <p className="text-xs text-[var(--grey)]">
                        {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                      </p>
                    </div>
                    <Badge variant="success">
                      {formatCurrency(payment.amount / 100)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
