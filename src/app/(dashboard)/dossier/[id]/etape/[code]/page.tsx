import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { stepStatusLabels, stepStatusColors, documentTypeLabels } from '@/lib/utils'
import { StepActionForm } from './step-action-form'
import { DocumentUpload } from './document-upload'
import { MprIdentifierForm } from '@/components/dashboard/mpr-identifier-form'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  Lock,
  AlertCircle,
  Upload,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string; code: string }>
}

export default async function StepPage({ params }: Props) {
  const { id, code } = await params
  const user = await requireAuth()

  const dossier = await prisma.dossier.findUnique({
    where: { id },
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
    },
  })

  // Get MPR info for MPR step
  const mprInfo = await prisma.dossier.findUnique({
    where: { id },
    select: {
      mprId: true,
      mprStatus: true,
      mprReviewMessage: true,
    },
  })

  if (!dossier || dossier.clientId !== user.id) {
    notFound()
  }

  const step = dossier.steps.find(s => s.template.code === code)
  if (!step) {
    notFound()
  }

  // Check if step is locked
  if (step.status === 'LOCKED') {
    redirect(`/dossier/${id}`)
  }

  const requiredDocs = step.template.requiredDocs
    ? JSON.parse(step.template.requiredDocs)
    : []

  const uploadedDocTypes = step.documents.map(d => d.type)
  const missingDocs = requiredDocs.filter((type: string) => !uploadedDocTypes.includes(type))

  const stepIndex = dossier.steps.findIndex(s => s.id === step.id)
  const previousStep = stepIndex > 0 ? dossier.steps[stepIndex - 1] : null
  const nextStep = stepIndex < dossier.steps.length - 1 ? dossier.steps[stepIndex + 1] : null

  const canComplete =
    step.status === 'IN_PROGRESS' &&
    missingDocs.length === 0 &&
    step.documents.every(d => d.status !== 'REJECTED')

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link href={`/dossier/${id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dossier
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Étape {stepIndex + 1} sur {dossier.steps.length}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {step.template.name}
            </h1>
            <p className="text-gray-600 mt-2">
              {step.template.description}
            </p>
          </div>
          <Badge className={stepStatusColors[step.status]}>
            {stepStatusLabels[step.status]}
          </Badge>
        </div>
      </div>

      {/* Status Alert */}
      {step.status === 'BLOCKED' && step.blockedReason && (
        <Alert variant="error" title="Étape bloquée">
          {step.blockedReason}
        </Alert>
      )}

      {step.status === 'PENDING_VALIDATION' && (
        <Alert variant="info" title="En attente de validation">
          Votre étape a été soumise et est en cours de vérification par l'équipe KOPRO.
          Vous serez notifié dès qu'elle sera validée.
        </Alert>
      )}

      {step.status === 'VALIDATED' && (
        <Alert variant="success" title="Étape validée">
          Cette étape a été validée avec succès.
          {step.notes && <p className="mt-1 text-sm">{step.notes}</p>}
        </Alert>
      )}

      {/* MPR Identifier Form - Step 2 */}
      {step.template.code === 'MPR_IDENTIFIER' && mprInfo && (
        <MprIdentifierForm
          dossierId={id}
          currentMprId={mprInfo.mprId}
          mprStatus={mprInfo.mprStatus}
          mprReviewMessage={mprInfo.mprReviewMessage}
        />
      )}

      {/* Required Documents */}
      {requiredDocs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents requis
            </CardTitle>
            <CardDescription>
              Téléversez les documents nécessaires pour cette étape
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requiredDocs.map((docType: string) => {
                const uploadedDoc = step.documents.find(d => d.type === docType)
                const isUploaded = !!uploadedDoc
                const isValidated = uploadedDoc?.status === 'VALIDATED'
                const isRejected = uploadedDoc?.status === 'REJECTED'

                return (
                  <div
                    key={docType}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {isValidated ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : isRejected ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : isUploaded ? (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Upload className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {documentTypeLabels[docType] || docType}
                        </p>
                        {isUploaded && (
                          <p className="text-sm text-gray-500">
                            {uploadedDoc.name}
                          </p>
                        )}
                        {isRejected && uploadedDoc.rejectionReason && (
                          <p className="text-sm text-red-600">
                            Refusé : {uploadedDoc.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isValidated ? (
                        <Badge variant="success">Validé</Badge>
                      ) : isRejected ? (
                        <>
                          <Badge variant="error">Refusé</Badge>
                          <DocumentUpload
                            dossierId={id}
                            stepId={step.id}
                            documentType={docType}
                            replace
                          />
                        </>
                      ) : isUploaded ? (
                        <Badge variant="warning">En attente</Badge>
                      ) : (
                        <DocumentUpload
                          dossierId={id}
                          stepId={step.id}
                          documentType={docType}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents */}
      {step.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents téléversés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {step.documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500">
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Actions - not shown for MPR step which has its own form */}
      {(step.status === 'AVAILABLE' || step.status === 'IN_PROGRESS') && step.template.code !== 'MPR_IDENTIFIER' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <StepActionForm
              dossierId={id}
              stepId={step.id}
              stepStatus={step.status}
              canComplete={canComplete}
              missingDocs={missingDocs}
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        {previousStep && previousStep.status !== 'LOCKED' ? (
          <Link href={`/dossier/${id}/etape/${previousStep.template.code}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Étape précédente
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {nextStep && nextStep.status !== 'LOCKED' ? (
          <Link href={`/dossier/${id}/etape/${nextStep.template.code}`}>
            <Button>
              Étape suivante
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
          </Link>
        ) : (
          <Link href={`/dossier/${id}`}>
            <Button variant="outline">
              Voir le dossier
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
