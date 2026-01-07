import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { HorizontalTimeline } from '@/components/dashboard/horizontal-timeline'
import { StepTimeline } from '@/components/dashboard/step-timeline'
import { calculateProgress, formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  FileText,
  MessageSquare,
  Bell,
  Plus,
  Euro,
  Home,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Edit,
  History,
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
      messageType: { in: ['ADMIN', 'SYSTEM'] },
    },
  })

  // Get recent activity
  const recentActivity = await prisma.activityLog.findMany({
    where: {
      OR: [
        { userId: user.id },
        { dossier: { clientId: user.id } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: { firstName: true, lastName: true, role: true },
      },
      dossier: {
        select: { reference: true },
      },
    },
  })

  const mainDossier = dossiers[0]
  const progress = mainDossier ? calculateProgress(mainDossier.steps) : 0
  const currentStep = mainDossier?.steps.find(
    s => s.status === 'IN_PROGRESS' || s.status === 'AVAILABLE' || s.status === 'PENDING_VALIDATION'
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user.firstName} !
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenue sur votre espace de suivi de rénovation KOPRO
        </p>
      </div>

      {/* No Dossier State */}
      {dossiers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Dossier en cours de création
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Votre conseiller KOPRO est en train de finaliser la création de votre dossier.
              Vous serez notifié dès qu'il sera disponible.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Dossier Overview */}
      {mainDossier && (
        <>
          {/* Horizontal Timeline at top */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Progression du dossier</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary-600">{progress}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-2 mb-6" />
              <HorizontalTimeline
                steps={mainDossier.steps}
                dossierId={mainDossier.id}
                currentStepId={currentStep?.id}
              />
            </CardContent>
          </Card>

          {/* Current Step Action Card */}
          {currentStep && (
            <Card className={currentStep.status === 'BLOCKED' ? 'border-red-200 bg-red-50' : 'border-primary-200 bg-primary-50'}>
              <CardContent className="py-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {currentStep.status === 'BLOCKED' ? 'Action requise' : 'Prochaine étape'}
                    </p>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {currentStep.template.name}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {currentStep.template.description}
                    </p>
                    {currentStep.blockedReason && (
                      <p className="text-sm mt-2 text-red-600 font-medium">
                        {currentStep.blockedReason}
                      </p>
                    )}
                  </div>
                  <Link href={`/dossier/${mainDossier.id}/etape/${currentStep.template.code}`}>
                    <Button size="lg" className={currentStep.status === 'BLOCKED' ? 'bg-red-600 hover:bg-red-700' : ''}>
                      {currentStep.status === 'BLOCKED' ? 'Corriger' : 'Continuer'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dossier Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Mon dossier</span>
                  <Badge variant="info">{mainDossier.reference}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Créé le</span>
                  <span className="font-medium">{formatDate(mainDossier.createdAt)}</span>
                </div>
                {mainDossier.mprId && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">ID MPR</span>
                    <span className="font-mono font-medium">{mainDossier.mprId}</span>
                  </div>
                )}
                <Link href={`/dossier/${mainDossier.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Voir le détail
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Aides Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Aides estimées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-500">MaPrimeRénov'</p>
                    <p className="text-lg font-bold text-green-700">
                      {mainDossier.mprAmount ? formatCurrency(mainDossier.mprAmount) : '—'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-500">CEE</p>
                    <p className="text-lg font-bold text-blue-700">
                      {mainDossier.ceeAmount ? formatCurrency(mainDossier.ceeAmount) : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Besoin d'aide ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Votre conseiller KOPRO est à votre disposition pour répondre à vos questions.
                </p>
                <Link href="/messages">
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Envoyer un message
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Detailed Timeline - Side by side on large screens */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune activité récente
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity) => {
                      const getActivityIcon = () => {
                        switch (activity.action) {
                          case 'STEP_VALIDATED':
                            return <CheckCircle className="h-4 w-4 text-green-500" />
                          case 'STEP_REJECTED':
                          case 'DOCUMENT_REJECTED':
                            return <AlertCircle className="h-4 w-4 text-red-500" />
                          case 'DOCUMENT_UPLOAD':
                            return <Upload className="h-4 w-4 text-blue-500" />
                          case 'PROFILE_UPDATE':
                          case 'STEP_SUBMITTED':
                            return <Edit className="h-4 w-4 text-amber-500" />
                          default:
                            return <Clock className="h-4 w-4 text-gray-400" />
                        }
                      }

                      const getActivityLabel = () => {
                        switch (activity.action) {
                          case 'STEP_VALIDATED':
                            return 'Étape validée'
                          case 'STEP_REJECTED':
                            return 'Étape refusée'
                          case 'STEP_SUBMITTED':
                            return 'Étape soumise'
                          case 'DOCUMENT_UPLOAD':
                            return 'Document déposé'
                          case 'DOCUMENT_REJECTED':
                            return 'Document refusé'
                          case 'PROFILE_UPDATE':
                            return 'Profil mis à jour'
                          case 'AVATAR_UPDATE':
                            return 'Photo mise à jour'
                          case 'MESSAGE_SENT':
                            return 'Message envoyé'
                          case 'SUPPORT_REQUEST':
                            return 'Demande de support'
                          case 'DOSSIER_CREATED':
                            return 'Dossier créé'
                          default:
                            return activity.action
                        }
                      }

                      const isAdminAction = activity.user?.role === 'ADMIN' || activity.user?.role === 'ADVISOR'

                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getActivityIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getActivityLabel()}
                            </p>
                            {activity.details && (
                              <p className="text-xs text-gray-500 truncate">
                                {activity.details}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDateTime(activity.createdAt)}
                              {isAdminAction && ' • par KOPRO'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Détail des étapes</CardTitle>
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
        </>
      )}
    </div>
  )
}
