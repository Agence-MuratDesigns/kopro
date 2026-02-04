import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { calculateProgress, formatDate, formatProjectTypes } from '@/lib/utils'
import Link from 'next/link'
import {
  FileText,
  Plus,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  CreditCard,
} from 'lucide-react'
import { CreateDossierButton } from '@/components/dashboard/create-dossier-button'

// Status badge variant mapping
const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'primary'> = {
  BROUILLON: 'secondary',
  EN_COURS: 'info',
  EN_ATTENTE: 'warning',
  VALIDE: 'success',
  REFUSE: 'error',
  CLOTURE: 'default',
}

const statusLabels: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EN_COURS: 'En cours',
  EN_ATTENTE: 'En attente',
  VALIDE: 'Validé',
  REFUSE: 'Refusé',
  CLOTURE: 'Clôturé',
}

export default async function DossiersListPage() {
  const user = await requireAuth()
  const isArtisan = user.role === 'ARTISAN'

  // Get dossiers based on user role
  const dossiers = await prisma.dossier.findMany({
    where: isArtisan
      ? { artisanId: user.id }
      : { clientId: user.id },
    include: {
      steps: {
        include: {
          template: true,
        },
        orderBy: {
          template: { order: 'asc' },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-kopro-dark">
            {isArtisan ? 'Dossiers clients' : 'Mes dossiers'}
          </h1>
          <p className="text-kopro-grey mt-1">
            {isArtisan
              ? 'Gérez les dossiers de vos clients'
              : 'Gérez vos dossiers de rénovation'}
          </p>
        </div>
        {isArtisan ? (
          <Link href="/dossiers/new">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau dossier
            </Button>
          </Link>
        ) : (
          <CreateDossierButton />
        )}
      </div>

      {/* Empty State */}
      {dossiers.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun dossier
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {isArtisan
                ? 'Vous n\'avez pas encore créé de dossier pour vos clients. Créez votre premier dossier pour commencer.'
                : 'Vous n\'avez pas encore de dossier de rénovation. Créez votre premier dossier pour commencer votre parcours MaPrimeRénov\'.'}
            </p>
            {isArtisan ? (
              <Link href="/dossiers/new">
                <Button variant="primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un dossier client
                </Button>
              </Link>
            ) : (
              <CreateDossierButton variant="primary" />
            )}
          </CardContent>
        </Card>
      )}

      {/* Dossiers Grid */}
      {dossiers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dossiers.map((dossier) => {
            const progress = calculateProgress(dossier.steps)
            const currentStep = dossier.steps.find(
              s => s.status === 'IN_PROGRESS' || s.status === 'AVAILABLE' || s.status === 'PENDING_VALIDATION' || s.status === 'BLOCKED'
            )
            const hasActionRequired = currentStep && (
              currentStep.status === 'AVAILABLE' ||
              currentStep.status === 'IN_PROGRESS' ||
              currentStep.status === 'BLOCKED'
            )
            const isCompleted = progress === 100
            const isBlocked = currentStep?.status === 'BLOCKED'

            const isPending = currentStep?.status === 'PENDING_VALIDATION'

            return (
              <Link key={dossier.id} href={`/dossier/${dossier.id}`}>
                <Card className={`h-full transition-all cursor-pointer group border-2 ${
                  isCompleted
                    ? 'bg-success-10 hover:bg-success-15 border-success-50 hover:shadow-lg'
                    : isPending
                    ? 'bg-accent2-10 hover:bg-accent2-15 border-accent2-40 hover:shadow-lg'
                    : isBlocked
                    ? 'bg-required-10 hover:bg-required-15 border-required-40 hover:shadow-lg'
                    : 'bg-white hover:shadow-lg border-gray-200'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isCompleted
                            ? 'bg-kopro-success/10'
                            : isBlocked
                              ? 'bg-kopro-required/10'
                              : 'bg-accent-light'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-kopro-success" />
                          ) : isBlocked ? (
                            <AlertCircle className="h-5 w-5 text-kopro-required" />
                          ) : (
                            <FileText className="h-5 w-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">
                            {dossier.reference}
                          </CardTitle>
                          {/* Show client name for artisan */}
                          {isArtisan && dossier.endClientFirstName && (
                            <p className="text-sm text-kopro-grey flex items-center gap-1 mt-0.5">
                              <User className="h-3.5 w-3.5" />
                              {dossier.endClientFirstName} {dossier.endClientLastName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant={statusVariants[dossier.status] || 'default'}>
                          {statusLabels[dossier.status] || dossier.status}
                        </Badge>
                        {/* Payment Status Badge */}
                        {dossier.servicePaymentStatus === 'SUCCEEDED' ? (
                          <Badge className="bg-green-100 text-green-700 gap-1 text-xs">
                            <CreditCard className="h-3 w-3" />
                            Payé
                          </Badge>
                        ) : dossier.servicePaymentStatus === 'PENDING' ? (
                          <Badge className="bg-amber-100 text-amber-700 gap-1 text-xs">
                            <CreditCard className="h-3 w-3" />
                            Paiement en cours
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Client address for artisan */}
                    {isArtisan && dossier.endClientCity && (
                      <p className="text-sm text-kopro-grey truncate">
                        {dossier.endClientCity}
                      </p>
                    )}

                    {/* Project info - always shown for consistency */}
                    <div className="space-y-1">
                      {dossier.projectType || dossier.projectAddress ? (
                        <>
                          {dossier.projectType && (
                            <p className="text-sm text-kopro-dark font-medium truncate">
                              {formatProjectTypes(dossier.projectType)}
                            </p>
                          )}
                          {dossier.projectAddress && (
                            <p className="text-sm text-kopro-grey truncate">
                              {dossier.projectAddress}, {dossier.projectPostalCode} {dossier.projectCity}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-kopro-grey/60 italic">
                          Informations projet à compléter
                        </p>
                      )}
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-kopro-grey">Progression</span>
                        <span className={`text-sm font-semibold ${
                          isCompleted ? 'text-[var(--success)]' : 'text-primary-600'
                        }`}>{progress}%</span>
                      </div>
                      <Progress value={progress} className={`h-2 ${isCompleted ? '[&>div]:bg-[var(--success)]' : ''}`} />
                    </div>

                    {/* Current Step */}
                    {currentStep && !isCompleted && (
                      <div className={`p-3 rounded-lg ${
                        isBlocked ? 'bg-red-50' : 'bg-accent-light/50'
                      }`}>
                        <p className="text-xs text-kopro-grey mb-0.5">
                          {isBlocked ? 'Action requise' : 'Étape en cours'}
                        </p>
                        <p className={`text-sm font-medium ${
                          isBlocked ? 'text-kopro-required' : 'text-kopro-dark'
                        }`}>
                          {currentStep.template.name}
                        </p>
                      </div>
                    )}

                    {/* Completed message */}
                    {isCompleted && (
                      <div className="p-3 rounded-lg bg-kopro-success/10">
                        <p className="text-sm font-medium text-kopro-success flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Dossier finalisé
                        </p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-kopro-grey pt-2 border-t">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Créé le {formatDate(dossier.createdAt)}</span>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-accent font-medium group-hover:underline flex items-center gap-1">
                        Voir le dossier
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
