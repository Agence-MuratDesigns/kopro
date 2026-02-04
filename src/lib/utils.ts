import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function generateReference(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `KPR-${year}-${random}`
}

export const stepStatusLabels: Record<string, string> = {
  LOCKED: 'Verrouillé',
  AVAILABLE: 'Disponible',
  IN_PROGRESS: 'En cours',
  PENDING_VALIDATION: 'En attente de validation',
  VALIDATED: 'Validé',
  BLOCKED: 'Bloqué',
}

export const stepStatusColors: Record<string, string> = {
  LOCKED: 'bg-gray-100 text-gray-500',
  AVAILABLE: 'bg-primary-100 text-primary-700',
  IN_PROGRESS: 'bg-primary-100 text-primary-700',
  PENDING_VALIDATION: 'bg-accent-light text-accent',
  VALIDATED: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
}

export const documentTypeLabels: Record<string, string> = {
  PIECE_IDENTITE: "Pièce d'identité",
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  AVIS_IMPOSITION: "Avis d'imposition",
  TITRE_PROPRIETE: 'Titre de propriété',
  DEVIS: 'Devis',
  FACTURE: 'Facture',
  ATTESTATION_TRAVAUX: 'Attestation de travaux',
  AUDIT_ENERGETIQUE: 'Audit énergétique',
  PHOTOS_AVANT: 'Photos avant travaux',
  PHOTOS_APRES: 'Photos après travaux',
  MANDAT: "Mandat d'accompagnement",
  AUTRE: 'Autre document',
  // Documents projet (étape 3)
  TAXE_FONCIERE: 'Taxe foncière',
  CARTE_IDENTITE: "Carte d'identité",
  RIB: 'RIB',
}

export const categoryLabels: Record<string, string> = {
  ADMIN_SETUP: 'Initialisation',
  CLIENT_ACTION: 'Action client',
  FINAL: 'Finalisation',
}

export const categoryColors: Record<string, string> = {
  ADMIN_SETUP: 'bg-purple-500',
  CLIENT_ACTION: 'bg-blue-500',
  FINAL: 'bg-green-500',
}

// Types de projet de rénovation
export const PROJECT_TYPES = [
  { code: 'RENOVATION_GLOBALE', label: 'Rénovation globale' },
  { code: 'ISOLATION', label: 'Isolation' },
  { code: 'CHAUFFAGE', label: 'Chauffage' },
  { code: 'VENTILATION', label: 'Ventilation' },
  { code: 'EAU_CHAUDE', label: 'Eau chaude' },
  { code: 'AUTRE', label: 'Autre' },
] as const

export type ProjectTypeCode = typeof PROJECT_TYPES[number]['code']

// Parse les types de projet depuis la base de données (peut être JSON array ou string simple)
export function parseProjectTypes(projectType: string | null | undefined): string[] {
  if (!projectType) return []
  try {
    // Si c'est un JSON array
    if (projectType.startsWith('[')) {
      return JSON.parse(projectType)
    }
    // Sinon c'est une valeur simple
    return [projectType]
  } catch {
    return [projectType]
  }
}

// Formate les types de projet pour l'affichage
export function formatProjectTypes(projectType: string | null | undefined): string {
  const types = parseProjectTypes(projectType)
  if (types.length === 0) return ''

  return types
    .map(code => PROJECT_TYPES.find(t => t.code === code)?.label || code)
    .join(', ')
}

// Types de travaux disponibles
export const WORK_TYPES = [
  { code: 'ISOLATION', label: 'Isolation / Menuiseries' },
  { code: 'HEATING', label: 'Chauffage performant' },
  { code: 'HOT_WATER', label: 'Eau chaude sanitaire' },
  { code: 'VENTILATION', label: 'Ventilation' },
] as const

export type WorkTypeCode = typeof WORK_TYPES[number]['code']

// Types d'énergie du logement
export const ENERGY_TYPES = [
  { code: 'ELECTRICITY', label: 'Électricité' },
  { code: 'GAS', label: 'Gaz naturel' },
  { code: 'FUEL', label: 'Fioul' },
  { code: 'WOOD', label: 'Bois / Granulés' },
  { code: 'OTHER', label: 'Autre' },
] as const

