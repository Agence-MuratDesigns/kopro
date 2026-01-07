import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Les 8 étapes du parcours KOPRO
const stepTemplates = [
  {
    code: 'PAIEMENT_VALIDE',
    name: 'Paiement validé',
    description: 'Création du compte et validation du paiement initial',
    order: 1,
    category: 'INITIALISATION',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: true,
  },
  {
    code: 'IDENTIFIANT_MPR',
    name: 'Identifiant MaPrimeRénov\'',
    description: 'Renseignez votre identifiant MaPrimeRénov\' obtenu sur maprimerenov.gouv.fr',
    order: 2,
    category: 'MPR',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'MANDAT_SIGNE',
    name: 'Mandat signé',
    description: 'Signature du mandat administratif pour permettre à KOPRO de gérer votre dossier',
    order: 3,
    category: 'DOCUMENTS',
    requiredDocs: JSON.stringify(['MANDAT']),
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'TRAVAUX_SELECTIONNES',
    name: 'Travaux sélectionnés',
    description: 'Sélectionnez les travaux éligibles concernés par votre projet',
    order: 4,
    category: 'TRAVAUX',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'DEVIS_DEPOSES',
    name: 'Devis déposés',
    description: 'Déposez les devis de vos artisans pour chaque type de travaux sélectionné',
    order: 5,
    category: 'DOCUMENTS',
    requiredDocs: JSON.stringify(['DEVIS']),
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'DEPOT_DOSSIER',
    name: 'Dépôt de dossier',
    description: 'Vérification et dépôt de votre dossier auprès de MaPrimeRénov\'',
    order: 6,
    category: 'VERIFICATION',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: true,
  },
  {
    code: 'DOSSIER_VALIDE',
    name: 'Dossier validé',
    description: 'Votre dossier a été validé par MaPrimeRénov\'',
    order: 7,
    category: 'VALIDATION',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: true,
  },
  {
    code: 'FACTURE_VERSEMENT',
    name: 'Facture finale / versement',
    description: 'Dépôt de la facture finale et versement des aides',
    order: 8,
    category: 'PAIEMENT',
    requiredDocs: JSON.stringify(['FACTURE']),
    autoValidation: false,
    adminOnly: false,
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
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kopro.fr' },
    update: {},
    create: {
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
  await prisma.user.upsert({
    where: { email: 'conseiller@kopro.fr' },
    update: {},
    create: {
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
  const client = await prisma.user.upsert({
    where: { email: 'client@exemple.fr' },
    update: {},
    create: {
      email: 'client@exemple.fr',
      password: clientPassword,
      firstName: 'Murat',
      lastName: 'ZOR',
      phone: '0612345678',
      role: 'CLIENT',
      createdById: admin.id,
      mustChangePassword: false,
    },
  })
  console.log('Demo client created')

  // Generate reference
  const year = new Date().getFullYear()
  const reference = `KPR-${year}-0001`

  // Delete existing dossier if exists
  const existingDossier = await prisma.dossier.findUnique({
    where: { clientId: client.id },
  })
  if (existingDossier) {
    await prisma.dossier.delete({ where: { id: existingDossier.id } })
  }

  // Create demo dossier
  const dossier = await prisma.dossier.create({
    data: {
      reference,
      clientId: client.id,
      status: 'EN_COURS',
      currentStep: 2,
      mprStatus: 'DRAFT',
    },
  })

  // Create dossier steps
  const templates = await prisma.stepTemplate.findMany({ orderBy: { order: 'asc' } })
  for (let i = 0; i < templates.length; i++) {
    const template = templates[i]
    let status = 'LOCKED'

    if (i === 0) {
      status = 'VALIDATED'
    } else if (i === 1) {
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
