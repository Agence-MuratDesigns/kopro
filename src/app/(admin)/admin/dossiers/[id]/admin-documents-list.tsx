'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, documentTypeLabels } from '@/lib/utils'
import { FileText, Eye, X, Download } from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  status: string
  filePath: string
  uploadedAt: string
  workType?: string | null
  fileSize?: number | null
}

interface AdminDocumentsListProps {
  documents: Document[]
  pendingCount: number
}

export function AdminDocumentsList({ documents, pendingCount }: AdminDocumentsListProps) {
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)

  const mandats = documents.filter(d => d.type === 'MANDAT')
  const devis = documents.filter(d => d.type === 'DEVIS')
  const factures = documents.filter(d => d.type === 'FACTURE')
  const autres = documents.filter(d => !['MANDAT', 'DEVIS', 'FACTURE'].includes(d.type))

  const getStatusBadge = (status: string) => {
    const variant = status === 'VALIDATED' ? 'success'
      : status === 'REJECTED' ? 'error'
      : 'warning'
    const label = status === 'VALIDATED' ? 'Validé'
      : status === 'REJECTED' ? 'Refusé'
      : 'En attente'
    return <Badge variant={variant}>{label}</Badge>
  }

  const handleDownloadDocument = (doc: Document) => {
    window.open(doc.filePath, '_blank')
  }

  const DocumentRow = ({ doc, iconColor }: { doc: Document; iconColor: string }) => (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      {/* Miniature cliquable */}
      <button
        type="button"
        onClick={() => setPreviewDocument(doc)}
        className="relative flex-shrink-0 w-12 h-14 bg-white border border-gray-200 rounded-md overflow-hidden hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
      >
        <iframe
          src={doc.filePath}
          className="w-full h-full pointer-events-none scale-[0.5] origin-top-left"
          style={{ width: '200%', height: '200%' }}
          title="Aperçu"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </button>

      {/* Infos du document */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{doc.name}</p>
        <p className="text-xs text-gray-500">
          {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} Ko • PDF` : 'PDF'}
          {doc.workType && <span className={iconColor}> • {doc.workType}</span>}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {getStatusBadge(doc.status)}
        <button
          type="button"
          onClick={() => setPreviewDocument(doc)}
          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title="Voir le document"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Documents ({documents.length})</span>
            {pendingCount > 0 && (
              <Badge variant="warning">{pendingCount} à vérifier</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucun document
            </p>
          ) : (
            <div className="space-y-6">
              {/* Mandats */}
              {mandats.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Mandat administratif
                  </h4>
                  <div className="space-y-2">
                    {mandats.map(doc => (
                      <DocumentRow key={doc.id} doc={doc} iconColor="text-purple-600" />
                    ))}
                  </div>
                </div>
              )}

              {/* Devis */}
              {devis.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Devis ({devis.length})
                  </h4>
                  <div className="space-y-2">
                    {devis.map(doc => (
                      <DocumentRow key={doc.id} doc={doc} iconColor="text-blue-600" />
                    ))}
                  </div>
                </div>
              )}

              {/* Factures */}
              {factures.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Factures ({factures.length})
                  </h4>
                  <div className="space-y-2">
                    {factures.map(doc => (
                      <DocumentRow key={doc.id} doc={doc} iconColor="text-green-600" />
                    ))}
                  </div>
                </div>
              )}

              {/* Autres documents */}
              {autres.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                    Autres documents
                  </h4>
                  <div className="space-y-2">
                    {autres.map(doc => (
                      <DocumentRow key={doc.id} doc={doc} iconColor="text-gray-600" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de prévisualisation */}
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
                    {previewDocument.fileSize ? `${(previewDocument.fileSize / 1024).toFixed(1)} Ko • ` : ''}PDF • {documentTypeLabels[previewDocument.type]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDocument(previewDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
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
                src={previewDocument.filePath}
                className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200 bg-white"
                title="Aperçu du document"
              />
            </div>

            {/* Footer de la modal */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                {getStatusBadge(previewDocument.status)}
                {previewDocument.workType && (
                  <span className="text-sm text-gray-500">{previewDocument.workType}</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPreviewDocument(null)}
                >
                  Fermer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadDocument(previewDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
