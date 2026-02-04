'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  FileText,
  Download,
  Eye,
  X,
  Loader2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  workType: string | null
  fileName: string
  fileSize: number
  status: string
  uploadedAt: string
}

interface DossierDocumentsCardProps {
  dossierId: string
  documents: Document[]
}

// Types de documents par catégorie
const ADMIN_TYPES = ['MANDAT', 'ATTESTATION']
const TECH_TYPES = ['DEVIS', 'FACTURE']

// Labels français pour les types de documents
const typeLabels: Record<string, string> = {
  DEVIS: 'Devis',
  FACTURE: 'Facture',
  MANDAT: 'Mandat',
  ATTESTATION: 'Attestation',
  TAXE_FONCIERE: 'Taxe foncière',
  AVIS_IMPOSITION: 'Avis d\'imposition',
  CARTE_IDENTITE: 'Carte d\'identité',
  RIB: 'RIB',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  AUDIT_ENERGETIQUE: 'Audit énergétique',
  PHOTOS_AVANT: 'Photos avant travaux',
  PHOTOS_APRES: 'Photos après travaux',
  AUTRE: 'Autre document',
}

// Mapping des types de travaux
const workTypeLabels: Record<string, string> = {
  ISOLATION: 'Isolation',
  HEATING: 'Chauffage',
  HOT_WATER: 'Eau chaude',
  VENTILATION: 'Ventilation',
}

export function DossierDocumentsCard({ dossierId, documents }: DossierDocumentsCardProps) {
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    admin: false,
    tech: false,
    other: false,
  })

  // Filtrer uniquement les documents validés
  const validatedDocuments = documents.filter(d => d.status === 'VALIDATED')

  // Grouper les documents validés par catégorie
  const adminDocs = validatedDocuments.filter(d => ADMIN_TYPES.includes(d.type))
  const techDocs = validatedDocuments.filter(d => TECH_TYPES.includes(d.type))
  const otherDocs = validatedDocuments.filter(d => !ADMIN_TYPES.includes(d.type) && !TECH_TYPES.includes(d.type))

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const handleDownloadDocument = async (docId: string, docName: string) => {
    setDownloadingDoc(docId)
    try {
      const response = await fetch(`/api/dossiers/${dossierId}/documents/${docId}/download`)
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = docName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Erreur lors du téléchargement du document')
    } finally {
      setDownloadingDoc(null)
    }
  }

  const renderDocumentItem = (doc: Document) => {
    return (
      <div
        key={doc.id}
        className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
      >
        {/* Ligne principale : nom + actions */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-gray-900 text-sm">
            {doc.name}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewDocument(doc)}
              title="Aperçu"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
              disabled={downloadingDoc === doc.id}
              title="Télécharger"
            >
              {downloadingDoc === doc.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {/* Ligne secondaire : métadonnées */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <span>{typeLabels[doc.type] || doc.type}</span>
          {doc.workType && (
            <>
              <span>•</span>
              <span>{workTypeLabels[doc.workType] || doc.workType}</span>
            </>
          )}
          <span>•</span>
          <span>{(doc.fileSize / 1024).toFixed(1)} Ko</span>
        </div>
      </div>
    )
  }

  const renderCategory = (
    title: string,
    docs: Document[],
    categoryKey: string
  ) => {
    const isExpanded = expandedCategories[categoryKey]

    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => toggleCategory(categoryKey)}
          className="flex items-center justify-between w-full text-left py-2 px-1 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
            <span className="font-medium text-gray-700 text-sm">{title}</span>
            <Badge variant="secondary" className="text-xs">
              {docs.length}
            </Badge>
          </div>
        </button>

        {isExpanded && (
          <div className="space-y-2 pl-6">
            {docs.length > 0 ? (
              docs.map(renderDocumentItem)
            ) : (
              <p className="text-sm text-gray-400 italic py-2">
                Aucun document
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Documents du dossier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <FolderOpen className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Aucun document dans ce dossier
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Les documents apparaîtront ici au fur et à mesure de votre parcours
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Documents du dossier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminDocs.length > 0 && renderCategory('Documents administratifs', adminDocs, 'admin')}
          {techDocs.length > 0 && renderCategory('Documents techniques', techDocs, 'tech')}
          {otherDocs.length > 0 && renderCategory('Autres documents', otherDocs, 'other')}
        </CardContent>
      </Card>

      {/* Modal d'aperçu du fichier */}
      {previewDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewDocument(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header de la modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 truncate max-w-md">
                    {previewDocument.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {(previewDocument.fileSize / 1024).toFixed(1)} Ko
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(previewDocument.id, previewDocument.fileName)}
                  disabled={downloadingDoc === previewDocument.id}
                >
                  {downloadingDoc === previewDocument.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Télécharger
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenu de l'aperçu */}
            <div className="flex-1 overflow-hidden bg-gray-100 p-4">
              <iframe
                src={`/api/dossiers/${dossierId}/documents/${previewDocument.id}/view`}
                className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200 bg-white"
                title="Aperçu du document"
              />
            </div>

            {/* Footer de la modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button variant="outline" onClick={() => setPreviewDocument(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
