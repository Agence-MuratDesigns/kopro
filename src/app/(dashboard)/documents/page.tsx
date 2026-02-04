import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, WORK_TYPES } from '@/lib/utils'
import Link from 'next/link'
import {
  FileText,
  Download,
  FolderOpen,
  File,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'

const documentCategories = {
  administrative: {
    label: 'Documents administratifs',
    types: ['MANDAT', 'ATTESTATION'],
    icon: FileText,
  },
  technical: {
    label: 'Documents techniques',
    types: ['DEVIS', 'FACTURE'],
    icon: File,
  },
  other: {
    label: 'Autres documents',
    types: ['JUSTIFICATIF_DOMICILE', 'JUSTIFICATIF_IDENTITE', 'AVIS_IMPOSITION', 'AUDIT_ENERGETIQUE', 'PHOTOS_AVANT', 'PHOTOS_APRES', 'AUTRE'],
    icon: FolderOpen,
  },
}

const documentTypeLabels: Record<string, string> = {
  MANDAT: "Mandat d'accompagnement",
  ATTESTATION: 'Attestation',
  DEVIS: 'Devis',
  FACTURE: 'Facture',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  JUSTIFICATIF_IDENTITE: "Justificatif d'identité",
  AVIS_IMPOSITION: "Avis d'imposition",
  AUDIT_ENERGETIQUE: 'Audit énergétique',
  PHOTOS_AVANT: 'Photos avant travaux',
  PHOTOS_APRES: 'Photos après travaux',
  AUTRE: 'Autre document',
}

export default async function DocumentsPage() {
  const user = await requireAuth()
  const isArtisan = user.role === 'ARTISAN'

  // Get all dossiers with their documents
  const dossiers = await prisma.dossier.findMany({
    where: isArtisan
      ? { artisanId: user.id }
      : { clientId: user.id },
    include: {
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group documents by category for each dossier
  const dossiersWithCategories = dossiers.map(dossier => {
    const categorizedDocs = {
      administrative: dossier.documents.filter(d =>
        documentCategories.administrative.types.includes(d.type)
      ),
      technical: dossier.documents.filter(d =>
        documentCategories.technical.types.includes(d.type)
      ),
      other: dossier.documents.filter(d =>
        documentCategories.other.types.includes(d.type)
      ),
    }
    return { ...dossier, categorizedDocs }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Validé</Badge>
      case 'REJECTED':
        return <Badge variant="error" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Refusé</Badge>
      default:
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" />En attente</Badge>
    }
  }

  const getWorkTypeLabel = (workType: string | null) => {
    if (!workType) return null
    const work = WORK_TYPES.find(w => w.code === workType)
    return work?.label || workType
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-kopro-dark">Mes documents</h1>
        <p className="text-kopro-grey mt-2 text-lg">
          Retrouvez tous les documents liés à vos dossiers de rénovation
        </p>
      </div>

      {dossiers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun document disponible</p>
            <p className="text-sm text-gray-400 mt-1">
              Vos documents apparaîtront ici une fois votre dossier créé
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {dossiersWithCategories.map(dossier => (
            <Card key={dossier.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Dossier {dossier.reference}
                    </CardTitle>
                    <CardDescription>
                      Créé le {formatDate(dossier.createdAt)}
                      {dossier.status === 'CLOTURE' && ' • Clôturé'}
                    </CardDescription>
                  </div>
                  <Badge variant={dossier.status === 'CLOTURE' ? 'success' : 'info'}>
                    {dossier.status === 'CLOTURE' ? 'Clôturé' : 'En cours'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {dossier.documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FolderOpen className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p>Aucun document dans ce dossier</p>
                  </div>
                ) : (
                  <>
                    {/* Administrative Documents */}
                    {dossier.categorizedDocs.administrative.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          Documents administratifs
                        </h4>
                        <div className="space-y-2">
                          {dossier.categorizedDocs.administrative.map(doc => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <File className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{doc.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>{documentTypeLabels[doc.type] || doc.type}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(doc.uploadedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getStatusBadge(doc.status)}
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Technical Documents */}
                    {dossier.categorizedDocs.technical.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <File className="h-4 w-4 text-green-500" />
                          Documents techniques
                        </h4>
                        <div className="space-y-2">
                          {dossier.categorizedDocs.technical.map(doc => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <File className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{doc.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>{documentTypeLabels[doc.type] || doc.type}</span>
                                    {doc.workType && (
                                      <>
                                        <span>•</span>
                                        <span className="text-primary-600">{getWorkTypeLabel(doc.workType)}</span>
                                      </>
                                    )}
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(doc.uploadedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getStatusBadge(doc.status)}
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other Documents */}
                    {dossier.categorizedDocs.other.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-amber-500" />
                          Autres documents
                        </h4>
                        <div className="space-y-2">
                          {dossier.categorizedDocs.other.map(doc => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <File className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">{doc.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>{documentTypeLabels[doc.type] || doc.type}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {formatDate(doc.uploadedAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {getStatusBadge(doc.status)}
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Link to dossier detail */}
                <div className="pt-4 border-t">
                  <Link href={`/dossier/${dossier.id}`}>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Voir le dossier complet
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info about document access */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Accès à vos documents</p>
              <p>
                Tous vos documents sont conservés et accessibles à tout moment.
                Une fois validés, ils ne peuvent plus être modifiés pour garantir l'intégrité de votre dossier.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
