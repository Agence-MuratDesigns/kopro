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
  ELIGIBILITE: 'Éligibilité',
  AUDIT: 'Audit',
  DEVIS: 'Devis',
  MPR_DEMANDE: 'MaPrimeRénov\'',
  CEE_DEMANDE: 'CEE',
  TRAVAUX: 'Travaux',
  CONTROLE: 'Contrôle',
  PAIEMENT: 'Paiement',
}

export const categoryColors: Record<string, string> = {
  ELIGIBILITE: 'bg-purple-500',
  AUDIT: 'bg-blue-500',
  DEVIS: 'bg-cyan-500',
  MPR_DEMANDE: 'bg-green-500',
  CEE_DEMANDE: 'bg-emerald-500',
  TRAVAUX: 'bg-orange-500',
  CONTROLE: 'bg-yellow-500',
  PAIEMENT: 'bg-teal-500',
}
