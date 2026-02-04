'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle } from 'lucide-react'
import { formatDossierStatus } from '@/lib/utils'

interface DossierStep {
  id: string
  status: string
  template: {
    name: string
    order: number
  }
}

interface RecentDossier {
  id: string
  reference: string
  status: string
  client: {
    firstName: string
    lastName: string
  } | null
  artisan?: {
    firstName: string
    lastName: string
    companyName: string | null
  } | null
  endClientFirstName?: string | null
  endClientLastName?: string | null
  steps: DossierStep[]
}

interface RecentDossiersProps {
  dossiers: RecentDossier[]
}

export function RecentDossiers({ dossiers }: RecentDossiersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle>Dossiers récents</CardTitle>
        <Link
          href="/admin/dossiers"
          className="text-sm text-[var(--accent)] hover:text-[var(--dark)] transition-colors"
        >
          Voir tous
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dossiers.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Aucun dossier
            </p>
          ) : (
            dossiers.map(dossier => {
              const currentStep = dossier.steps.find(
                s =>
                  s.status === 'IN_PROGRESS' ||
                  s.status === 'PENDING_VALIDATION' ||
                  s.status === 'AVAILABLE'
              )
              const progress = Math.round(
                (dossier.steps.filter(s => s.status === 'VALIDATED').length /
                  dossier.steps.length) *
                  100
              )

              const isClosed = dossier.status === 'CLOTURE' || dossier.status === 'TERMINE'

              return (
                <Link
                  key={dossier.id}
                  href={`/admin/dossiers/${dossier.id}`}
                  className="block"
                >
                  <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 border-2 ${
                    isClosed
                      ? 'bg-success-10 hover:bg-success-15 border-success-50'
                      : dossier.status === 'EN_ATTENTE'
                      ? 'bg-accent2-10 hover:bg-accent2-15 border-accent2-40'
                      : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-4">
                      {isClosed && (
                        <div className="p-2 bg-[var(--success)]/10 rounded-full">
                          <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isClosed ? 'text-[var(--success)]' : 'text-[var(--dark)]'}`}>
                            {dossier.reference}
                          </p>
                          <Badge
                            className={
                              isClosed
                                ? 'bg-[var(--success)] text-white'
                                : dossier.status === 'EN_ATTENTE'
                                ? 'bg-[var(--accent-2)]/20 text-[var(--accent-2)]'
                                : 'bg-[var(--light-purple)] text-[var(--accent)]'
                            }
                          >
                            {isClosed ? 'Clôturé' : formatDossierStatus(dossier.status)}
                          </Badge>
                        </div>
                        <p className={`text-sm ${isClosed ? 'text-[var(--success)]' : 'text-[var(--grey)]'}`}>
                          {dossier.client
                            ? `${dossier.client.firstName} ${dossier.client.lastName}`
                            : dossier.endClientFirstName
                              ? `${dossier.endClientFirstName} ${dossier.endClientLastName || ''}`
                              : 'Client non renseigné'}
                          {dossier.artisan && (
                            <span className="ml-2 text-accent text-xs">
                              (Artisan: {dossier.artisan.companyName})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {!isClosed ? (
                      <div className="flex items-center gap-6">
                        {currentStep && (
                          <div className="text-right">
                            <p className="text-xs text-[var(--grey)]">Étape en cours</p>
                            <p className="text-sm font-medium text-[var(--dark)]">
                              {currentStep.template.name}
                            </p>
                          </div>
                        )}
                        <div className="w-28">
                          <div className="flex items-center gap-3">
                            <Progress value={progress} className="h-2 flex-1" />
                            <span className="text-xs font-medium min-w-[32px] text-right text-[var(--grey)]">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-sm font-medium text-[var(--success)]">
                          Dossier terminé
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