export type EnergyTypeCode = typeof ENERGY_TYPES[number]['code']

// Types de logement
export const HOUSING_TYPES = [
  { code: 'HOUSE', label: 'Maison individuelle' },
  { code: 'APARTMENT', label: 'Appartement' },
] as const

export type HousingTypeCode = typeof HOUSING_TYPES[number]['code']

// Statuts de propriété
export const OWNERSHIP_STATUSES = [
  { code: 'OWNER', label: 'Propriétaire' },
  { code: 'TENANT', label: 'Locataire' },
] as const

// Catégories de revenus (barème MaPrimeRénov')
export const REVENUE_CATEGORIES = [
  { code: 'VERY_MODEST', label: 'Très modeste (MaPrimeRénov\' Bleu)' },
  { code: 'MODEST', label: 'Modeste (MaPrimeRénov\' Jaune)' },
  { code: 'INTERMEDIATE', label: 'Intermédiaire (MaPrimeRénov\' Violet)' },
  { code: 'SUPERIOR', label: 'Supérieur (MaPrimeRénov\' Rose)' },
] as const

export type RevenueCategoryCode = typeof REVENUE_CATEGORIES[number]['code']

// Documents requis pour l'étape infos projet
export const PROJECT_DOCUMENT_TYPES = [
  { code: 'TAXE_FONCIERE', label: 'Taxe foncière', description: 'Dernier avis de taxe foncière' },
  { code: 'AVIS_IMPOSITION', label: "Avis d'imposition", description: "Avis d'imposition de l'année N-1" },
  { code: 'CARTE_IDENTITE', label: "Carte d'identité", description: 'Recto-verso de votre pièce d\'identité' },
  { code: 'RIB', label: 'RIB', description: 'Relevé d\'identité bancaire' },
] as const

export type ProjectDocumentTypeCode = typeof PROJECT_DOCUMENT_TYPES[number]['code']

// Regex pour validation MPR
export const MPR_ID_REGEX = /^MPR-\d{4}[A-Z]{2}$/

// Regex pour validation du nom/prénom
export const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/

// Regex pour validation du mot de passe
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Formats de fichiers acceptés
export const ACCEPTED_FILE_TYPES = {
  PDF: ['application/pdf'],
  IMAGE: ['image/jpeg', 'image/png', 'image/jpg'],
  ALL: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
}

// Taille max des fichiers (10 Mo)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

export function calculateProgress(steps: { status: string }[]): number {
  if (!steps || steps.length === 0) return 0
  const validatedCount = steps.filter(s => s.status === 'VALIDATED').length
  return Math.round((validatedCount / steps.length) * 100)
}

