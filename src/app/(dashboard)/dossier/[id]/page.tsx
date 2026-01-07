import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getDossierWithSteps, calculateProgress } from '@/lib/dossier-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { StepTimeline } from '@/components/dashboard/step-timeline'
import { formatDate, formatCurrency, documentTypeLabels } from '@/lib/utils'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Euro,
  Home,
  Calendar,
  User,
  Download,
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

  const validatedDocs = dossier.documents.filter(d => d.status === 'VALIDATED')
  const pendingDocs = dossier.documents.filter(d => d.status === 'PENDING')

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
              <h1 className="text-2xl font-bold text-gray-900">
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
        <div className="flex gap-3">
          <Link href={`/messages?dossier=${dossier.id}`}>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
          </Link>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Informations du projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dossier.projectType && (
                <div>
                  <p className="text-sm text-gray-500">Type de projet</p>
                  <p className="font-medium">{dossier.projectType}</p>
                </div>
              )}
              {dossier.projectAddress && (
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-medium">
                    {dossier.projectAddress}<br />
                    {dossier.projectPostalCode} {dossier.projectCity}
                  </p>
                </div>
              )}
              {dossier.estimatedBudget && (
                <div>
                  <p className="text-sm text-gray-500">Budget estimé</p>
                  <p className="font-medium">{formatCurrency(dossier.estimatedBudget)}</p>
                </div>
              )}
              {dossier.revenueCategory && (
                <div>
                  <p className="text-sm text-gray-500">Catégorie de revenus</p>
                  <p className="font-medium">{dossier.revenueCategory}</p>
                </div>
              )}
              {dossier.householdSize && (
                <div>
                  <p className="text-sm text-gray-500">Composition du foyer</p>
                  <p className="font-medium">{dossier.householdSize} personne(s)</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aides */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Aides financières
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">MaPrimeRénov'</p>
                <p className="text-xl font-bold text-green-700">
                  {dossier.mprAmount ? formatCurrency(dossier.mprAmount) : 'En attente'}
                </p>
                {dossier.mprNumber && (
                  <p className="text-xs text-gray-500 mt-1">N° {dossier.mprNumber}</p>
                )}
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Prime CEE</p>
                <p className="text-xl font-bold text-blue-700">
                  {dossier.ceeAmount ? formatCurrency(dossier.ceeAmount) : 'En attente'}
                </p>
                {dossier.ceeNumber && (
                  <p className="text-xs text-gray-500 mt-1">N° {dossier.ceeNumber}</p>
                )}
              </div>
              {(dossier.mprAmount || dossier.ceeAmount) && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total des aides</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency((dossier.mprAmount || 0) + (dossier.ceeAmount || 0))}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </span>
                <Badge>{dossier.documents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dossier.documents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun document téléversé
                </p>
              ) : (
                <div className="space-y-3">
                  {dossier.documents.slice(0, 5).map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {documentTypeLabels[doc.type]}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          doc.status === 'VALIDATED'
                            ? 'success'
                            : doc.status === 'REJECTED'
                            ? 'error'
                            : 'warning'
                        }
                      >
                        {doc.status === 'VALIDATED'
                          ? 'Validé'
                          : doc.status === 'REJECTED'
                          ? 'Refusé'
                          : 'En attente'}
                      </Badge>
                    </div>
                  ))}
                  {dossier.documents.length > 5 && (
                    <p className="text-sm text-center text-primary-600">
                      + {dossier.documents.length - 5} autres documents
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

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
