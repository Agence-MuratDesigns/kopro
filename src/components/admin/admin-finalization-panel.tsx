'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import {
  CheckCircle,
  Euro,
  Lock,
  Loader2,
  AlertTriangle,
  Clock,
  CreditCard,
  Save,
} from 'lucide-react'

interface AdminFinalizationPanelProps {
  dossierId: string
  dossierReference: string
  currentStatus: string
  allStepsValidated: boolean
  totalWorksAmount: number | null
  mprAmount: number | null
  ceeAmount: number | null
  paymentStatus: string
  mprPaidAmount: number | null
  ceePaidAmount: number | null
  isClosable: boolean
}

export function AdminFinalizationPanel({
  dossierId,
  dossierReference,
  currentStatus,
  allStepsValidated,
  totalWorksAmount,
  mprAmount,
  ceeAmount,
  paymentStatus,
  mprPaidAmount,
  ceePaidAmount,
  isClosable,
}: AdminFinalizationPanelProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingAmounts, setIsSavingAmounts] = useState(false)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state for amounts
  const [amounts, setAmounts] = useState({
    totalWorksAmount: totalWorksAmount || 0,
    mprAmount: mprAmount || 0,
    ceeAmount: ceeAmount || 0,
  })

  // Payment update state
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: paymentStatus || 'PENDING',
    mprPaidAmount: mprPaidAmount || 0,
    ceePaidAmount: ceePaidAmount || 0,
  })

  const isClosed = currentStatus === 'CLOTURE'

  // Check if amounts have changed
  const amountsChanged =
    amounts.totalWorksAmount !== (totalWorksAmount || 0) ||
    amounts.mprAmount !== (mprAmount || 0) ||
    amounts.ceeAmount !== (ceeAmount || 0)

  const handleSaveAmounts = async () => {
    setIsSavingAmounts(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/amounts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(amounts),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      setSuccess('Montants enregistrés avec succès')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSavingAmounts(false)
    }
  }

  const handleFinalize = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir clôturer le dossier ${dossierReference} ? Cette action est irréversible.`)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalWorksAmount: amounts.totalWorksAmount,
          mprAmount: amounts.mprAmount,
          ceeAmount: amounts.ceeAmount,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la clôture')
      }

      setSuccess('Dossier clôturé avec succès')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la clôture')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentUpdate = async () => {
    setIsUpdatingPayment(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/dossiers/${dossierId}/payment-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      setSuccess('Statut de paiement mis à jour')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setIsUpdatingPayment(false)
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return { label: 'Versé', variant: 'success' as const }
      case 'IN_PROGRESS':
        return { label: 'En cours', variant: 'warning' as const }
      default:
        return { label: 'En attente', variant: 'secondary' as const }
    }
  }

  const statusInfo = getPaymentStatusLabel(paymentStatus)

  return (
    <div className="space-y-6">
      {/* Amounts Section - Always visible when not closed */}
      {!isClosed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Montants du dossier
            </CardTitle>
            <CardDescription>
              Renseignez les montants des travaux et des aides à tout moment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="error" title="Erreur">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" title="Succès">
                {success}
              </Alert>
            )}

            {/* Amounts form - Always editable */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="totalWorksAmount">Montant total travaux</Label>
                <div className="relative mt-1">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="totalWorksAmount"
                    type="number"
                    value={amounts.totalWorksAmount || ''}
                    placeholder="0"
                    onChange={(e) => setAmounts({ ...amounts, totalWorksAmount: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mprAmount">Aide MaPrimeRénov'</Label>
                <div className="relative mt-1">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="mprAmount"
                    type="number"
                    value={amounts.mprAmount || ''}
                    placeholder="0"
                    onChange={(e) => setAmounts({ ...amounts, mprAmount: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ceeAmount">Aide CEE</Label>
                <div className="relative mt-1">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="ceeAmount"
                    type="number"
                    value={amounts.ceeAmount || ''}
                    placeholder="0"
                    onChange={(e) => setAmounts({ ...amounts, ceeAmount: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveAmounts}
              disabled={isSavingAmounts || !amountsChanged}
              variant="outline"
              className="w-full"
            >
              {isSavingAmounts ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer les montants
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Finalization Section */}
      {!isClosed && (
        <Card className={isClosable ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Clôture du dossier
            </CardTitle>
            <CardDescription>
              Finalisez le dossier une fois toutes les étapes validées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!allStepsValidated && (
              <Alert variant="warning" title="Étapes manquantes">
                Toutes les étapes doivent être validées avant de pouvoir clôturer le dossier.
              </Alert>
            )}

            <Button
              onClick={handleFinalize}
              disabled={!isClosable || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Clôturer le dossier
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Status Section (visible when closed) */}
      {isClosed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gestion du versement
              </span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </CardTitle>
            <CardDescription>
              Mettez à jour le statut de versement des aides
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="error" title="Erreur">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" title="Succès">
                {success}
              </Alert>
            )}

            {/* Payment Status Selection */}
            <div>
              <Label>Statut du versement</Label>
              <div className="flex gap-2 mt-2">
                {['PENDING', 'IN_PROGRESS', 'PAID'].map((status) => {
                  const info = getPaymentStatusLabel(status)
                  return (
                    <Button
                      key={status}
                      variant={paymentForm.paymentStatus === status ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setPaymentForm({ ...paymentForm, paymentStatus: status })}
                    >
                      {status === 'PENDING' && <Clock className="h-4 w-4 mr-1" />}
                      {status === 'IN_PROGRESS' && <AlertTriangle className="h-4 w-4 mr-1" />}
                      {status === 'PAID' && <CheckCircle className="h-4 w-4 mr-1" />}
                      {info.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Paid Amounts */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mprPaidAmount">MaPrimeRénov' versé</Label>
                <div className="relative mt-1">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="mprPaidAmount"
                    type="number"
                    value={paymentForm.mprPaidAmount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mprPaidAmount: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Montant estimé: {mprAmount ? `${mprAmount.toLocaleString('fr-FR')} €` : '—'}
                </p>
              </div>
              <div>
                <Label htmlFor="ceePaidAmount">CEE versé</Label>
                <div className="relative mt-1">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="ceePaidAmount"
                    type="number"
                    value={paymentForm.ceePaidAmount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, ceePaidAmount: parseFloat(e.target.value) || 0 })}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Montant estimé: {ceeAmount ? `${ceeAmount.toLocaleString('fr-FR')} €` : '—'}
                </p>
              </div>
            </div>

            <Button
              onClick={handlePaymentUpdate}
              disabled={isUpdatingPayment}
              className="w-full"
            >
              {isUpdatingPayment ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Mettre à jour le versement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
