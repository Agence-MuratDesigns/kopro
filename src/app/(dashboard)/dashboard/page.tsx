import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { HorizontalTimeline } from '@/components/dashboard/horizontal-timeline'
import { StepTimeline } from '@/components/dashboard/step-timeline'
import { OpenChatButton } from '@/components/dashboard/open-chat-button'
import { calculateProgress, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import {
  FileText,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Edit,
  History,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  Hammer,
  FileCheck,
  Send,
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
        <h1 className="text-3xl font-bold text-kopro-dark">
          Bonjour, {user.firstName} ! 👋
        </h1>
        <p className="text-kopro-grey mt-2 text-lg">
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
            <div className={currentStep.status === 'BLOCKED'
              ? 'rounded-2xl border-red-200 bg-red-50 border'
              : 'rounded-2xl bg-accent text-white'
            }
            style={currentStep.status !== 'BLOCKED' ? {
              boxShadow: 'rgba(250, 251, 253, 0.68) 0px 0px 1em -0.3em inset, rgba(78, 27, 81, 0.07) 0px 1.7px 6.9px 0px, rgba(78, 27, 81, 0.082) 0px 3.8px 14.1px 0px, rgba(78, 27, 81, 0.086) 0px 7.1px 22.1px 0px, rgba(78, 27, 81, 0.094) 0px 15px 33.1px 0px'
            } : {}}
            >
              <div className="py-6 px-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className={currentStep.status === 'BLOCKED' ? 'text-sm text-gray-500 mb-1' : 'text-sm text-white/80 mb-1'}>
                      {currentStep.status === 'BLOCKED' ? 'Action requise' : 'Prochaine étape'}
                    </p>
                    <h3 className={currentStep.status === 'BLOCKED' ? 'text-xl font-semibold text-gray-900' : 'text-xl font-bold text-white'}>
                      {currentStep.template.name}
                    </h3>
                    <p className={currentStep.status === 'BLOCKED' ? 'text-gray-600 mt-1' : 'text-white/90 mt-1'}>
                      {currentStep.template.description}
                    </p>
                    {currentStep.blockedReason && (
                      <p className="text-sm mt-2 text-red-600 font-medium">
                        {currentStep.blockedReason}
                      </p>
                    )}
                  </div>
                  <Link href={`/dossier/${mainDossier.id}/etape/${currentStep.template.code}`}>
                    <Button
                      size="lg"
                      className={currentStep.status === 'BLOCKED'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-white text-accent hover:bg-gray-100 hover:text-kopro-dark'
                      }
                    >
                      {currentStep.status === 'BLOCKED' ? 'Corriger' : 'Continuer'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Info Cards Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Dossier Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Mon dossier</span>
                  <Badge variant="info">{mainDossier.reference}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/dossier/${mainDossier.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Voir le détail
                  </Button>
                </Link>
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
                <OpenChatButton />
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
                          case 'MPR_ID_VALIDATED':
                          case 'MANDATE_VALIDATED':
                          case 'QUOTES_VALIDATED':
                          case 'INVOICES_VALIDATED':
                          case 'DOSSIER_FINALIZED':
                            return <CheckCircle className="h-4 w-4 text-kopro-dark" />
                          case 'STEP_REJECTED':
                          case 'DOCUMENT_REJECTED':
                          case 'MPR_ID_REJECTED':
                            return <AlertCircle className="h-4 w-4 text-kopro-dark" />
                          case 'DOCUMENT_UPLOAD':
                            return <Upload className="h-4 w-4 text-kopro-dark" />
                          case 'PROFILE_UPDATE':
                          case 'STEP_SUBMITTED':
                          case 'MPR_ID_SUBMITTED':
                            return <Edit className="h-4 w-4 text-kopro-dark" />
                          case 'LOGIN':
                            return <LogIn className="h-4 w-4 text-kopro-dark" />
                          case 'CLIENT_CREATED':
                          case 'DOSSIER_CREATED':
                            return <UserPlus className="h-4 w-4 text-kopro-dark" />
                          case 'PASSWORD_CHANGED':
                            return <Lock className="h-4 w-4 text-kopro-dark" />
                          case 'EMAIL_CHANGED':
                            return <Mail className="h-4 w-4 text-kopro-dark" />
                          case 'WORKS_SELECTED':
                          case 'WORK_STARTED':
                            return <Hammer className="h-4 w-4 text-kopro-dark" />
                          case 'MANDATE_SUBMITTED':
                          case 'QUOTES_SUBMITTED':
                          case 'INVOICES_SUBMITTED':
                            return <FileCheck className="h-4 w-4 text-kopro-dark" />
                          case 'MESSAGE_SENT':
                          case 'MESSAGE_RECEIVED':
                          case 'SUPPORT_REQUEST':
                            return <Send className="h-4 w-4 text-kopro-dark" />
                          case 'AVATAR_UPDATE':
                            return <Edit className="h-4 w-4 text-kopro-dark" />
                          default:
                            return <Clock className="h-4 w-4 text-kopro-dark" />
                        }
                      }

                      const getActivityLabel = () => {
                        switch (activity.action) {
                          case 'STEP_VALIDATED':
                            return 'Votre étape a été validée'
                          case 'STEP_REJECTED':
                            return 'Une correction est nécessaire'
                          case 'STEP_SUBMITTED':
                            return 'Étape envoyée pour validation'
                          case 'MPR_ID_SUBMITTED':
                            return 'Identifiant MPR enregistré'
                          case 'MPR_ID_VALIDATED':
                            return 'Identifiant MPR validé'
                          case 'MPR_ID_REJECTED':
                            return 'Identifiant MPR à corriger'
                          case 'MANDATE_SUBMITTED':
                            return 'Mandat envoyé'
                          case 'MANDATE_VALIDATED':
                            return 'Mandat validé'
                          case 'QUOTES_SUBMITTED':
                            return 'Devis envoyés'
                          case 'QUOTES_VALIDATED':
                            return 'Devis validés'
                          case 'INVOICES_SUBMITTED':
                            return 'Factures envoyées'
                          case 'INVOICES_VALIDATED':
                            return 'Factures validées'
                          case 'WORKS_SELECTED':
                            return 'Travaux sélectionnés'
                          case 'WORK_STARTED':
                            return 'Début des travaux signalé'
                          case 'DOCUMENT_UPLOAD':
                            return 'Document ajouté'
                          case 'DOCUMENT_REJECTED':
                            return 'Document à remplacer'
                          case 'PROFILE_UPDATE':
                            return 'Profil mis à jour'
                          case 'AVATAR_UPDATE':
                            return 'Photo de profil modifiée'
                          case 'MESSAGE_SENT':
                            return 'Message envoyé'
                          case 'MESSAGE_RECEIVED':
                            return 'Nouveau message reçu'
                          case 'SUPPORT_REQUEST':
                            return 'Demande d\'assistance envoyée'
                          case 'DOSSIER_CREATED':
                            return 'Dossier créé'
                          case 'CLIENT_CREATED':
                            return 'Bienvenue sur KOPRO'
                          case 'LOGIN':
                            return 'Connexion à votre espace'
                          case 'PASSWORD_CHANGED':
                            return 'Mot de passe modifié'
                          case 'EMAIL_CHANGED':
                            return 'Adresse email modifiée'
                          case 'DOSSIER_FINALIZED':
                            return 'Dossier finalisé'
                          default:
                            return 'Activité sur votre dossier'
                        }
                      }

                      const isAdminAction = activity.user?.role === 'ADMIN'

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
