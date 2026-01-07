import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { StepTimeline } from '@/components/dashboard/step-timeline'
import { calculateProgress, formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  FileText,
  MessageSquare,
  Bell,
  Plus,
  Euro,
  Home,
  Calendar,
} from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Get client's dossiers
  const dossiers = await prisma.dossier.findMany({
    where: { clientId: user.id },
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
    orderBy: { createdAt: 'desc' },
  })

  // Get unread notifications count
  const unreadNotifications = await prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
    },
  })

  // Get unread messages count
  const unreadMessages = await prisma.message.count({
    where: {
      dossier: { clientId: user.id },
      isRead: false,
      isFromClient: false,
    },
  })

  const mainDossier = dossiers[0]
  const progress = mainDossier ? calculateProgress(mainDossier.steps) : 0
  const currentStep = mainDossier?.steps.find(
    s => s.status === 'IN_PROGRESS' || s.status === 'AVAILABLE' || s.status === 'PENDING_VALIDATION'
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user.firstName} !
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenue sur votre espace de suivi de rénovation
          </p>
        </div>
        {dossiers.length === 0 && (
          <Link href="/dossier/nouveau">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer mon dossier
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dossiers</p>
              <p className="text-2xl font-bold text-gray-900">{dossiers.length}</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/messages">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-blue-100 rounded-lg relative">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Messages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {unreadMessages > 0 ? `${unreadMessages} nouveau${unreadMessages > 1 ? 'x' : ''}` : 'Aucun'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/notifications">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-yellow-100 rounded-lg relative">
                <Bell className="h-6 w-6 text-yellow-600" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Notifications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {unreadNotifications > 0 ? `${unreadNotifications} nouvelle${unreadNotifications > 1 ? 's' : ''}` : 'Aucune'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* No Dossier State */}
      {dossiers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pas encore de dossier
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Commencez votre parcours de rénovation en créant votre premier dossier.
              Nous vous guiderons étape par étape.
            </p>
            <Link href="/dossier/nouveau">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Créer mon dossier
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Main Dossier Overview */}
      {mainDossier && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Dossier Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Mon dossier</span>
                  <Badge variant={mainDossier.status === 'TERMINE' ? 'success' : 'info'}>
                    {mainDossier.reference}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progression</span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                {/* Project Info */}
                {mainDossier.projectAddress && (
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Adresse du projet</p>
                      <p className="font-medium text-gray-900">
                        {mainDossier.projectAddress}
                        <br />
                        {mainDossier.projectPostalCode} {mainDossier.projectCity}
                      </p>
                    </div>
                  </div>
                )}

                {mainDossier.projectType && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Type de projet</p>
                      <p className="font-medium text-gray-900">{mainDossier.projectType}</p>
                    </div>
                  </div>
                )}

                {mainDossier.estimatedBudget && (
                  <div className="flex items-start gap-3">
                    <Euro className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Budget estimé</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(mainDossier.estimatedBudget)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date de création</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(mainDossier.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Aides estimées */}
                {(mainDossier.mprAmount || mainDossier.ceeAmount) && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-sm font-medium text-green-800 mb-2">
                      Aides estimées
                    </p>
                    <div className="space-y-1">
                      {mainDossier.mprAmount && (
                        <p className="text-sm text-green-700">
                          MaPrimeRénov' : {formatCurrency(mainDossier.mprAmount)}
                        </p>
                      )}
                      {mainDossier.ceeAmount && (
                        <p className="text-sm text-green-700">
                          CEE : {formatCurrency(mainDossier.ceeAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Link href={`/dossier/${mainDossier.id}`}>
                  <Button variant="outline" className="w-full">
                    Voir le détail
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Current Step Alert */}
            {currentStep && (
              <Alert
                variant={currentStep.status === 'BLOCKED' ? 'warning' : 'info'}
                title={currentStep.status === 'BLOCKED' ? 'Action requise' : 'Étape en cours'}
              >
                <p className="font-medium">{currentStep.template.name}</p>
                <p className="text-sm mt-1">{currentStep.template.description}</p>
                {currentStep.blockedReason && (
                  <p className="text-sm mt-2 text-red-600">{currentStep.blockedReason}</p>
                )}
                <Link
                  href={`/dossier/${mainDossier.id}/etape/${currentStep.template.code}`}
                  className="inline-block mt-3"
                >
                  <Button size="sm">
                    {currentStep.status === 'BLOCKED' ? 'Résoudre' : 'Continuer'}
                  </Button>
                </Link>
              </Alert>
            )}
          </div>

          {/* Right Column - Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Parcours de votre dossier</CardTitle>
              </CardHeader>
              <CardContent>
                <StepTimeline
                  steps={mainDossier.steps}
                  dossierId={mainDossier.id}
                  currentStepId={currentStep?.id}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
