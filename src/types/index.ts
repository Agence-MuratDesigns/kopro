import type { User, Dossier, DossierStep, StepTemplate, Document, Message, Notification } from '@prisma/client'

export type UserWithoutPassword = Omit<User, 'password'>

export type DossierWithRelations = Dossier & {
  client: UserWithoutPassword
  advisor?: UserWithoutPassword | null
  steps: (DossierStep & {
    template: StepTemplate
    documents: Document[]
  })[]
  documents: Document[]
  messages: Message[]
  _count?: {
    messages: number
    documents: number
  }
}

export type StepWithTemplate = DossierStep & {
  template: StepTemplate
  documents: Document[]
}

export type NotificationWithDossier = Notification & {
  dossier?: Dossier | null
}

export interface DashboardStats {
  totalDossiers: number
  dossiersEnCours: number
  dossiersTermines: number
  dossiersEnAttente: number
  unreadNotifications: number
  unreadMessages: number
}

export interface StepValidationResult {
  success: boolean
  error?: string
  nextStep?: string
}
