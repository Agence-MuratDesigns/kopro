import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { getDossierWithSteps, calculateProgress } from '@/lib/dossier-service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, stepStatusLabels, stepStatusColors, formatDossierStatus } from '@/lib/utils'
import { AdminMprValidation } from './admin-mpr-validation'
import { AdminCurrentStepCard } from './admin-current-step-card'
import { AdminDocumentsList } from './admin-documents-list'
import { AdminFinalizationPanel } from '@/components/admin/admin-finalization-panel'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Euro,
  Home,
  User,
  Phone,
  Mail,
  Check,
  Key,
  Building2,
  CreditCard,
  CheckCircle,
  Clock,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminDossierPage({ params }: Props) {
  const { id } = await params
  await requireRole(['ADMIN'])
  const dossier = await getDossierWithSteps(id)

  if (!dossier) {
    notFound()
  }

  const progress = calculateProgress(dossier.steps)
  const pendingDocs = dossier.documents.filter(d => d.status === 'PENDING')

  // Trouver l'étape actuelle (similaire au dashboard client)
  const currentStep = dossier.steps.find(
    s => s.status === 'IN_PROGRESS' || s.status === 'AVAILABLE' || s.status === 'PENDING_VALIDATION'
  )

  // Trouver le document mandat si on est à l'étape de signature
  const mandatDocument = currentStep?.template.code === 'MANDATE_SIGNATURE'
    ? dossier.documents.find(d => d.type === 'MANDAT' && d.status === 'PENDING')
    : null

  // Trouver les devis si on est à l'étape de dépôt des devis
  const quotesDocuments = currentStep?.template.code === 'QUOTE_DEPOSIT'
    ? dossier.documents.filter(d => d.type === 'DEVIS')
    : []

  // Trouver les factures si on est à l'étape de dépôt des factures
  const invoicesDocuments = currentStep?.template.code === 'INVOICE_DEPOSIT'
    ? dossier.documents.filter(d => d.type === 'FACTURE')
    : []

  // Trouver l'étape PROJECT_INFO pour les documents projet
  const projectInfoStep = dossier.steps.find(s => s.template.code === 'PROJECT_INFO')
  const projectDocuments = currentStep?.template.code === 'PROJECT_INFO' && projectInfoStep
    ? dossier.documents.filter(d => d.stepId === projectInfoStep.id)
    : []

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
                {formatDossierStatus(dossier.status)}
              </Badge>
            </div>
            <p className="text-gray-600 mt-1">
              Créé le {formatDate(dossier.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {dossier.client ? (
            <Link href={`/admin/messages?client=${dossier.client.id}&dossier=${dossier.id}`}>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Envoyer un message à {dossier.client.firstName}
              </Button>
            </Link>
          ) : dossier.artisan ? (
            <Link href={`/admin/messages?client=${dossier.artisan.id}&dossier=${dossier.id}`}>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacter l'artisan
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Étape actuelle - Bloc interactif en haut */}
      {currentStep && (
        <AdminCurrentStepCard
          dossierId={dossier.id}
          stepId={currentStep.id}
          stepOrder={currentStep.template.order}
          stepName={currentStep.template.name}
          stepCode={currentStep.template.code}
          stepDescription={currentStep.template.description}
          stepStatus={currentStep.status}
          mandatDocument={mandatDocument ? {
            id: mandatDocument.id,
            name: mandatDocument.name,
            filePath: mandatDocument.filePath,
            type: mandatDocument.type,
            fileSize: mandatDocument.fileSize,
          } : null}
          mandatStatus={dossier.mandatStatus}
          mprId={dossier.mprId}
          mprStatus={dossier.mprStatus}
          projectInfoStatus={dossier.projectInfoStatus}
          projectInfoData={{
            energyType: dossier.energyType,
            housingType: dossier.housingType,
            housingSurface: dossier.housingSurface,
            constructionYear: dossier.constructionYear,
            revenueCategory: dossier.revenueCategory,
            householdSize: dossier.householdSize,
            ownershipStatus: dossier.ownershipStatus,
          }}
          projectDocuments={projectDocuments.map(d => ({
            id: d.id,
            name: d.name,
            filePath: d.filePath,
            type: d.type,
            workType: d.workType,
            status: d.status,
            fileSize: d.fileSize,
          }))}
          quotesDocuments={quotesDocuments.map(d => ({
            id: d.id,
            name: d.name,
            filePath: d.filePath,
            type: d.type,
            workType: d.workType,
            status: d.status,
            fileSize: d.fileSize,
          }))}
          quotesStatus={dossier.quotesStatus}
          invoicesDocuments={invoicesDocuments.map(d => ({
            id: d.id,
            name: d.name,
            filePath: d.filePath,
            type: d.type,
            workType: d.workType,
            status: d.status,
            fileSize: d.fileSize,
          }))}
          invoicesStatus={dossier.invoicesStatus}
          paymentStatus={dossier.servicePaymentStatus}
          paymentAmount={dossier.servicePaymentAmount}
          paymentCompletedAt={dossier.servicePaymentCompletedAt}
        />
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
                {dossier.artisan ? 'Client final' : 'Client'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {dossier.client ? (
                <>
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
                </>
              ) : dossier.endClientFirstName ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {dossier.endClientFirstName[0]}{dossier.endClientLastName?.[0] || ''}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {dossier.endClientFirstName} {dossier.endClientLastName}
                      </p>
                      <p className="text-xs text-gray-500">Sans compte plateforme</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {dossier.endClientEmail && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        {dossier.endClientEmail}
                      </div>
                    )}
                    {dossier.endClientPhone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        {dossier.endClientPhone}
                      </div>
                    )}
                    {dossier.endClientAddress && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <Home className="h-4 w-4 mt-0.5" />
                        <span>
                          {dossier.endClientAddress}<br />
                          {dossier.endClientPostalCode} {dossier.endClientCity}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm">Aucune information client</p>
              )}
            </CardContent>
          </Card>

          {/* Artisan Info (si dossier géré par artisan) */}
          {dossier.artisan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Artisan gestionnaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-light rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {dossier.artisan.companyName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dossier.artisan.firstName} {dossier.artisan.lastName}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    {dossier.artisan.email}
                  </div>
                  {dossier.artisan.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4" />
                      {dossier.artisan.phone}
                    </div>
                  )}
                </div>
                <Link href={`/admin/artisans/${dossier.artisan.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Voir le profil artisan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

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
                {dossier.mprId && (
                  <p className="text-xs text-gray-500">ID: {dossier.mprId}</p>
                )}
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">CEE</p>
                <p className="text-lg font-bold text-blue-700">
                  {dossier.ceeAmount ? formatCurrency(dossier.ceeAmount) : 'À définir'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Frais de service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Frais de service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-3 rounded-lg ${
                dossier.servicePaymentStatus === 'SUCCEEDED'
                  ? 'bg-green-50 border border-green-200'
                  : dossier.servicePaymentStatus === 'PENDING'
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {dossier.servicePaymentStatus === 'SUCCEEDED' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : dossier.servicePaymentStatus === 'PENDING' ? (
                      <Clock className="h-5 w-5 text-amber-600" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    )}
                    <span className={`font-medium ${
                      dossier.servicePaymentStatus === 'SUCCEEDED'
                        ? 'text-green-700'
                        : dossier.servicePaymentStatus === 'PENDING'
                        ? 'text-amber-700'
                        : 'text-gray-600'
                    }`}>
                      {dossier.servicePaymentStatus === 'SUCCEEDED'
                        ? 'Payé'
                        : dossier.servicePaymentStatus === 'PENDING'
                        ? 'En attente'
                        : 'Non payé'}
                    </span>
                  </div>
                  <Badge variant={
                    dossier.servicePaymentStatus === 'SUCCEEDED'
                      ? 'success'
                      : dossier.servicePaymentStatus === 'PENDING'
                      ? 'warning'
                      : 'secondary'
                  }>
                    {dossier.servicePaymentAmount
                      ? formatCurrency(dossier.servicePaymentAmount / 100)
                      : formatCurrency(290)}
                  </Badge>
                </div>
                {dossier.servicePaymentCompletedAt && (
                  <p className="text-xs text-green-600">
                    Payé le {formatDate(dossier.servicePaymentCompletedAt)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center - Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* MPR Validation */}
          <AdminMprValidation
            dossierId={dossier.id}
            mprId={dossier.mprId}
            mprStatus={dossier.mprStatus}
            mprSubmittedAt={dossier.mprSubmittedAt?.toISOString() || null}
            mprHistory={dossier.mprHistory?.map(h => ({
              ...h,
              createdAt: h.createdAt.toISOString(),
            })) || []}
            clientName={dossier.client
              ? `${dossier.client.firstName} ${dossier.client.lastName}`
              : dossier.endClientFirstName
                ? `${dossier.endClientFirstName} ${dossier.endClientLastName || ''}`
                : 'Client'
            }
          />


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

          {/* Documents - Organisés par catégorie */}
          <AdminDocumentsList
            documents={dossier.documents.map(doc => ({
              id: doc.id,
              name: doc.name,
              type: doc.type,
              status: doc.status,
              filePath: doc.filePath,
              uploadedAt: doc.uploadedAt.toISOString(),
              workType: doc.workType,
              fileSize: doc.fileSize,
            }))}
            pendingCount={pendingDocs.length}
          />

          {/* Finalization Panel */}
          <AdminFinalizationPanel
            dossierId={dossier.id}
            dossierReference={dossier.reference}
            currentStatus={dossier.status}
            allStepsValidated={dossier.steps.filter(s => s.template.code !== 'FINAL_RECAP').every(s => s.status === 'VALIDATED')}
            totalWorksAmount={dossier.totalWorksAmount}
            mprAmount={dossier.mprAmount}
            ceeAmount={dossier.ceeAmount}
            paymentStatus={dossier.paymentStatus || 'PENDING'}
            mprPaidAmount={dossier.mprPaidAmount}
            ceePaidAmount={dossier.ceePaidAmount}
            isClosable={dossier.steps.filter(s => s.template.code !== 'FINAL_RECAP').every(s => s.status === 'VALIDATED') && dossier.status !== 'CLOTURE'}
          />
        </div>
      </div>
    </div>
  )
}
