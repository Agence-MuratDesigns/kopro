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
  AVAILABLE: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  PENDING_VALIDATION: 'bg-purple-100 text-purple-700',
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

// Types de travaux disponibles
export const WORK_TYPES = [
  { code: 'ISOLATION', label: 'Isolation / Menuiseries' },
  { code: 'HEATING', label: 'Chauffage performant' },
  { code: 'HOT_WATER', label: 'Eau chaude sanitaire' },
  { code: 'VENTILATION', label: 'Ventilation' },
] as const

export type WorkTypeCode = typeof WORK_TYPES[number]['code']

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
