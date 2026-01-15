import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getDossierWithSteps, calculateProgress } from '@/lib/dossier-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { StepTimeline } from '@/components/dashboard/step-timeline'
import { ProjectInfoCard } from '@/components/dashboard/project-info-card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft,
  MessageSquare,
  User,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function DossierPage({ params }: Props) {
  const { id } = await params
  const user = await requireAuth()
  const dossier = await getDossierWithSteps(id)

  if (!dossier || dossier.clientId !== user.id) {
    notFound()
  }

  const progress = calculateProgress(dossier.steps)
  const currentStep = dossier.steps.find(
    s => s.status === 'IN_PROGRESS' || s.status === 'AVAILABLE' || s.status === 'PENDING_VALIDATION'
  )


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-kopro-dark">
                Dossier {dossier.reference}
              </h1>
              <Badge variant={dossier.status === 'TERMINE' ? 'success' : 'info'}>
                {dossier.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">
              Créé le {formatDate(dossier.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Progression globale</h3>
              <p className="text-sm text-gray-500">
                {dossier.steps.filter(s => s.status === 'VALIDATED').length} étapes sur {dossier.steps.length} validées
              </p>
            </div>
            <span className="text-2xl font-bold text-primary-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Project Info */}
          <ProjectInfoCard
            dossierId={dossier.id}
            projectType={dossier.projectType}
            projectAddress={dossier.projectAddress}
            projectCity={dossier.projectCity}
            projectPostalCode={dossier.projectPostalCode}
            estimatedBudget={dossier.estimatedBudget}
            revenueCategory={dossier.revenueCategory}
            householdSize={dossier.householdSize}
          />

          {/* Advisor */}
          {dossier.advisor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Votre conseiller
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary-600">
                      {dossier.advisor.firstName[0]}{dossier.advisor.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {dossier.advisor.firstName} {dossier.advisor.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{dossier.advisor.email}</p>
                  </div>
                </div>
                <Link href={`/messages?dossier=${dossier.id}`}>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contacter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Timeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Parcours du dossier</CardTitle>
            </CardHeader>
            <CardContent>
              <StepTimeline
                steps={dossier.steps}
                dossierId={dossier.id}
                currentStepId={currentStep?.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
