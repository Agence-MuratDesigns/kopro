import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { DossierCarouselView } from '@/components/dashboard/dossier-carousel-view'
import { calculateProgress, formatDateTime, getActivityLabel } from '@/lib/utils'
import Link from 'next/link'
import {
  FileText,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ChevronRight,
  Users,
  History,
} from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireAuth()
  const isArtisan = user.role === 'ARTISAN'

  // Get dossiers based on role (client's dossiers or artisan-managed dossiers)
  const dossiers = await prisma.dossier.findMany({
    where: isArtisan ? { artisanId: user.id } : { clientId: user.id },
    include: {
      steps: {
        include: {
          template: true,
          documents: true,
        },
        orderBy: {
          template: { order: 'asc' },
        },
      },
      _count: {
        select: {
          messages: true,
          documents: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Get recent activity based on role
  const recentActivity = await prisma.activityLog.findMany({
    where: {
      OR: [
        { userId: user.id },
        isArtisan
          ? { dossier: { artisanId: user.id } }
          : { dossier: { clientId: user.id } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: { firstName: true, lastName: true, role: true },
      },
      dossier: {
        select: { reference: true, endClientFirstName: true, endClientLastName: true },
      },
    },
  })

  // Pour les artisans, on garde l'ancien comportement
  const mainDossier = dossiers[0]

  // Compute stats for artisans
  const artisanStats = isArtisan ? {
    total: dossiers.length,
    enCours: dossiers.filter(d => d.status === 'EN_COURS').length,
    enAttente: dossiers.filter(d => d.status === 'EN_ATTENTE').length,
    termines: dossiers.filter(d => d.status === 'TERMINE' || d.status === 'CLOTURE').length,
    pendingValidation: dossiers.filter(d => d.steps.some(s => s.status === 'PENDING_VALIDATION')).length,
  } : null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-kopro-dark">
            Bonjour, {user.firstName} ! 👋
          </h1>
          <p className="text-kopro-grey mt-2 text-lg">
            {isArtisan
              ? 'Gérez les dossiers MaPrimeRénov\' de vos clients'
              : 'Bienvenue sur votre espace de suivi de rénovation KOPRO'
            }
          </p>
        </div>
        {isArtisan && (
          <Link href="/dossiers/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nouveau dossier client
            </Button>
          </Link>
        )}
      </div>

      {/* Artisan Stats Cards */}
      {isArtisan && artisanStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-[var(--light-purple)] rounded-xl">
                <FileText className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--grey)]">Total dossiers</p>
                <p className="text-2xl font-bold text-[var(--dark)]">{artisanStats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--grey)]">En cours</p>
                <p className="text-2xl font-bold text-[var(--dark)]">{artisanStats.enCours}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--grey)]">En attente</p>
                <p className="text-2xl font-bold text-[var(--dark)]">{artisanStats.pendingValidation}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-[var(--success)]/10 rounded-xl">
                <CheckCircle className="h-6 w-6 text-[var(--success)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--grey)]">Terminés</p>
                <p className="text-2xl font-bold text-[var(--dark)]">{artisanStats.termines}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Dossier State */}
      {dossiers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isArtisan ? <Users className="h-8 w-8 text-primary-600" /> : <FileText className="h-8 w-8 text-primary-600" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isArtisan ? 'Aucun dossier client' : 'Aucun dossier'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              {isArtisan
                ? 'Vous n\'avez pas encore créé de dossier pour vos clients. Commencez par créer votre premier dossier.'
                : 'Vous n\'avez pas encore de dossier de rénovation. Créez votre premier dossier pour commencer votre parcours MaPrimeRénov\'.'}
            </p>
            <Link href={isArtisan ? '/dossiers/new' : '/dossiers'}>
              <Button>
                {isArtisan ? 'Créer un dossier client' : 'Créer un dossier'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Artisan Layout: Activities Left, Dossiers Right */}
      {isArtisan && dossiers.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Activity (smaller) */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-5 w-5 text-[var(--accent)]" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 8).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 bg-gray-100 rounded-full">
                          <Clock className="h-3 w-3 text-kopro-grey" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getActivityLabel(activity.action)}
                          </p>
                          {activity.dossier && (
                            <p className="text-xs text-gray-500 truncate">
                              {activity.dossier.reference}
                              {activity.dossier.endClientFirstName && (
                                <> • {activity.dossier.endClientFirstName} {activity.dossier.endClientLastName}</>
                              )}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune activité récente
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Dossiers (larger) */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[var(--accent)]" />
                    Dossiers clients récents
                  </span>
                  <Link href="/dossiers">
                    <Button variant="outline" size="sm">
                      Voir tous
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dossiers.slice(0, 5).map((dossier) => {
                    const dossierProgress = calculateProgress(dossier.steps)
                    const dossierCurrentStep = dossier.steps.find(
                      s => s.status === 'IN_PROGRESS' || s.status === 'AVAILABLE' || s.status === 'PENDING_VALIDATION'
                    )
                    const hasPendingValidation = dossier.steps.some(s => s.status === 'PENDING_VALIDATION')
                    const isClosed = dossier.status === 'CLOTURE' || dossier.status === 'TERMINE'

                    return (
                      <Link key={dossier.id} href={`/dossier/${dossier.id}`}>
                        <div className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          isClosed
                            ? 'bg-white hover:bg-[var(--success)]/5 border-[var(--success)]/40'
                            : hasPendingValidation
                            ? 'bg-amber-50 hover:bg-amber-100/70 border-amber-300'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Status Icon */}
                            <div className={`p-2 rounded-full flex-shrink-0 ${
                              isClosed
                                ? 'bg-[var(--success)]/10'
                                : hasPendingValidation
                                ? 'bg-amber-100'
                                : 'bg-[var(--light-purple)]'
                            }`}>
                              {isClosed ? (
                                <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                              ) : hasPendingValidation ? (
                                <Clock className="h-5 w-5 text-amber-600" />
                              ) : (
                                <FileText className="h-5 w-5 text-[var(--accent)]" />
                              )}
                            </div>

                            {/* Main Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-semibold text-[var(--dark)]">
                                  {dossier.reference}
                                </span>
                                {hasPendingValidation && (
                                  <Badge className="bg-amber-100 text-amber-700">
                                    En attente
                                  </Badge>
                                )}
                                {isClosed && (
                                  <Badge className="bg-[var(--success)]/10 text-[var(--success)]">
                                    Terminé
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {dossier.endClientFirstName} {dossier.endClientLastName}
                                {dossier.endClientCity && (
                                  <span className="text-gray-400"> - {dossier.endClientCity}</span>
                                )}
                              </p>
                            </div>

                            {/* Current Step */}
                            {dossierCurrentStep && !isClosed && (
                              <div className="text-sm text-right">
                                <p className="text-gray-500 text-xs">Étape en cours</p>
                                <p className="font-medium">{dossierCurrentStep.template.name}</p>
                              </div>
                            )}

                            {/* Progress */}
                            <div className="w-24">
                              <Progress
                                value={dossierProgress}
                                className={`h-2 ${isClosed ? '[&>div]:bg-[var(--success)]' : ''}`}
                              />
                              <p className={`text-xs text-center mt-1 ${
                                isClosed ? 'text-[var(--success)]' : 'text-gray-500'
                              }`}>
                                {dossierProgress}%
                              </p>
                            </div>

                            <ChevronRight className="h-5 w-5 text-gray-400 hidden md:block" />
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Client Main Dossier Overview - Using Carousel for navigation */}
      {!isArtisan && dossiers.length > 0 && (
        <DossierCarouselView
          dossiers={dossiers}
          recentActivity={recentActivity}
        />
      )}

    </div>
  )
}