// Libellés d'activité en français (pour client et artisan)
export const ACTIVITY_LABELS: Record<string, string> = {
  // Étapes
  STEP_VALIDATED: 'Étape validée',
  STEP_REJECTED: 'Correction nécessaire',
  STEP_SUBMITTED: 'Étape envoyée pour validation',
  STEP_BLOCKED: 'Étape bloquée',
  STEP_SKIPPED_DEV: 'Étape passée (dev)',
  // Identifiant MPR
  MPR_ID_SUBMITTED: 'Identifiant MPR enregistré',
  MPR_ID_VALIDATED: 'Identifiant MPR validé',
  MPR_ID_APPROVED: 'Identifiant MPR validé',
  MPR_ID_REJECTED: 'Identifiant MPR à corriger',
  APPROVED: 'Validé',
  REJECTED: 'Rejeté',
  // Mandat
  MANDATE_SUBMITTED: 'Mandat envoyé',
  MANDATE_SIGNED: 'Mandat signé',
  MANDATE_VALIDATED: 'Mandat validé',
  MANDATE_APPROVED: 'Mandat validé',
  MANDATE_REJECTED: 'Mandat rejeté',
  // Devis
  QUOTES_SUBMITTED: 'Devis envoyés',
  QUOTES_VALIDATED: 'Devis validés',
  QUOTES_REJECTED: 'Devis rejetés',
  // Factures
  INVOICES_SUBMITTED: 'Factures envoyées',
  INVOICES_VALIDATED: 'Factures validées',
  INVOICES_APPROVED: 'Factures validées',
  INVOICES_REJECTED: 'Factures rejetées',
  // Travaux
  WORKS_SELECTED: 'Travaux sélectionnés',
  WORK_STARTED: 'Début des travaux signalé',
  // Documents
  DOCUMENT_UPLOAD: 'Document ajouté',
  DOCUMENT_REJECTED: 'Document à remplacer',
  DOCUMENT_REMOVED: 'Document supprimé',
  DOCUMENT_DELETE: 'Document supprimé',
  // Profil
  PROFILE_UPDATE: 'Profil mis à jour',
  AVATAR_UPDATE: 'Photo de profil modifiée',
  AVATAR_DELETE: 'Photo de profil supprimée',
  PREFERENCES_UPDATE: 'Préférences mises à jour',
  // Messages
  MESSAGE_SENT: 'Message envoyé',
  MESSAGE_RECEIVED: 'Nouveau message reçu',
  SUPPORT_REQUEST: "Demande d'assistance envoyée",
  // Dossier
  DOSSIER_CREATED: 'Dossier créé',
  DOSSIER_FINALIZED: 'Dossier finalisé',
  DOSSIER_CLOSED: 'Dossier clôturé',
  ARTISAN_DOSSIER_CREATED: 'Dossier artisan créé',
  // Utilisateurs
  CLIENT_CREATED: 'Bienvenue sur KOPRO',
  ARTISAN_CREATED: 'Compte artisan créé',
  ARTISAN_UPDATED: 'Artisan mis à jour',
  ARTISAN_DISABLED: 'Compte artisan désactivé',
  LOGIN: 'Connexion effectuée',
  PASSWORD_CHANGED: 'Mot de passe modifié',
  EMAIL_CHANGED: 'Adresse email modifiée',
  // Informations projet
  PROJECT_INFO_SUBMITTED: 'Informations projet soumises',
  PROJECT_INFO_VALIDATED: 'Informations projet validées',
  PROJECT_INFO_REJECTED: 'Informations projet à corriger',
  PROJECT_INFO_SAVED: 'Brouillon enregistré',
  PROJECT_INFO_UPDATED_BY_ADMIN: 'Informations projet modifiées par admin',
  // Entreprise
  COMPANY_INFO_UPDATE: 'Informations entreprise mises à jour',
  // Admin
  AMOUNTS_UPDATED: 'Montants des aides mis à jour',
  PAYMENT_UPDATE: 'Statut de paiement mis à jour',
  NOTIFICATION_SETTINGS_UPDATED: 'Paramètres de notification mis à jour',
  // Paiement Stripe
  PAYMENT_INITIATED: 'Paiement initié',
  PAYMENT_COMPLETED: 'Paiement confirmé',
  PAYMENT_FAILED: 'Échec du paiement',
}

export function getActivityLabel(action: string): string {
  return ACTIVITY_LABELS[action] || action.replace(/_/g, ' ')
}

// Libellés de statut de dossier en français
export const DOSSIER_STATUS_LABELS: Record<string, string> = {
  EN_COURS: 'En cours',
  EN_ATTENTE: 'En attente',
  TERMINE: 'Terminé',
  CLOTURE: 'Clôturé',
  REFUSE: 'Refusé',
  BROUILLON: 'Brouillon',
}

export function formatDossierStatus(status: string): string {
  return DOSSIER_STATUS_LABELS[status] || status.replace(/_/g, ' ')
}

// Libellés de statut de paiement en français
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Non initié',
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  SUCCEEDED: 'Payé',
  FAILED: 'Échec',
}

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SUCCEEDED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
}

export function formatPaymentStatus(status: string | null | undefined): string {
  if (!status) return PAYMENT_STATUS_LABELS.DRAFT
  return PAYMENT_STATUS_LABELS[status] || status.replace(/_/g, ' ')
}

export function getPaymentStatusColor(status: string | null | undefined): string {
  if (!status) return PAYMENT_STATUS_COLORS.DRAFT
  return PAYMENT_STATUS_COLORS[status] || PAYMENT_STATUS_COLORS.DRAFT
}
