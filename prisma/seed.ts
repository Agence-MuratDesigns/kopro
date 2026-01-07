import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const stepTemplates = [
  {
    code: 'ELIGIBILITE_CHECK',
    name: 'Vérification éligibilité',
    description: 'Vérification des conditions d\'éligibilité aux aides MaPrimeRénov\' et CEE',
    order: 1,
    category: 'ELIGIBILITE' as const,
    requiredDocs: JSON.stringify(['AVIS_IMPOSITION']),
    autoValidation: false,
  },
  {
    code: 'DOCUMENTS_INITIAUX',
    name: 'Documents initiaux',
    description: 'Collecte des documents d\'identité et justificatifs',
    order: 2,
    category: 'ELIGIBILITE' as const,
    requiredDocs: JSON.stringify(['PIECE_IDENTITE', 'JUSTIFICATIF_DOMICILE', 'TITRE_PROPRIETE']),
    autoValidation: false,
  },
  {
    code: 'MANDAT_SIGNATURE',
    name: 'Signature du mandat',
    description: 'Signature du mandat d\'accompagnement KOPRO',
    order: 3,
    category: 'ELIGIBILITE' as const,
    requiredDocs: JSON.stringify(['MANDAT']),
    autoValidation: false,
  },
  {
    code: 'AUDIT_ENERGETIQUE',
    name: 'Audit énergétique',
    description: 'Réalisation de l\'audit énergétique du logement',
    order: 4,
    category: 'AUDIT' as const,
    requiredDocs: JSON.stringify(['AUDIT_ENERGETIQUE', 'PHOTOS_AVANT']),
    autoValidation: false,
  },
  {
    code: 'COLLECTE_DEVIS',
    name: 'Collecte des devis',
    description: 'Obtention des devis auprès des artisans RGE',
    order: 5,
    category: 'DEVIS' as const,
    requiredDocs: JSON.stringify(['DEVIS']),
    autoValidation: false,
  },
  {
    code: 'VALIDATION_DEVIS',
    name: 'Validation des devis',
    description: 'Validation technique et conformité des devis par KOPRO',
    order: 6,
    category: 'DEVIS' as const,
    requiredDocs: null,
    autoValidation: false,
  },
  {
    code: 'DEMANDE_MPR',
    name: 'Dépôt demande MaPrimeRénov\'',
    description: 'Constitution et dépôt du dossier sur la plateforme MaPrimeRénov\'',
    order: 7,
    category: 'MPR_DEMANDE' as const,
    requiredDocs: null,
    autoValidation: false,
  },
  {
    code: 'ACCORD_MPR',
    name: 'Accord MaPrimeRénov\'',
    description: 'Réception et validation de l\'accord de principe MaPrimeRénov\'',
    order: 8,
    category: 'MPR_DEMANDE' as const,
    requiredDocs: null,
    autoValidation: false,
  },
  {
    code: 'DEMANDE_CEE',
    name: 'Dépôt demande CEE',
    description: 'Constitution et dépôt de la demande de Certificats d\'Économie d\'Énergie',
    order: 9,
    category: 'CEE_DEMANDE' as const,
    requiredDocs: null,
    autoValidation: false,
  },
  {
    code: 'DEMARRAGE_TRAVAUX',
    name: 'Démarrage des travaux',
    description: 'Confirmation du démarrage des travaux avec les artisans',
    order: 10,
    category: 'TRAVAUX' as const,
    requiredDocs: null,
    autoValidation: false,
  },
  {
    code: 'SUIVI_TRAVAUX',
    name: 'Suivi des travaux',
    description: 'Suivi de l\'avancement et des étapes intermédiaires',
    order: 11,
    category: 'TRAVAUX' as const,
    requiredDocs: null,
    autoValidation: false,
  },
  {
    code: 'FIN_TRAVAUX',
    name: 'Fin des travaux',
    description: 'Confirmation de la fin des travaux et collecte des justificatifs',
    order: 12,
    category: 'TRAVAUX' as const,
    requiredDocs: JSON.stringify(['FACTURE', 'PHOTOS_APRES', 'ATTESTATION_TRAVAUX']),
    autoValidation: false,
  },
  {
    code: 'CONTROLE_CONFORMITE',
    name: 'Contrôle de conformité',
    description: 'Vérification de la conformité des travaux réalisés',
    order: 13,
    category: 'CONTROLE' as const,
    requiredDocs: null,
    autoValidation: false,
  },
  {
    code: 'SOLDE_MPR',
    name: 'Demande solde MaPrimeRénov\'',
    description: 'Dépôt de la demande de versement du solde MaPrimeRénov\'',
    order: 14,
    category: 'PAIEMENT' as const,
    requiredDocs: null,
    autoValidation: false,
  },
  {
    code: 'VERSEMENT_CEE',
    name: 'Versement prime CEE',
    description: 'Réception du versement de la prime CEE',
    order: 15,
    category: 'PAIEMENT' as const,
    requiredDocs: null,
    autoValidation: false,
  },
  {
    code: 'CLOTURE_DOSSIER',
    name: 'Clôture du dossier',
    description: 'Finalisation et archivage du dossier complet',
    order: 16,
    category: 'PAIEMENT' as const,
    requiredDocs: null,
    autoValidation: true,
  },
]

async function main() {
  console.log('Seeding database...')

  // Create step templates
  for (const template of stepTemplates) {
    await prisma.stepTemplate.upsert({
      where: { code: template.code },
      update: template,
      create: template,
    })
  }
  console.log('Step templates created')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@kopro.fr' },
    update: {},
    create: {
      email: 'admin@kopro.fr',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'KOPRO',
      role: 'ADMIN',
    },
  })
  console.log('Admin user created')

  // Create advisor user
  await prisma.user.upsert({
    where: { email: 'conseiller@kopro.fr' },
    update: {},
    create: {
      email: 'conseiller@kopro.fr',
      password: hashedPassword,
      firstName: 'Marie',
      lastName: 'Dupont',
      role: 'ADVISOR',
    },
  })
  console.log('Advisor user created')

  // Create demo client
  const clientPassword = await bcrypt.hash('client123', 12)
  const client = await prisma.user.upsert({
    where: { email: 'client@exemple.fr' },
    update: {},
    create: {
      email: 'client@exemple.fr',
      password: clientPassword,
      firstName: 'Jean',
      lastName: 'Martin',
      phone: '0612345678',
      role: 'CLIENT',
    },
  })
  console.log('Demo client created')

  // Create demo dossier
  const dossier = await prisma.dossier.upsert({
    where: { reference: 'KPR-2024-0001' },
    update: {},
    create: {
      reference: 'KPR-2024-0001',
      clientId: client.id,
      projectType: 'Rénovation globale',
      projectAddress: '15 rue de la Paix',
      projectCity: 'Paris',
      projectPostalCode: '75001',
      estimatedBudget: 35000,
      revenueCategory: 'Modeste',
      householdSize: 3,
    },
  })

  // Create dossier steps
  const templates = await prisma.stepTemplate.findMany({ orderBy: { order: 'asc' } })
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i]
    const status = i === 0 ? 'AVAILABLE' : 'LOCKED'

    await prisma.dossierStep.upsert({
      where: {
        dossierId_templateId: {
          dossierId: dossier.id,
          templateId: template.id,
        },
      },
      update: { status },
      create: {
        dossierId: dossier.id,
        templateId: template.id,
        status,
        startedAt: i === 0 ? new Date() : null,
      },
    })
  }
  console.log('Demo dossier and steps created')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
