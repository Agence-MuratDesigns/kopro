import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Les 8 étapes du parcours KOPRO
const stepTemplates = [
  {
    code: 'CLIENT_CREATION',
    name: 'Création du compte',
    description: 'Création du compte client par l\'administrateur',
    order: 1,
    category: 'ADMIN_SETUP',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: true,
  },
  {
    code: 'MPR_IDENTIFIER',
    name: 'Identifiant MaPrimeRénov\'',
    description: 'Renseignez votre identifiant MaPrimeRénov\' (format : MPR-1234AB)',
    order: 2,
    category: 'CLIENT_ACTION',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'MANDATE_SIGNATURE',
    name: 'Signature du mandat',
    description: 'Signez le mandat administratif pour autoriser KOPRO à gérer votre dossier',
    order: 3,
    category: 'CLIENT_ACTION',
    requiredDocs: JSON.stringify(['MANDAT']),
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'WORK_SELECTION',
    name: 'Sélection des travaux',
    description: 'Sélectionnez les types de travaux prévus pour votre projet de rénovation',
    order: 4,
    category: 'CLIENT_ACTION',
    requiredDocs: null,
    autoValidation: true, // Validation automatique après sélection
    adminOnly: false,
  },
  {
    code: 'QUOTE_DEPOSIT',
    name: 'Dépôt des devis',
    description: 'Déposez les devis de vos artisans pour chaque type de travaux sélectionné',
    order: 5,
    category: 'CLIENT_ACTION',
    requiredDocs: JSON.stringify(['DEVIS']),
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'WORK_AUTHORIZATION',
    name: 'Autorisation des travaux',
    description: 'Confirmation de l\'autorisation de démarrer les travaux',
    order: 6,
    category: 'CLIENT_ACTION',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'INVOICE_DEPOSIT',
    name: 'Dépôt des factures',
    description: 'Déposez les factures finales après la fin des travaux',
    order: 7,
    category: 'CLIENT_ACTION',
    requiredDocs: JSON.stringify(['FACTURE']),
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'FINAL_RECAP',
    name: 'Récapitulatif final',
    description: 'Consultez le récapitulatif de votre dossier et suivez le versement des aides',
    order: 8,
    category: 'FINAL',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: false,
  },
]

async function main() {
  console.log('Seeding database...')

  // Delete all existing data in correct order (respecting foreign keys)
  console.log('Cleaning existing data...')
  await prisma.activityLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.document.deleteMany()
  await prisma.mprHistory.deleteMany()
  await prisma.dossierStep.deleteMany()
  await prisma.dossier.deleteMany()
  await prisma.stepTemplate.deleteMany()
  await prisma.user.deleteMany()

  // Create step templates
  for (const template of stepTemplates) {
    await prisma.stepTemplate.create({
      data: template,
    })
  }
  console.log('Step templates created')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@kopro.fr',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'KOPRO',
      role: 'ADMIN',
      mustChangePassword: false,
    },
  })
  console.log('Admin user created')

  // Create advisor user
  await prisma.user.create({
    data: {
      email: 'conseiller@kopro.fr',
      password: hashedPassword,
      firstName: 'Marie',
      lastName: 'Dupont',
      role: 'ADVISOR',
      mustChangePassword: false,
    },
  })
  console.log('Advisor user created')

  // Create demo client (créé par l'admin)
  const clientPassword = await bcrypt.hash('client123', 12)
  const client = await prisma.user.create({
    data: {
      email: 'client@exemple.fr',
      password: clientPassword,
      firstName: 'Jean',
      lastName: 'Martin',
      phone: '0612345678',
      role: 'CLIENT',
      createdById: admin.id,
      mustChangePassword: false, // Pour le test, on désactive
    },
  })
  console.log('Demo client created')

  // Generate reference
  const year = new Date().getFullYear()
  const reference = `KPR-${year}-0001`

  // Create demo dossier
  const dossier = await prisma.dossier.create({
    data: {
      reference,
      clientId: client.id,
      status: 'EN_COURS',
      currentStep: 2,
      isActive: true,
      mprStatus: 'DRAFT',
      mandatStatus: 'DRAFT',
      quotesStatus: 'DRAFT',
      invoicesStatus: 'DRAFT',
      workStatus: 'NOT_STARTED',
      paymentStatus: 'PENDING',
    },
  })

  // Create dossier steps
  const templates = await prisma.stepTemplate.findMany({ orderBy: { order: 'asc' } })
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i]
    let status = 'LOCKED'

    if (i === 0) {
      // Étape 1 (CLIENT_CREATION) validée automatiquement
      status = 'VALIDATED'
    } else if (i === 1) {
      // Étape 2 (MPR_IDENTIFIER) disponible
      status = 'AVAILABLE'
    }

    await prisma.dossierStep.create({
      data: {
        dossierId: dossier.id,
        templateId: template.id,
        status,
        validatedAt: status === 'VALIDATED' ? new Date() : null,
        validatedBy: status === 'VALIDATED' ? admin.id : null,
      },
    })
  }
  console.log('Demo dossier and steps created')

  // Create welcome notification for client
  await prisma.notification.create({
    data: {
      userId: client.id,
      dossierId: dossier.id,
      type: 'ACCOUNT_CREATED',
      title: 'Bienvenue sur KOPRO !',
      message: 'Votre compte a été créé. Vous pouvez maintenant renseigner votre identifiant MaPrimeRénov\'.',
      link: '/dashboard',
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      dossierId: dossier.id,
      action: 'CLIENT_CREATED',
      details: `Compte client créé pour ${client.firstName} ${client.lastName}`,
    },
  })

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
