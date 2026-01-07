import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { getDossierWithSteps, calculateProgress } from '@/lib/dossier-service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { formatDate, formatCurrency, stepStatusLabels, stepStatusColors, documentTypeLabels } from '@/lib/utils'
import { AdminStepActions } from './admin-step-actions'
import { AdminDocumentActions } from './admin-document-actions'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Euro,
  Home,
  Calendar,
  User,
  Phone,
  Mail,
  Check,
  X,
  Clock,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminDossierPage({ params }: Props) {
  const { id } = await params
  await requireRole(['ADMIN', 'ADVISOR'])
  const dossier = await getDossierWithSteps(id)

  if (!dossier) {
    notFound()
  }

  const progress = calculateProgress(dossier.steps)
  const pendingSteps = dossier.steps.filter(s => s.status === 'PENDING_VALIDATION')
  const pendingDocs = dossier.documents.filter(d => d.status === 'PENDING')

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dossiers">
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
          <Link href={`/admin/messages?dossier=${dossier.id}`}>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {pendingSteps.length > 0 && (
        <Alert variant="warning" title="Étapes en attente de validation">
          {pendingSteps.length} étape(s) nécessite(nt) votre validation.
        </Alert>
      )}

      {pendingDocs.length > 0 && (
        <Alert variant="info" title="Documents à vérifier">
          {pendingDocs.length} document(s) en attente de vérification.
        </Alert>
      )}

      {/* Progress */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Progression</h3>
              <p className="text-sm text-gray-500">
                {dossier.steps.filter(s => s.status === 'VALIDATED').length} / {dossier.steps.length} étapes
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
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-600">
                    {dossier.client.firstName[0]}{dossier.client.lastName[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {dossier.client.firstName} {dossier.client.lastName}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  {dossier.client.email}
                </div>
                {dossier.client.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    {dossier.client.phone}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {dossier.projectType && (
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{dossier.projectType}</p>
                </div>
              )}
              {dossier.projectAddress && (
                <div>
                  <p className="text-gray-500">Adresse</p>
                  <p className="font-medium">
                    {dossier.projectAddress}<br />
                    {dossier.projectPostalCode} {dossier.projectCity}
                  </p>
                </div>
              )}
              {dossier.estimatedBudget && (
                <div>
                  <p className="text-gray-500">Budget estimé</p>
                  <p className="font-medium">{formatCurrency(dossier.estimatedBudget)}</p>
                </div>
              )}
              {dossier.revenueCategory && (
                <div>
                  <p className="text-gray-500">Catégorie revenus</p>
                  <p className="font-medium">{dossier.revenueCategory}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aides */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Aides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">MaPrimeRénov'</p>
                <p className="text-lg font-bold text-green-700">
                  {dossier.mprAmount ? formatCurrency(dossier.mprAmount) : 'À définir'}
                </p>
                {dossier.mprNumber && (
                  <p className="text-xs text-gray-500">N° {dossier.mprNumber}</p>
                )}
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">CEE</p>
                <p className="text-lg font-bold text-blue-700">
                  {dossier.ceeAmount ? formatCurrency(dossier.ceeAmount) : 'À définir'}
                </p>
                {dossier.ceeNumber && (
                  <p className="text-xs text-gray-500">N° {dossier.ceeNumber}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Validations */}
          {pendingSteps.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">
                  Étapes à valider ({pendingSteps.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingSteps.map(step => (
                  <div
                    key={step.id}
                    className="p-4 bg-white rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {step.template.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {step.template.description}
                        </p>
                      </div>
                    </div>
                    <AdminStepActions
                      dossierId={dossier.id}
                      stepId={step.id}
                      stepName={step.template.name}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* All Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Parcours complet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dossier.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.status === 'VALIDATED'
                            ? 'bg-green-500 text-white'
                            : step.status === 'PENDING_VALIDATION'
                            ? 'bg-yellow-500 text-white'
                            : step.status === 'IN_PROGRESS'
                            ? 'bg-blue-500 text-white'
                            : step.status === 'BLOCKED'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {step.status === 'VALIDATED' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {step.template.name}
                        </p>
                        {step.completedAt && (
                          <p className="text-xs text-gray-500">
                            Complété le {formatDate(step.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={stepStatusColors[step.status]}>
                      {stepStatusLabels[step.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Documents ({dossier.documents.length})</span>
                {pendingDocs.length > 0 && (
                  <Badge variant="warning">{pendingDocs.length} à vérifier</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dossier.documents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucun document
                </p>
              ) : (
                <div className="space-y-3">
                  {dossier.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {documentTypeLabels[doc.type]} - {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                        {doc.status === 'PENDING' && (
                          <AdminDocumentActions
                            dossierId={dossier.id}
                            documentId={doc.id}
                            documentName={doc.name}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
