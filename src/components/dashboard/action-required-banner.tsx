'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle,
  FileText,
  Upload,
  Edit,
  Send,
} from 'lucide-react'

interface ActionRequiredBannerProps {
  stepCode: string
  stepName: string
  stepStatus: 'AVAILABLE' | 'IN_PROGRESS' | 'PENDING_VALIDATION' | 'BLOCKED'
  dossierId: string
  blockedReason?: string
}

const stepActions: Record<string, { icon: typeof FileText; action: string; description: string }> = {
  MPR_IDENTIFIER: {
    icon: Edit,
    action: 'Saisir votre identifiant MaPrimeRénov\'',
    description: 'Renseignez votre identifiant MPR pour continuer',
  },
  MANDATE_SIGNATURE: {
    icon: Send,
    action: 'Signer le mandat administratif',
    description: 'Téléchargez et signez le mandat, ou signez électroniquement',
  },
  WORK_SELECTION: {
    icon: CheckCircle,
    action: 'Sélectionner vos travaux',
    description: 'Choisissez les types de travaux que vous souhaitez réaliser',
  },
  QUOTE_DEPOSIT: {
    icon: Upload,
    action: 'Déposer vos devis',
    description: 'Téléchargez les devis pour chaque type de travaux sélectionné',
  },
  WORK_AUTHORIZATION: {
    icon: CheckCircle,
    action: 'Confirmer le démarrage des travaux',
    description: 'Notifiez-nous lorsque les travaux ont commencé',
  },
  INVOICE_DEPOSIT: {
    icon: Upload,
    action: 'Déposer vos factures finales',
    description: 'Téléchargez les factures une fois les travaux terminés',
  },
}

export function ActionRequiredBanner({
  stepCode,
  stepName,
  stepStatus,
  dossierId,
  blockedReason,
}: ActionRequiredBannerProps) {
  const stepInfo = stepActions[stepCode]

  // No action required
  if (stepStatus === 'PENDING_VALIDATION') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-blue-900">
              Aucune action requise pour le moment
            </p>
            <p className="text-sm text-blue-700 mt-0.5">
              {stepName} — en attente de validation par notre équipe
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Blocked - correction needed
  if (stepStatus === 'BLOCKED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-900">
                Action requise : Correction nécessaire
              </p>
              <p className="text-sm text-red-700 mt-0.5">
                {blockedReason || 'Veuillez corriger les informations demandées'}
              </p>
            </div>
          </div>
          <Link href={`/dossier/${dossierId}/etape/${stepCode}`}>
            <Button variant="destructive" className="whitespace-nowrap">
              Corriger maintenant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Action available
  if (stepInfo) {
    const Icon = stepInfo.icon

    return (
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary-100 rounded-full">
              <Icon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-primary-900">
                Action requise : {stepInfo.action}
              </p>
              <p className="text-sm text-primary-700 mt-0.5">
                {stepInfo.description}
              </p>
            </div>
          </div>
          <Link href={`/dossier/${dossierId}/etape/${stepCode}`}>
            <Button className="whitespace-nowrap">
              Continuer
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return null
}

// Simpler inline version for step pages
export function ActionRequiredInline({
  message,
  variant = 'info',
}: {
  message: string
  variant?: 'info' | 'warning' | 'success'
}) {
  const variants = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Clock,
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertCircle,
      iconColor: 'text-amber-500',
      textColor: 'text-amber-800',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      textColor: 'text-green-800',
    },
  }

  const v = variants[variant]
  const Icon = v.icon

  return (
    <div className={cn('rounded-lg p-3 border flex items-center gap-2', v.bg, v.border)}>
      <Icon className={cn('h-4 w-4 flex-shrink-0', v.iconColor)} />
      <p className={cn('text-sm', v.textColor)}>{message}</p>
    </div>
  )
}
