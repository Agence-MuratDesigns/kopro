'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Info,
  Home,
  Upload,
  FileText,
  Trash2,
  Eye,
  X,
  Download,
  Save,
  Send,
  MessageCircle,
  Pencil,
} from 'lucide-react'
import {
  ENERGY_TYPES,
  HOUSING_TYPES,
  REVENUE_CATEGORIES,
  PROJECT_DOCUMENT_TYPES,
} from '@/lib/utils'
import { useChat } from '@/contexts/chat-context'

interface ProjectDocument {
  id: string
  name: string
  type: string
  status: string
  url: string
}

interface ProjectInfoFormProps {
  dossierId: string
  projectInfoStatus: string
  projectInfoReviewMessage: string | null
  projectInfoLastSavedAt?: string | null
  // Données existantes
  energyType: string | null
  housingType: string | null
  housingSurface: number | null
  constructionYear: number | null
  revenueCategory: string | null
  householdSize: number | null
  ownershipStatus: string | null
  // Documents uploadés
  documents: ProjectDocument[]
}

export function ProjectInfoForm({
  dossierId,
  projectInfoStatus,
  projectInfoReviewMessage,
  projectInfoLastSavedAt: initialLastSavedAt,
  energyType: initialEnergyType,
  housingType: initialHousingType,
  housingSurface: initialHousingSurface,
  constructionYear: initialConstructionYear,
  revenueCategory: initialRevenueCategory,
  householdSize: initialHouseholdSize,
  ownershipStatus: initialOwnershipStatus,
  documents: initialDocuments,
}: ProjectInfoFormProps) {
  const router = useRouter()
  const { openChat } = useChat()

  // Form state
  const [energyType, setEnergyType] = useState(initialEnergyType || '')
  const [housingType, setHousingType] = useState(initialHousingType || '')
  const [housingSurface, setHousingSurface] = useState(initialHousingSurface?.toString() || '')
  const [constructionYear, setConstructionYear] = useState(initialConstructionYear?.toString() || '')
  const [revenueCategory, setRevenueCategory] = useState(initialRevenueCategory || '')
  const [householdSize, setHouseholdSize] = useState(initialHouseholdSize?.toString() || '')
  const [ownershipStatus, setOwnershipStatus] = useState(initialOwnershipStatus || '')

  // Documents state
  const [documents, setDocuments] = useState<ProjectDocument[]>(initialDocuments)
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isCertified, setIsCertified] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initialLastSavedAt ? new Date(initialLastSavedAt) : null
  )

  // Mode édition: actif par défaut si DRAFT ou REJECTED, ou si l'utilisateur clique sur "Modifier"
  const [isEditing, setIsEditing] = useState(
    projectInfoStatus === 'DRAFT' || projectInfoStatus === 'REJECTED' || !initialEnergyType
  )

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null)

  // Check if all required documents are uploaded
  const requiredDocTypes = PROJECT_DOCUMENT_TYPES.map(d => d.code)
  const uploadedDocTypes = documents.map(d => d.type)
  const missingDocTypes = requiredDocTypes.filter(t => !uploadedDocTypes.includes(t))
  const allDocsUploaded = missingDocTypes.length === 0

  // Count filled fields
  const filledFieldsCount = [
    energyType,
    housingType,
    housingSurface,
    constructionYear,
    revenueCategory,
    householdSize,
    ownershipStatus,
  ].filter(Boolean).length
  const totalFields = 7
  const totalDocs = requiredDocTypes.length
  const uploadedDocsCount = documents.length

  // Calculate progress
  const progressPercent = Math.round(
    ((filledFieldsCount + uploadedDocsCount) / (totalFields + totalDocs)) * 100
  )

  // Check if form is complete
  const isFormComplete =
    energyType &&
    housingType &&
    housingSurface &&
    constructionYear &&
    revenueCategory &&
    householdSize &&
    ownershipStatus &&
    allDocsUploaded

  const canSubmit = isFormComplete && isCertified
  const hasAnyData = filledFieldsCount > 0 || uploadedDocsCount > 0

  // Format relative time
  const formatRelativeTime = useCallback((date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'à l\'instant'
    if (diffMins < 60) return `il y a ${diffMins} min`
    if (diffHours < 24) return `il y a ${diffHours}h`
    return `il y a ${diffDays}j`
  }, [])

  // Update relative time every minute
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const handleFileUpload = async (docType: string, file: File) => {
    if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
      setError('Seuls les fichiers PDF et images sont acceptés')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier ne doit pas dépasser 10 Mo')
      return
    }

    setUploadingDoc(docType)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', docType)

      const response = await fetch(`/api/dossiers/${dossierId}/project-documents`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'upload')
        return
      }

      // Update documents list
      setDocuments(prev => {
        const filtered = prev.filter(d => d.type !== docType)
        return [...filtered, data.document]
      })
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/project-documents/${docId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
        return
      }

      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch {
      setError('Erreur de connexion au serveur')
    }
  }

  // Sauvegarde partielle (brouillon)
  const handleSave = async () => {
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/project-info`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          energyType: energyType || null,
          housingType: housingType || null,
          housingSurface: housingSurface ? parseFloat(housingSurface) : null,
          constructionYear: constructionYear ? parseInt(constructionYear) : null,
          revenueCategory: revenueCategory || null,
          householdSize: householdSize ? parseInt(householdSize) : null,
          ownershipStatus: ownershipStatus || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'enregistrement')
        return
      }

      setLastSavedAt(new Date(data.lastSavedAt))
      setSuccess('Informations enregistrées')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsSaving(false)
    }
  }

  // Soumission pour validation admin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isFormComplete) {
      setError('Veuillez remplir tous les champs et déposer tous les documents requis')
      return
    }

    if (!isCertified) {
      setError('Veuillez certifier que les informations sont exactes')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/dossiers/${dossierId}/project-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          energyType,
          housingType,
          housingSurface: parseFloat(housingSurface),
          constructionYear: parseInt(constructionYear),
          revenueCategory,
          householdSize: parseInt(householdSize),
          ownershipStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la soumission')
        return
      }

      setSuccess('Informations soumises ! Votre dossier est en attente de vérification.')
      setIsEditing(false)
      setIsCertified(false)
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  // Ouvrir le chat avec message pré-rempli pour contacter le support
  const handleContactSupport = () => {
    const message = "Bonjour, je souhaite modifier mes informations de l'étape 3 (Informations du projet). Pouvez-vous m'aider ?"
    openChat(dossierId, message)
  }

  const getStatusDisplay = () => {
    switch (projectInfoStatus) {
      case 'PENDING_REVIEW':
        return {
          icon: <Clock className="h-5 w-5 text-amber-500" />,
          badge: <Badge variant="warning">En attente de vérification</Badge>,
          message: 'Vos informations sont en cours de vérification par notre équipe.',
          canEdit: true, // Peut modifier tant que pas validé
          showModifyButton: true,
        }
      case 'APPROVED':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: <Badge variant="success">Validé</Badge>,
          message: 'Vos informations ont été validées. Vous pouvez passer à l\'étape suivante.',
          canEdit: false, // Ne peut plus modifier après validation
          showModifyButton: false,
        }
      case 'REJECTED':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          badge: <Badge variant="error">Rejeté</Badge>,
          message: projectInfoReviewMessage || 'Vos informations ont été rejetées. Veuillez les corriger.',
          canEdit: true,
          showModifyButton: false, // Déjà en mode édition
        }
      default:
        return {
          icon: <Home className="h-5 w-5 text-gray-400" />,
          badge: <Badge variant="secondary">À compléter</Badge>,
          message: null,
          canEdit: true,
          showModifyButton: false,
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  const getDocumentForType = (type: string) => {
    return documents.find(d => d.type === type)
  }

  // Render progress bar
  const renderProgressBar = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Progression : {filledFieldsCount}/{totalFields} champs, {uploadedDocsCount}/{totalDocs} documents
        </span>
        <span className="font-medium text-primary-600">{progressPercent}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {lastSavedAt && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Save className="h-3 w-3" />
          Dernière sauvegarde : {formatRelativeTime(lastSavedAt)}
        </div>
      )}
    </div>
  )

  // Render read-only summary
  const renderReadOnlySummary = () => (
    <div className="space-y-6">
      {/* Infos logement - Read only */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Type de logement</p>
          <p className="font-medium">
            {HOUSING_TYPES.find(t => t.code === initialHousingType)?.label || '-'}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Statut</p>
          <p className="font-medium">
            {initialOwnershipStatus === 'OWNER' ? 'Propriétaire' : initialOwnershipStatus === 'TENANT' ? 'Locataire' : '-'}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Surface</p>
          <p className="font-medium">{initialHousingSurface ? `${initialHousingSurface} m²` : '-'}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Année de construction</p>
          <p className="font-medium">{initialConstructionYear || '-'}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Énergie de chauffage</p>
          <p className="font-medium">
            {ENERGY_TYPES.find(t => t.code === initialEnergyType)?.label || '-'}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Catégorie de revenus</p>
          <p className="font-medium">
            {REVENUE_CATEGORIES.find(c => c.code === initialRevenueCategory)?.label || '-'}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Personnes dans le foyer</p>
          <p className="font-medium">{initialHouseholdSize || '-'}</p>
        </div>
      </div>

      {/* Documents - Read only */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Documents déposés ({documents.length}/{totalDocs})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{doc.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(doc)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusDisplay.icon}
            <div>
              <CardTitle>Informations du projet</CardTitle>
              <CardDescription>
                Complétez les informations de votre logement et déposez les documents requis
              </CardDescription>
            </div>
          </div>
          {statusDisplay.badge}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Message */}
        {statusDisplay.message && (
          <Alert
            variant={
              projectInfoStatus === 'APPROVED' ? 'success' : projectInfoStatus === 'REJECTED' ? 'error' : 'info'
            }
            title={
              projectInfoStatus === 'APPROVED'
                ? 'Informations validées'
                : projectInfoStatus === 'REJECTED'
                ? 'Informations rejetées'
                : 'En cours de vérification'
            }
          >
            {statusDisplay.message}
          </Alert>
        )}

        {/* Message pour contacter le support après validation */}
        {projectInfoStatus === 'APPROVED' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium mb-2">
                  Cette étape a été validée
                </p>
                <p className="text-sm text-amber-700 mb-3">
                  Pour toute modification, veuillez contacter notre équipe.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleContactSupport}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter le support
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions (seulement si en édition) */}
        {statusDisplay.canEdit && isEditing && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Vous pouvez compléter ce formulaire en plusieurs fois</p>
                <p>
                  Enregistrez vos données à tout moment avec le bouton "Enregistrer".
                  Vous pourrez revenir plus tard pour finaliser.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar (seulement si en édition) */}
        {statusDisplay.canEdit && isEditing && renderProgressBar()}

        {/* Form */}
        {statusDisplay.canEdit && isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="error" title="Erreur">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" title="Succès">
                {success}
              </Alert>
            )}

            {/* Section 1: Informations logement */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                Informations sur le logement
                <span className="text-sm font-normal text-gray-500">
                  ({[housingType, ownershipStatus, housingSurface, constructionYear, energyType].filter(Boolean).length}/5)
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type de logement */}
                <div>
                  <label htmlFor="housingType" className="block text-sm font-medium text-gray-700 mb-2">
                    Type de logement {housingType ? <CheckCircle className="inline h-3 w-3 text-green-500" /> : '*'}
                  </label>
                  <select
                    id="housingType"
                    value={housingType}
                    onChange={(e) => setHousingType(e.target.value)}
                    disabled={isLoading || isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Sélectionner...</option>
                    {HOUSING_TYPES.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Statut propriétaire */}
                <div>
                  <label htmlFor="ownershipStatus" className="block text-sm font-medium text-gray-700 mb-2">
                    Vous êtes {ownershipStatus ? <CheckCircle className="inline h-3 w-3 text-green-500" /> : '*'}
                  </label>
                  <select
                    id="ownershipStatus"
                    value={ownershipStatus}
                    onChange={(e) => setOwnershipStatus(e.target.value)}
                    disabled={isLoading || isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="OWNER">Propriétaire</option>
                    <option value="TENANT">Locataire</option>
                  </select>
                </div>

                {/* Surface */}
                <div>
                  <label htmlFor="housingSurface" className="block text-sm font-medium text-gray-700 mb-2">
                    Surface habitable (m²) {housingSurface ? <CheckCircle className="inline h-3 w-3 text-green-500" /> : '*'}
                  </label>
                  <Input
                    id="housingSurface"
                    type="number"
                    min="1"
                    max="1000"
                    value={housingSurface}
                    onChange={(e) => setHousingSurface(e.target.value)}
                    placeholder="Ex: 85"
                    disabled={isLoading || isSaving}
                  />
                </div>

                {/* Année construction */}
                <div>
                  <label htmlFor="constructionYear" className="block text-sm font-medium text-gray-700 mb-2">
                    Année de construction {constructionYear ? <CheckCircle className="inline h-3 w-3 text-green-500" /> : '*'}
                  </label>
                  <Input
                    id="constructionYear"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={constructionYear}
                    onChange={(e) => setConstructionYear(e.target.value)}
                    placeholder="Ex: 1985"
                    disabled={isLoading || isSaving}
                  />
                </div>

                {/* Type d'énergie */}
                <div>
                  <label htmlFor="energyType" className="block text-sm font-medium text-gray-700 mb-2">
                    Énergie de chauffage actuelle {energyType ? <CheckCircle className="inline h-3 w-3 text-green-500" /> : '*'}
                  </label>
                  <select
                    id="energyType"
                    value={energyType}
                    onChange={(e) => setEnergyType(e.target.value)}
                    disabled={isLoading || isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Sélectionner...</option>
                    {ENERGY_TYPES.map((type) => (
                      <option key={type.code} value={type.code}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Situation du foyer */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                Situation du foyer
                <span className="text-sm font-normal text-gray-500">
                  ({[revenueCategory, householdSize].filter(Boolean).length}/2)
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Catégorie revenus */}
                <div>
                  <label htmlFor="revenueCategory" className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie de revenus {revenueCategory ? <CheckCircle className="inline h-3 w-3 text-green-500" /> : '*'}
                  </label>
                  <select
                    id="revenueCategory"
                    value={revenueCategory}
                    onChange={(e) => setRevenueCategory(e.target.value)}
                    disabled={isLoading || isSaving}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Sélectionner...</option>
                    {REVENUE_CATEGORIES.map((cat) => (
                      <option key={cat.code} value={cat.code}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Consultez votre avis d'imposition pour déterminer votre catégorie
                  </p>
                </div>

                {/* Nombre de personnes */}
                <div>
                  <label htmlFor="householdSize" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de personnes dans le foyer {householdSize ? <CheckCircle className="inline h-3 w-3 text-green-500" /> : '*'}
                  </label>
                  <Input
                    id="householdSize"
                    type="number"
                    min="1"
                    max="20"
                    value={householdSize}
                    onChange={(e) => setHouseholdSize(e.target.value)}
                    placeholder="Ex: 3"
                    disabled={isLoading || isSaving}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Documents obligatoires */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                Documents obligatoires
                <span className={`text-sm font-normal ${allDocsUploaded ? 'text-green-600' : 'text-amber-600'}`}>
                  ({uploadedDocsCount}/{totalDocs})
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROJECT_DOCUMENT_TYPES.map((docType) => {
                  const uploadedDoc = getDocumentForType(docType.code)
                  const isUploading = uploadingDoc === docType.code

                  return (
                    <div
                      key={docType.code}
                      className={`p-4 border rounded-lg ${
                        uploadedDoc
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            {uploadedDoc ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-400" />
                            )}
                            {docType.label}
                          </h4>
                          <p className="text-xs text-gray-500">{docType.description}</p>
                        </div>
                      </div>

                      {uploadedDoc ? (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(uploadedDoc)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50"
                          >
                            <Eye className="h-3 w-3" />
                            Voir
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(uploadedDoc.id)}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <label className="block">
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(docType.code, file)
                              }}
                              disabled={isUploading || isLoading || isSaving}
                              className="hidden"
                            />
                            <div className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-200 rounded-lg cursor-pointer hover:bg-primary-50">
                              {isUploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Envoi...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4" />
                                  Déposer le document
                                </>
                              )}
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Certification checkbox (seulement si formulaire complet) */}
            {isFormComplete && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCertified}
                    onChange={(e) => setIsCertified(e.target.checked)}
                    disabled={isLoading || isSaving}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-amber-800">
                    Je certifie que les informations renseignées sont exactes et que les documents
                    fournis sont authentiques.
                  </span>
                </label>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                disabled={isLoading || isSaving || !hasAnyData}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>

              <Button
                type="submit"
                disabled={isLoading || isSaving || !canSubmit}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Soumettre pour validation
                  </>
                )}
              </Button>
            </div>

            {!isFormComplete && (
              <p className="text-sm text-gray-500">
                * Le bouton "Soumettre" sera activé une fois tous les champs remplis et documents déposés.
              </p>
            )}
          </form>
        ) : !statusDisplay.canEdit ? (
          /* Read-only display for APPROVED */
          renderReadOnlySummary()
        ) : statusDisplay.showModifyButton && !isEditing ? (
          /* PENDING_REVIEW with modify button */
          <div className="space-y-6">
            {renderReadOnlySummary()}

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(true)
                  setIsCertified(false)
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Modifier mes informations
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Vous pouvez modifier vos informations tant qu'elles n'ont pas été validées par notre équipe.
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{previewDoc.name}</h3>
                  <p className="text-xs text-gray-500">
                    {PROJECT_DOCUMENT_TYPES.find(t => t.code === previewDoc.type)?.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden bg-gray-100 p-4">
              <iframe
                src={previewDoc.url}
                className="w-full h-full min-h-[60vh] rounded-lg border border-gray-200 bg-white"
                title="Aperçu du document"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
