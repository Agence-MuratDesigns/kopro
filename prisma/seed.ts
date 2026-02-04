import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// URLs d'avatars (photos génériques de profil via UI Avatars ou DiceBear)
const getAvatarUrl = (firstName: string, lastName: string, style: 'initials' | 'avataaars' | 'micah' | 'notionists' | 'lorelei' | 'adventurer' = 'avataaars') => {
  const seed = `${firstName}-${lastName}`.toLowerCase()
  if (style === 'initials') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}+${encodeURIComponent(lastName)}&background=7645fb&color=fff&size=128&bold=true`
  }
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=e6ddff`
}

// Les 10 étapes du parcours KOPRO
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
    autoValidation: true, // Auto-validation après soumission (format vérifié par regex)
    adminOnly: false,
  },
  {
    code: 'PROJECT_INFO',
    name: 'Informations du projet',
    description: 'Complétez les informations de votre logement et déposez les documents requis',
    order: 3,
    category: 'CLIENT_ACTION',
    requiredDocs: JSON.stringify(['TAXE_FONCIERE', 'AVIS_IMPOSITION', 'CARTE_IDENTITE', 'RIB']),
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'PAYMENT',
    name: 'Paiement des frais de dossier',
    description: 'Réglez les frais d\'accompagnement KOPRO (290 €) pour finaliser votre inscription',
    order: 4,
    category: 'CLIENT_ACTION',
    requiredDocs: null,
    autoValidation: true, // Auto-validation via webhook Stripe
    adminOnly: false,
  },
  {
    code: 'MANDATE_SIGNATURE',
    name: 'Signature du mandat',
    description: 'Signez le mandat administratif pour autoriser KOPRO à gérer votre dossier',
    order: 5,
    category: 'CLIENT_ACTION',
    requiredDocs: JSON.stringify(['MANDAT']),
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'WORK_SELECTION',
    name: 'Sélection des travaux',
    description: 'Sélectionnez les types de travaux prévus pour votre projet de rénovation',
    order: 6,
    category: 'CLIENT_ACTION',
    requiredDocs: null,
    autoValidation: true, // Validation automatique après sélection
    adminOnly: false,
  },
  {
    code: 'QUOTE_DEPOSIT',
    name: 'Dépôt des devis',
    description: 'Déposez les devis de vos artisans pour chaque type de travaux sélectionné',
    order: 7,
    category: 'CLIENT_ACTION',
    requiredDocs: JSON.stringify(['DEVIS']),
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'WORK_AUTHORIZATION',
    name: 'Démarrage des travaux',
    description: 'Déclarez le début de vos travaux une fois les devis validés',
    order: 8,
    category: 'CLIENT_ACTION',
    requiredDocs: null,
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'INVOICE_DEPOSIT',
    name: 'Dépôt des factures',
    description: 'Déposez les factures finales après la fin des travaux',
    order: 9,
    category: 'CLIENT_ACTION',
    requiredDocs: JSON.stringify(['FACTURE']),
    autoValidation: false,
    adminOnly: false,
  },
  {
    code: 'FINAL_RECAP',
    name: 'Récapitulatif final',
    description: 'Consultez le récapitulatif de votre dossier et suivez le versement des aides',
    order: 10,
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
      avatarUrl: getAvatarUrl('Admin', 'KOPRO', 'initials'),
    },
  })
  console.log('Admin user created')

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
      // Profil complet
      address: '12 rue de la République',
      postalCode: '75001',
      city: 'Paris',
      avatarUrl: getAvatarUrl('Jean', 'Martin', 'avataaars'),
    },
  })
  console.log('Demo client created')

  // Create demo artisan (créé par l'admin)
  const artisanPassword = await bcrypt.hash('artisan123', 12)
  const artisan = await prisma.user.create({
    data: {
      email: 'artisan@exemple.fr',
      password: artisanPassword,
      firstName: 'Paul',
      lastName: 'Dupont',
      phone: '0698765432',
      role: 'ARTISAN',
      createdById: admin.id,
      mustChangePassword: false,
      isActive: true,
      // Profil complet
      address: '15 rue des Artisans',
      postalCode: '75011',
      city: 'Paris',
      avatarUrl: getAvatarUrl('Paul', 'Dupont', 'notionists'),
      // Artisan-specific fields
      companyName: 'Dupont Rénovation SARL',
      siret: '12345678901234',
      companyAddress: '15 rue des Artisans',
      companyPostalCode: '75011',
      companyCity: 'Paris',
      rgeQualifications: JSON.stringify(['QUALIBAT', 'QUALIPAC']),
    },
  })
  console.log('Demo artisan created: artisan@exemple.fr / artisan123')

  // =====================================================
  // CRÉATION DE 5 ARTISANS SUPPLÉMENTAIRES
  // =====================================================
  console.log('Creating additional artisans...')

  const additionalArtisans = [
    {
      email: 'marc.leblanc@renoveco.fr',
      firstName: 'Marc',
      lastName: 'Leblanc',
      phone: '0612789456',
      address: '45 avenue Jean Jaurès',
      postalCode: '69007',
      city: 'Lyon',
      companyName: 'RenovEco Lyon',
      siret: '98765432109876',
      companyAddress: '45 avenue Jean Jaurès',
      companyPostalCode: '69007',
      companyCity: 'Lyon',
      rgeQualifications: ['QUALIBAT', 'QUALIFELEC', 'RGE ECO ARTISAN'],
      avatarStyle: 'adventurer' as const,
    },
    {
      email: 'sophie.martin@thermipro.com',
      firstName: 'Sophie',
      lastName: 'Martin',
      phone: '0623456789',
      address: '8 rue de l\'Industrie',
      postalCode: '31000',
      city: 'Toulouse',
      companyName: 'ThermiPro',
      siret: '45678901234567',
      companyAddress: '8 rue de l\'Industrie',
      companyPostalCode: '31000',
      companyCity: 'Toulouse',
      rgeQualifications: ['QUALIPAC', 'QUALISOL'],
      avatarStyle: 'lorelei' as const,
    },
    {
      email: 'jean.rousseau@isoconfort.fr',
      firstName: 'Jean-Pierre',
      lastName: 'Rousseau',
      phone: '0634567890',
      address: '22 boulevard Gambetta',
      postalCode: '33000',
      city: 'Bordeaux',
      companyName: 'IsoConfort Aquitaine',
      siret: '56789012345678',
      companyAddress: '22 boulevard Gambetta',
      companyPostalCode: '33000',
      companyCity: 'Bordeaux',
      rgeQualifications: ['QUALIBAT', 'CERTIBAT'],
      avatarStyle: 'notionists' as const,
    },
    {
      email: 'nicolas.fabre@energiplus.com',
      firstName: 'Nicolas',
      lastName: 'Fabre',
      phone: '0645678901',
      address: '15 rue Victor Hugo',
      postalCode: '13001',
      city: 'Marseille',
      companyName: 'EnergiPlus Méditerranée',
      siret: '67890123456789',
      companyAddress: '15 rue Victor Hugo',
      companyPostalCode: '13001',
      companyCity: 'Marseille',
      rgeQualifications: ['QUALIBAT', 'QUALIPAC', 'QUALIFELEC'],
      avatarStyle: 'micah' as const,
    },
    {
      email: 'christine.duval@ecohabitat.fr',
      firstName: 'Christine',
      lastName: 'Duval',
      phone: '0656789012',
      address: '30 rue de la Liberté',
      postalCode: '44000',
      city: 'Nantes',
      companyName: 'EcoHabitat Ouest',
      siret: '78901234567890',
      companyAddress: '30 rue de la Liberté',
      companyPostalCode: '44000',
      companyCity: 'Nantes',
      rgeQualifications: ['RGE ECO ARTISAN', 'QUALIBAT'],
      avatarStyle: 'avataaars' as const,
    },
  ]

  const createdArtisans: { id: string; firstName: string; lastName: string }[] = [artisan]

  for (const artisanData of additionalArtisans) {
    const newArtisan = await prisma.user.create({
      data: {
        email: artisanData.email,
        password: artisanPassword,
        firstName: artisanData.firstName,
        lastName: artisanData.lastName,
        phone: artisanData.phone,
        role: 'ARTISAN',
        createdById: admin.id,
        mustChangePassword: false,
        isActive: true,
        address: artisanData.address,
        postalCode: artisanData.postalCode,
        city: artisanData.city,
        avatarUrl: getAvatarUrl(artisanData.firstName, artisanData.lastName, artisanData.avatarStyle),
        companyName: artisanData.companyName,
        siret: artisanData.siret,
        companyAddress: artisanData.companyAddress,
        companyPostalCode: artisanData.companyPostalCode,
        companyCity: artisanData.companyCity,
        rgeQualifications: JSON.stringify(artisanData.rgeQualifications),
      },
    })
    createdArtisans.push(newArtisan)
    console.log(`  - Artisan: ${artisanData.firstName} ${artisanData.lastName} (${artisanData.companyName})`)
  }
  console.log('6 artisans created!')

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
      projectInfoStatus: 'DRAFT',
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

  // =====================================================
  // CRÉATION DE 10 CLIENTS FICTIFS À DIFFÉRENTES ÉTAPES
  // =====================================================
  console.log('Creating 10 fictional clients...')

  // Styles d'avatars variés pour diversifier les profils
  const avatarStyles: ('avataaars' | 'micah' | 'notionists' | 'lorelei' | 'adventurer')[] = ['avataaars', 'micah', 'notionists', 'lorelei', 'adventurer']

  const fictionalClients = [
    // Client 1 - Étape 2 : MPR en cours (pas encore validé - cas rare maintenant avec auto-validation)
    {
      email: 'marie.dupont@email.fr',
      firstName: 'Marie',
      lastName: 'Dupont',
      phone: '0634567890',
      address: '28 rue Garibaldi',
      postalCode: '69003',
      city: 'Lyon',
      avatarStyle: 'lorelei' as const,
      projectType: 'Rénovation globale',
      mprId: null,
      mprStatus: 'DRAFT',
      currentStep: 2,
      mprAmount: 8500,
      ceeAmount: 2100,
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'AVAILABLE' },  // 2 - MPR (disponible, pas encore rempli)
        { status: 'LOCKED' },     // 3 - Infos projet
        { status: 'LOCKED' },     // 4 - Paiement
        { status: 'LOCKED' },     // 5 - Mandat
        { status: 'LOCKED' },     // 6 - Travaux
        { status: 'LOCKED' },     // 7 - Devis
        { status: 'LOCKED' },     // 8 - Démarrage
        { status: 'LOCKED' },     // 9 - Factures
        { status: 'LOCKED' },     // 10 - Récap
      ],
    },
    // Client 2 - Étape 3 : Infos projet en attente de validation
    {
      email: 'pierre.bernard@gmail.com',
      firstName: 'Pierre',
      lastName: 'Bernard',
      phone: '0645678901',
      address: '15 boulevard Longchamp',
      postalCode: '13001',
      city: 'Marseille',
      avatarStyle: 'avataaars' as const,
      projectType: 'Isolation combles',
      mprId: 'MPR-7832CD',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'PENDING_REVIEW',
      energyType: 'GAS',
      housingType: 'HOUSE',
      housingSurface: 120,
      constructionYear: 1985,
      currentStep: 3,
      mprAmount: 4200,
      ceeAmount: 950,
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'VALIDATED' },  // 2 - MPR (auto-validé)
        { status: 'PENDING_VALIDATION' },  // 3 - Infos projet
        { status: 'LOCKED' },     // 4 - Paiement
        { status: 'LOCKED' },     // 5 - Mandat
        { status: 'LOCKED' },     // 6 - Travaux
        { status: 'LOCKED' },     // 7 - Devis
        { status: 'LOCKED' },     // 8 - Démarrage
        { status: 'LOCKED' },     // 9 - Factures
        { status: 'LOCKED' },     // 10 - Récap
      ],
    },
    // Client 3 - Étape 4 : Paiement disponible (infos projet validées)
    {
      email: 'sophie.leroy@outlook.fr',
      firstName: 'Sophie',
      lastName: 'Leroy',
      phone: '0656789012',
      address: '42 rue de Metz',
      postalCode: '31000',
      city: 'Toulouse',
      avatarStyle: 'micah' as const,
      projectType: 'Pompe à chaleur',
      mprId: 'MPR-2156EF',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'FUEL',
      housingType: 'HOUSE',
      housingSurface: 150,
      constructionYear: 1970,
      currentStep: 4,
      mprAmount: 5000,
      ceeAmount: 1500,
      servicePaymentStatus: 'DRAFT',
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'VALIDATED' },  // 2 - MPR
        { status: 'VALIDATED' },  // 3 - Infos projet
        { status: 'AVAILABLE' },  // 4 - Paiement
        { status: 'LOCKED' },     // 5 - Mandat
        { status: 'LOCKED' },     // 6 - Travaux
        { status: 'LOCKED' },     // 7 - Devis
        { status: 'LOCKED' },     // 8 - Démarrage
        { status: 'LOCKED' },     // 9 - Factures
        { status: 'LOCKED' },     // 10 - Récap
      ],
    },
    // Client 4 - Étape 6 : Sélection des travaux
    {
      email: 'julien.moreau@free.fr',
      firstName: 'Julien',
      lastName: 'Moreau',
      phone: '0667890123',
      address: '8 cours de l\'Intendance',
      postalCode: '33000',
      city: 'Bordeaux',
      avatarStyle: 'notionists' as const,
      projectType: 'Rénovation énergétique',
      mprId: 'MPR-9487GH',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'APARTMENT',
      housingSurface: 85,
      constructionYear: 1990,
      mandatStatus: 'APPROVED',
      currentStep: 6,
      mprAmount: 12000,
      ceeAmount: 3200,
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'VALIDATED' },  // 2 - MPR
        { status: 'VALIDATED' },  // 3 - Infos projet
        { status: 'VALIDATED' },  // 4 - Paiement
        { status: 'VALIDATED' },  // 5 - Mandat
        { status: 'AVAILABLE' },  // 6 - Travaux
        { status: 'LOCKED' },     // 7 - Devis
        { status: 'LOCKED' },     // 8 - Démarrage
        { status: 'LOCKED' },     // 9 - Factures
        { status: 'LOCKED' },     // 10 - Récap
      ],
    },
    // Client 5 - Étape 7 : Devis en attente de validation
    {
      email: 'claire.petit@laposte.net',
      firstName: 'Claire',
      lastName: 'Petit',
      phone: '0678901234',
      address: '25 rue Crébillon',
      postalCode: '44000',
      city: 'Nantes',
      avatarStyle: 'adventurer' as const,
      projectType: 'Chaudière gaz',
      mprId: 'MPR-3698IJ',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'FUEL',
      housingType: 'HOUSE',
      housingSurface: 100,
      constructionYear: 1975,
      mandatStatus: 'APPROVED',
      quotesStatus: 'PENDING_REVIEW',
      currentStep: 7,
      mprAmount: 3500,
      ceeAmount: 800,
      selectedWorks: ['HEATING'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'VALIDATED' },  // 2 - MPR
        { status: 'VALIDATED' },  // 3 - Infos projet
        { status: 'VALIDATED' },  // 4 - Paiement
        { status: 'VALIDATED' },  // 5 - Mandat
        { status: 'VALIDATED' },  // 6 - Travaux
        { status: 'PENDING_VALIDATION' },  // 7 - Devis
        { status: 'LOCKED' },     // 8 - Démarrage
        { status: 'LOCKED' },     // 9 - Factures
        { status: 'LOCKED' },     // 10 - Récap
      ],
    },
    // Client 6 - Étape 7 : Devis en attente de validation
    {
      email: 'thomas.roux@yahoo.fr',
      firstName: 'Thomas',
      lastName: 'Roux',
      phone: '0689012345',
      address: '12 place Kléber',
      postalCode: '67000',
      city: 'Strasbourg',
      avatarStyle: 'lorelei' as const,
      projectType: 'Isolation murs',
      mprId: 'MPR-5247KL',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'GAS',
      housingType: 'HOUSE',
      housingSurface: 130,
      constructionYear: 1965,
      mandatStatus: 'APPROVED',
      quotesStatus: 'PENDING_REVIEW',
      currentStep: 7,
      mprAmount: 6800,
      ceeAmount: 1800,
      selectedWorks: ['ISOLATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'VALIDATED' },  // 2 - MPR
        { status: 'VALIDATED' },  // 3 - Infos projet
        { status: 'VALIDATED' },  // 4 - Paiement
        { status: 'VALIDATED' },  // 5 - Mandat
        { status: 'VALIDATED' },  // 6 - Travaux
        { status: 'PENDING_VALIDATION' },  // 7 - Devis
        { status: 'LOCKED' },     // 8 - Démarrage
        { status: 'LOCKED' },     // 9 - Factures
        { status: 'LOCKED' },     // 10 - Récap
      ],
    },
    // Client 7 - Étape 8 : Travaux en cours
    {
      email: 'emma.garcia@gmail.com',
      firstName: 'Emma',
      lastName: 'Garcia',
      phone: '0690123456',
      address: '5 place de la Comédie',
      postalCode: '34000',
      city: 'Montpellier',
      avatarStyle: 'avataaars' as const,
      projectType: 'Rénovation complète',
      mprId: 'MPR-8134MN',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'HOUSE',
      housingSurface: 180,
      constructionYear: 1980,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'IN_PROGRESS',
      currentStep: 8,
      mprAmount: 15000,
      ceeAmount: 4500,
      selectedWorks: ['ISOLATION', 'HEATING', 'VENTILATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'VALIDATED' },  // 2 - MPR
        { status: 'VALIDATED' },  // 3 - Infos projet
        { status: 'VALIDATED' },  // 4 - Paiement
        { status: 'VALIDATED' },  // 5 - Mandat
        { status: 'VALIDATED' },  // 6 - Travaux
        { status: 'VALIDATED' },  // 7 - Devis
        { status: 'IN_PROGRESS' },  // 8 - Démarrage
        { status: 'LOCKED' },     // 9 - Factures
        { status: 'LOCKED' },     // 10 - Récap
      ],
    },
    // Client 8 - Étape 9 : Factures en attente de validation
    {
      email: 'lucas.martinez@orange.fr',
      firstName: 'Lucas',
      lastName: 'Martinez',
      phone: '0601234567',
      address: '18 promenade des Anglais',
      postalCode: '06000',
      city: 'Nice',
      avatarStyle: 'micah' as const,
      projectType: 'Fenêtres double vitrage',
      mprId: 'MPR-6421OP',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'APARTMENT',
      housingSurface: 65,
      constructionYear: 1995,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'COMPLETED',
      invoicesStatus: 'PENDING_REVIEW',
      currentStep: 9,
      mprAmount: 4800,
      ceeAmount: 1200,
      selectedWorks: ['ISOLATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'VALIDATED' },  // 2 - MPR
        { status: 'VALIDATED' },  // 3 - Infos projet
        { status: 'VALIDATED' },  // 4 - Paiement
        { status: 'VALIDATED' },  // 5 - Mandat
        { status: 'VALIDATED' },  // 6 - Travaux
        { status: 'VALIDATED' },  // 7 - Devis
        { status: 'VALIDATED' },  // 8 - Démarrage
        { status: 'PENDING_VALIDATION' },  // 9 - Factures
        { status: 'LOCKED' },     // 10 - Récap
      ],
    },
    // Client 9 - Étape 10 : Dossier terminé
    {
      email: 'lea.dubois@sfr.fr',
      firstName: 'Léa',
      lastName: 'Dubois',
      phone: '0612345098',
      address: '33 rue de la Monnaie',
      postalCode: '35000',
      city: 'Rennes',
      avatarStyle: 'notionists' as const,
      projectType: 'Chauffe-eau thermodynamique',
      mprId: 'MPR-1753QR',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'HOUSE',
      housingSurface: 110,
      constructionYear: 2000,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'COMPLETED',
      invoicesStatus: 'APPROVED',
      paymentStatus: 'IN_PROGRESS',
      status: 'TERMINE',
      currentStep: 10,
      mprAmount: 2500,
      ceeAmount: 600,
      selectedWorks: ['HOT_WATER'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'VALIDATED' },  // 2 - MPR
        { status: 'VALIDATED' },  // 3 - Infos projet
        { status: 'VALIDATED' },  // 4 - Paiement
        { status: 'VALIDATED' },  // 5 - Mandat
        { status: 'VALIDATED' },  // 6 - Travaux
        { status: 'VALIDATED' },  // 7 - Devis
        { status: 'VALIDATED' },  // 8 - Démarrage
        { status: 'VALIDATED' },  // 9 - Factures
        { status: 'AVAILABLE' },  // 10 - Récap
      ],
    },
    // Client 10 - Dossier clôturé avec paiement effectué
    {
      email: 'antoine.lambert@gmail.com',
      firstName: 'Antoine',
      lastName: 'Lambert',
      phone: '0623456789',
      address: '7 rue Faidherbe',
      postalCode: '59000',
      city: 'Lille',
      avatarStyle: 'adventurer' as const,
      projectType: 'VMC double flux',
      mprId: 'MPR-4829ST',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'GAS',
      housingType: 'HOUSE',
      housingSurface: 140,
      constructionYear: 1988,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'COMPLETED',
      invoicesStatus: 'APPROVED',
      paymentStatus: 'PAID',
      status: 'CLOTURE',
      currentStep: 10,
      mprAmount: 3200,
      ceeAmount: 750,
      selectedWorks: ['VENTILATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },  // 1 - Création compte
        { status: 'VALIDATED' },  // 2 - MPR
        { status: 'VALIDATED' },  // 3 - Infos projet
        { status: 'VALIDATED' },  // 4 - Paiement
        { status: 'VALIDATED' },  // 5 - Mandat
        { status: 'VALIDATED' },  // 6 - Travaux
        { status: 'VALIDATED' },  // 7 - Devis
        { status: 'VALIDATED' },  // 8 - Démarrage
        { status: 'VALIDATED' },  // 9 - Factures
        { status: 'VALIDATED' },  // 10 - Récap
      ],
    },
    // =====================================================
    // 12 NOUVEAUX CLIENTS SUPPLÉMENTAIRES (pour atteindre 22 clients)
    // =====================================================
    // Client 11 - Étape 3 : MPR soumis (auto-validé), infos projet en cours
    {
      email: 'camille.girard@gmail.com',
      firstName: 'Camille',
      lastName: 'Girard',
      phone: '0701234567',
      address: '56 avenue de la Liberté',
      postalCode: '21000',
      city: 'Dijon',
      avatarStyle: 'lorelei' as const,
      projectType: 'Isolation des combles',
      mprId: 'MPR-9182UV',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'DRAFT',
      energyType: null,
      housingType: null,
      housingSurface: null,
      constructionYear: null,
      currentStep: 3,
      mprAmount: 5500,
      ceeAmount: 1400,
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 12 - Étape 4 : Infos projet validées, paiement en attente
    {
      email: 'florian.michel@outlook.fr',
      firstName: 'Florian',
      lastName: 'Michel',
      phone: '0712345678',
      address: '14 rue du Vieux Port',
      postalCode: '17000',
      city: 'La Rochelle',
      avatarStyle: 'avataaars' as const,
      projectType: 'Pompe à chaleur air-air',
      mprId: 'MPR-3456WX',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'APARTMENT',
      housingSurface: 75,
      constructionYear: 1992,
      currentStep: 4,
      mprAmount: 4000,
      ceeAmount: 1100,
      servicePaymentStatus: 'DRAFT',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 13 - Étape 5 : Mandat en attente de validation admin
    {
      email: 'aurelie.bonnet@sfr.fr',
      firstName: 'Aurélie',
      lastName: 'Bonnet',
      phone: '0723456789',
      address: '29 boulevard de la Victoire',
      postalCode: '67000',
      city: 'Strasbourg',
      avatarStyle: 'micah' as const,
      projectType: 'Chaudière à condensation',
      mprId: 'MPR-7891YZ',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'GAS',
      housingType: 'HOUSE',
      housingSurface: 160,
      constructionYear: 1978,
      mandatStatus: 'PENDING_REVIEW',
      currentStep: 5,
      mprAmount: 6200,
      ceeAmount: 1600,
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'PENDING_VALIDATION' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 14 - Étape 7 : Travaux sélectionnés, devis à déposer
    {
      email: 'maxime.fournier@laposte.net',
      firstName: 'Maxime',
      lastName: 'Fournier',
      phone: '0734567890',
      address: '11 rue Saint-Jean',
      postalCode: '14000',
      city: 'Caen',
      avatarStyle: 'notionists' as const,
      projectType: 'Rénovation énergétique complète',
      mprId: 'MPR-2468AB',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'FUEL',
      housingType: 'HOUSE',
      housingSurface: 195,
      constructionYear: 1962,
      mandatStatus: 'APPROVED',
      quotesStatus: 'DRAFT',
      currentStep: 7,
      mprAmount: 18500,
      ceeAmount: 5200,
      selectedWorks: ['ISOLATION', 'HEATING', 'HOT_WATER', 'VENTILATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 15 - Étape 8 : Devis validés, autorisation de démarrage
    {
      email: 'julie.robert@gmail.com',
      firstName: 'Julie',
      lastName: 'Robert',
      phone: '0745678901',
      address: '38 avenue Foch',
      postalCode: '57000',
      city: 'Metz',
      avatarStyle: 'adventurer' as const,
      projectType: 'Isolation thermique par l\'extérieur',
      mprId: 'MPR-1357CD',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'GAS',
      housingType: 'HOUSE',
      housingSurface: 145,
      constructionYear: 1975,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      currentStep: 8,
      mprAmount: 11000,
      ceeAmount: 3100,
      selectedWorks: ['ISOLATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 16 - Étape 8 : Travaux en cours (avancés)
    {
      email: 'benjamin.simon@yahoo.fr',
      firstName: 'Benjamin',
      lastName: 'Simon',
      phone: '0756789012',
      address: '22 place Bellecour',
      postalCode: '69002',
      city: 'Lyon',
      avatarStyle: 'lorelei' as const,
      projectType: 'Installation PAC + VMC',
      mprId: 'MPR-8024EF',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'HOUSE',
      housingSurface: 175,
      constructionYear: 1983,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'IN_PROGRESS',
      currentStep: 8,
      mprAmount: 14200,
      ceeAmount: 4100,
      selectedWorks: ['HEATING', 'VENTILATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'IN_PROGRESS' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 17 - Étape 9 : Factures déposées, en attente
    {
      email: 'manon.lefebvre@orange.fr',
      firstName: 'Manon',
      lastName: 'Lefebvre',
      phone: '0767890123',
      address: '9 rue des Carmes',
      postalCode: '45000',
      city: 'Orléans',
      avatarStyle: 'avataaars' as const,
      projectType: 'Changement fenêtres',
      mprId: 'MPR-5739GH',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'APARTMENT',
      housingSurface: 90,
      constructionYear: 1989,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'COMPLETED',
      invoicesStatus: 'PENDING_REVIEW',
      currentStep: 9,
      mprAmount: 5800,
      ceeAmount: 1450,
      selectedWorks: ['ISOLATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'PENDING_VALIDATION' },
        { status: 'LOCKED' },
      ],
    },
    // Client 18 - Étape 10 : Dossier terminé, paiement en cours
    {
      email: 'romain.morel@free.fr',
      firstName: 'Romain',
      lastName: 'Morel',
      phone: '0778901234',
      address: '47 quai de Bordeaux',
      postalCode: '33300',
      city: 'Bordeaux',
      avatarStyle: 'micah' as const,
      projectType: 'Isolation + Chauffage',
      mprId: 'MPR-4628IJ',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'FUEL',
      housingType: 'HOUSE',
      housingSurface: 165,
      constructionYear: 1971,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'COMPLETED',
      invoicesStatus: 'APPROVED',
      paymentStatus: 'IN_PROGRESS',
      status: 'TERMINE',
      currentStep: 10,
      mprAmount: 13500,
      ceeAmount: 3800,
      selectedWorks: ['ISOLATION', 'HEATING'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
      ],
    },
    // Client 19 - Dossier clôturé avec paiement complet
    {
      email: 'pauline.henry@gmail.com',
      firstName: 'Pauline',
      lastName: 'Henry',
      phone: '0789012345',
      address: '63 rue de la République',
      postalCode: '42000',
      city: 'Saint-Étienne',
      avatarStyle: 'notionists' as const,
      projectType: 'Rénovation globale',
      mprId: 'MPR-9371KL',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'HOUSE',
      housingSurface: 210,
      constructionYear: 1968,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'COMPLETED',
      invoicesStatus: 'APPROVED',
      paymentStatus: 'PAID',
      status: 'CLOTURE',
      currentStep: 10,
      mprAmount: 22000,
      ceeAmount: 6200,
      selectedWorks: ['ISOLATION', 'HEATING', 'HOT_WATER', 'VENTILATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
      ],
    },
    // Client 20 - Étape 2 : Nouveau client, vient de s'inscrire
    {
      email: 'alexandre.david@outlook.fr',
      firstName: 'Alexandre',
      lastName: 'David',
      phone: '0790123456',
      address: '17 boulevard Carnot',
      postalCode: '06400',
      city: 'Cannes',
      avatarStyle: 'adventurer' as const,
      projectType: 'Climatisation réversible',
      mprId: null,
      mprStatus: 'DRAFT',
      currentStep: 2,
      mprAmount: 3800,
      ceeAmount: 900,
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 21 - Étape 3 : Infos projet bloquées (rejetées)
    {
      email: 'chloe.laurent@laposte.net',
      firstName: 'Chloé',
      lastName: 'Laurent',
      phone: '0601234598',
      address: '31 rue du Commerce',
      postalCode: '37000',
      city: 'Tours',
      avatarStyle: 'lorelei' as const,
      projectType: 'Isolation plancher bas',
      mprId: 'MPR-6842MN',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'REJECTED',
      energyType: 'GAS',
      housingType: 'HOUSE',
      housingSurface: 125,
      constructionYear: 1982,
      currentStep: 3,
      mprAmount: 4600,
      ceeAmount: 1250,
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'BLOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 22 - Étape 6 : Travaux en cours de sélection
    {
      email: 'vincent.durand@gmail.com',
      firstName: 'Vincent',
      lastName: 'Durand',
      phone: '0612345987',
      address: '8 place de la Mairie',
      postalCode: '49000',
      city: 'Angers',
      avatarStyle: 'avataaars' as const,
      projectType: 'Chaudière biomasse',
      mprId: 'MPR-5193OP',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'WOOD',
      housingType: 'HOUSE',
      housingSurface: 185,
      constructionYear: 1955,
      mandatStatus: 'APPROVED',
      currentStep: 6,
      mprAmount: 9500,
      ceeAmount: 2700,
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'IN_PROGRESS' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
  ]

  let clientIndex = 2 // On commence à 2 car Jean Martin est le 1er

  for (const clientData of fictionalClients) {
    // Créer l'utilisateur client avec profil complet et avatar
    const newClient = await prisma.user.create({
      data: {
        email: clientData.email,
        password: clientPassword, // Même mot de passe pour tous : client123
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        phone: clientData.phone,
        role: 'CLIENT',
        createdById: admin.id,
        mustChangePassword: false,
        // Profil complet
        address: (clientData as { address?: string }).address || null,
        postalCode: (clientData as { postalCode?: string }).postalCode || null,
        city: clientData.city,
        avatarUrl: getAvatarUrl(clientData.firstName, clientData.lastName, (clientData as { avatarStyle?: 'avataaars' | 'micah' | 'notionists' | 'lorelei' | 'adventurer' }).avatarStyle || avatarStyles[clientIndex % avatarStyles.length]),
      },
    })

    // Générer la référence du dossier
    const refNumber = String(clientIndex).padStart(4, '0')
    const newReference = `KPR-${year}-${refNumber}`

    // Créer le dossier
    const newDossier = await prisma.dossier.create({
      data: {
        reference: newReference,
        clientId: newClient.id,
        status: clientData.status || 'EN_COURS',
        currentStep: clientData.currentStep,
        isActive: clientData.status !== 'CLOTURE',
        projectCity: clientData.city,
        projectType: clientData.projectType,
        mprId: clientData.mprId,
        mprStatus: clientData.mprStatus,
        mprSubmittedAt: clientData.mprStatus !== 'DRAFT' ? new Date() : null,
        // Infos projet (nouvelle étape 3)
        projectInfoStatus: (clientData as { projectInfoStatus?: string }).projectInfoStatus || 'DRAFT',
        projectInfoSubmittedAt: (clientData as { projectInfoStatus?: string }).projectInfoStatus === 'PENDING_REVIEW' || (clientData as { projectInfoStatus?: string }).projectInfoStatus === 'APPROVED' ? new Date() : null,
        energyType: (clientData as { energyType?: string }).energyType || null,
        housingType: (clientData as { housingType?: string }).housingType || null,
        housingSurface: (clientData as { housingSurface?: number }).housingSurface || null,
        constructionYear: (clientData as { constructionYear?: number }).constructionYear || null,
        mandatStatus: clientData.mandatStatus || 'DRAFT',
        quotesStatus: clientData.quotesStatus || 'DRAFT',
        invoicesStatus: clientData.invoicesStatus || 'DRAFT',
        workStatus: clientData.workStatus || 'NOT_STARTED',
        paymentStatus: clientData.paymentStatus || 'PENDING',
        servicePaymentStatus: (clientData as { servicePaymentStatus?: string }).servicePaymentStatus || 'DRAFT',
        selectedWorks: clientData.selectedWorks ? JSON.stringify(clientData.selectedWorks) : null,
        mprAmount: clientData.mprAmount,
        ceeAmount: clientData.ceeAmount,
      },
    })

    // Créer les étapes du dossier
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
      const stepConfig = clientData.stepsConfig[i]

      await prisma.dossierStep.create({
        data: {
          dossierId: newDossier.id,
          templateId: template.id,
          status: stepConfig.status,
          validatedAt: stepConfig.status === 'VALIDATED' ? new Date() : null,
          validatedBy: stepConfig.status === 'VALIDATED' ? admin.id : null,
        },
      })
    }

    // Créer l'historique MPR si applicable
    if (clientData.mprId && clientData.mprStatus !== 'DRAFT') {
      await prisma.mprHistory.create({
        data: {
          dossierId: newDossier.id,
          action: 'SUBMITTED',
          newValue: clientData.mprId,
          actorId: newClient.id,
          actorType: 'CLIENT',
        },
      })

      if (clientData.mprStatus === 'APPROVED') {
        await prisma.mprHistory.create({
          data: {
            dossierId: newDossier.id,
            action: 'APPROVED',
            previousValue: clientData.mprId,
            newValue: clientData.mprId,
            actorId: admin.id,
            actorType: 'ADMIN',
          },
        })
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        dossierId: newDossier.id,
        action: 'CLIENT_CREATED',
        details: `Compte client créé pour ${clientData.firstName} ${clientData.lastName}`,
      },
    })

    console.log(`  - ${clientData.firstName} ${clientData.lastName} (${newReference}) - Étape ${clientData.currentStep}`)
    clientIndex++
  }

  console.log('22 fictional clients created!')

  // =====================================================
  // CRÉATION DE DOSSIERS GÉRÉS PAR LES ARTISANS
  // =====================================================
  console.log('Creating artisan-managed dossiers...')

  // Dossiers pour Paul Dupont (artisan principal)
  const artisanClients = [
    // Client 1 - Étape 3 : Infos projet en cours (Paul Dupont)
    {
      artisanIndex: 0, // Paul Dupont
      endClientFirstName: 'Michel',
      endClientLastName: 'Fernandez',
      endClientEmail: 'michel.fernandez@email.fr',
      endClientPhone: '0612345670',
      endClientAddress: '25 avenue des Lilas',
      endClientPostalCode: '69003',
      endClientCity: 'Lyon',
      projectType: 'Pompe à chaleur air-eau',
      mprId: 'MPR-4521XY',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'PENDING_REVIEW',
      energyType: 'FUEL',
      housingType: 'HOUSE',
      housingSurface: 140,
      constructionYear: 1978,
      currentStep: 3,
      mprAmount: 7500,
      ceeAmount: 2000,
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'PENDING_VALIDATION' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 2 - Étape 7 : Devis déposés (Paul Dupont)
    {
      artisanIndex: 0,
      endClientFirstName: 'Catherine',
      endClientLastName: 'Blanc',
      endClientEmail: 'catherine.blanc@gmail.com',
      endClientPhone: '0687654321',
      endClientAddress: '8 rue du Commerce',
      endClientPostalCode: '75015',
      endClientCity: 'Paris',
      projectType: 'Isolation thermique extérieure',
      mprId: 'MPR-8763ZW',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'GAS',
      housingType: 'APARTMENT',
      housingSurface: 95,
      constructionYear: 1985,
      mandatStatus: 'APPROVED',
      quotesStatus: 'PENDING_REVIEW',
      currentStep: 7,
      mprAmount: 9200,
      ceeAmount: 2800,
      selectedWorks: ['ISOLATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'PENDING_VALIDATION' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 3 - Étape 8 : Travaux en cours (Paul Dupont)
    {
      artisanIndex: 0,
      endClientFirstName: 'Robert',
      endClientLastName: 'Mercier',
      endClientEmail: null,
      endClientPhone: '0654321098',
      endClientAddress: '42 boulevard Victor Hugo',
      endClientPostalCode: '92100',
      endClientCity: 'Boulogne-Billancourt',
      projectType: 'Rénovation globale',
      mprId: 'MPR-2198AB',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'HOUSE',
      housingSurface: 200,
      constructionYear: 1972,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'IN_PROGRESS',
      currentStep: 8,
      mprAmount: 18000,
      ceeAmount: 5500,
      selectedWorks: ['ISOLATION', 'HEATING', 'VENTILATION', 'HOT_WATER'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'IN_PROGRESS' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 4 - Étape 4 : Paiement en attente (Marc Leblanc - RenovEco Lyon)
    {
      artisanIndex: 1,
      endClientFirstName: 'Françoise',
      endClientLastName: 'Morin',
      endClientEmail: 'francoise.morin@gmail.com',
      endClientPhone: '0678901234',
      endClientAddress: '15 rue de la Part-Dieu',
      endClientPostalCode: '69003',
      endClientCity: 'Lyon',
      projectType: 'Pompe à chaleur',
      mprId: 'MPR-3847QR',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'FUEL',
      housingType: 'HOUSE',
      housingSurface: 155,
      constructionYear: 1976,
      currentStep: 4,
      mprAmount: 8200,
      ceeAmount: 2400,
      servicePaymentStatus: 'DRAFT',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 5 - Étape 10 : Dossier terminé (Marc Leblanc)
    {
      artisanIndex: 1,
      endClientFirstName: 'Jean-Claude',
      endClientLastName: 'Perrin',
      endClientEmail: 'jc.perrin@orange.fr',
      endClientPhone: '0689012345',
      endClientAddress: '28 avenue Jean Jaurès',
      endClientPostalCode: '69007',
      endClientCity: 'Lyon',
      projectType: 'Rénovation énergétique complète',
      mprId: 'MPR-9182ST',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'HOUSE',
      housingSurface: 190,
      constructionYear: 1969,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'COMPLETED',
      invoicesStatus: 'APPROVED',
      paymentStatus: 'PAID',
      status: 'CLOTURE',
      currentStep: 10,
      mprAmount: 19500,
      ceeAmount: 5800,
      selectedWorks: ['ISOLATION', 'HEATING', 'VENTILATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
      ],
    },
    // Client 6 - Étape 7 : Devis en cours (Sophie Martin - ThermiPro)
    {
      artisanIndex: 2,
      endClientFirstName: 'Dominique',
      endClientLastName: 'Gauthier',
      endClientEmail: 'dominique.gauthier@sfr.fr',
      endClientPhone: '0690123456',
      endClientAddress: '44 allée Jean Jaurès',
      endClientPostalCode: '31000',
      endClientCity: 'Toulouse',
      projectType: 'Chauffe-eau solaire',
      mprId: 'MPR-2756UV',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'HOUSE',
      housingSurface: 135,
      constructionYear: 1988,
      mandatStatus: 'APPROVED',
      quotesStatus: 'PENDING_REVIEW',
      currentStep: 7,
      mprAmount: 6800,
      ceeAmount: 1900,
      selectedWorks: ['HOT_WATER'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'PENDING_VALIDATION' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 7 - Étape 8 : Travaux en cours (Sophie Martin)
    {
      artisanIndex: 2,
      endClientFirstName: 'Philippe',
      endClientLastName: 'Giraud',
      endClientEmail: 'philippe.giraud@laposte.net',
      endClientPhone: '0601234567',
      endClientAddress: '19 rue des Filatiers',
      endClientPostalCode: '31000',
      endClientCity: 'Toulouse',
      projectType: 'Pompe à chaleur air-eau',
      mprId: 'MPR-8493WX',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'GAS',
      housingType: 'HOUSE',
      housingSurface: 170,
      constructionYear: 1975,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'IN_PROGRESS',
      currentStep: 8,
      mprAmount: 11500,
      ceeAmount: 3200,
      selectedWorks: ['HEATING'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'IN_PROGRESS' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 8 - Étape 6 : Sélection travaux (Jean-Pierre Rousseau - IsoConfort)
    {
      artisanIndex: 3,
      endClientFirstName: 'Martine',
      endClientLastName: 'Boucher',
      endClientEmail: 'martine.boucher@gmail.com',
      endClientPhone: '0612345678',
      endClientAddress: '7 cours de l\'Intendance',
      endClientPostalCode: '33000',
      endClientCity: 'Bordeaux',
      projectType: 'Isolation des murs',
      mprId: 'MPR-1627YZ',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'GAS',
      housingType: 'APARTMENT',
      housingSurface: 85,
      constructionYear: 1980,
      mandatStatus: 'APPROVED',
      currentStep: 6,
      mprAmount: 5200,
      ceeAmount: 1400,
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 9 - Étape 9 : Factures en attente (Nicolas Fabre - EnergiPlus)
    {
      artisanIndex: 4,
      endClientFirstName: 'Sylvie',
      endClientLastName: 'Fontaine',
      endClientEmail: 'sylvie.fontaine@yahoo.fr',
      endClientPhone: '0623456789',
      endClientAddress: '33 avenue du Prado',
      endClientPostalCode: '13008',
      endClientCity: 'Marseille',
      projectType: 'Rénovation globale',
      mprId: 'MPR-5738AB',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'ELECTRICITY',
      housingType: 'HOUSE',
      housingSurface: 220,
      constructionYear: 1965,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'COMPLETED',
      invoicesStatus: 'PENDING_REVIEW',
      currentStep: 9,
      mprAmount: 24000,
      ceeAmount: 7200,
      selectedWorks: ['ISOLATION', 'HEATING', 'HOT_WATER', 'VENTILATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'PENDING_VALIDATION' },
        { status: 'LOCKED' },
      ],
    },
    // Client 10 - Étape 3 : Nouveau dossier (Christine Duval - EcoHabitat)
    {
      artisanIndex: 5,
      endClientFirstName: 'Bernard',
      endClientLastName: 'Renaud',
      endClientEmail: 'bernard.renaud@free.fr',
      endClientPhone: '0634567890',
      endClientAddress: '51 boulevard des 50 Otages',
      endClientPostalCode: '44000',
      endClientCity: 'Nantes',
      projectType: 'Isolation des combles',
      mprId: 'MPR-4291CD',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'DRAFT',
      energyType: null,
      housingType: null,
      housingSurface: null,
      constructionYear: null,
      currentStep: 3,
      mprAmount: 4800,
      ceeAmount: 1300,
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
        { status: 'LOCKED' },
      ],
    },
    // Client 11 - Étape 10 : Dossier terminé, paiement en cours (Christine Duval)
    {
      artisanIndex: 5,
      endClientFirstName: 'Gérard',
      endClientLastName: 'Lemoine',
      endClientEmail: 'gerard.lemoine@orange.fr',
      endClientPhone: '0645678901',
      endClientAddress: '12 rue du Château',
      endClientPostalCode: '44000',
      endClientCity: 'Nantes',
      projectType: 'VMC double flux + Isolation',
      mprId: 'MPR-7382EF',
      mprStatus: 'APPROVED',
      projectInfoStatus: 'APPROVED',
      energyType: 'GAS',
      housingType: 'HOUSE',
      housingSurface: 165,
      constructionYear: 1973,
      mandatStatus: 'APPROVED',
      quotesStatus: 'APPROVED',
      workStatus: 'COMPLETED',
      invoicesStatus: 'APPROVED',
      paymentStatus: 'IN_PROGRESS',
      status: 'TERMINE',
      currentStep: 10,
      mprAmount: 12800,
      ceeAmount: 3600,
      selectedWorks: ['ISOLATION', 'VENTILATION'],
      servicePaymentStatus: 'SUCCEEDED',
      stepsConfig: [
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'VALIDATED' },
        { status: 'AVAILABLE' },
      ],
    },
  ]

  for (const clientData of artisanClients) {
    // Générer la référence du dossier
    const refNumber = String(clientIndex).padStart(4, '0')
    const newReference = `KPR-${year}-${refNumber}`

    // Sélectionner l'artisan approprié
    const selectedArtisan = createdArtisans[(clientData as { artisanIndex?: number }).artisanIndex || 0]

    // Créer le dossier (géré par artisan, sans compte client)
    const artisanClientData = clientData as {
      status?: string
      paymentStatus?: string
      invoicesStatus?: string
      mandatStatus?: string
      quotesStatus?: string
      workStatus?: string
      selectedWorks?: string[]
    }
    const newDossier = await prisma.dossier.create({
      data: {
        reference: newReference,
        clientId: null, // Pas de compte client
        artisanId: selectedArtisan.id, // Géré par l'artisan sélectionné
        status: artisanClientData.status || 'EN_COURS',
        currentStep: clientData.currentStep,
        isActive: artisanClientData.status !== 'CLOTURE',
        // Infos du client final
        endClientFirstName: clientData.endClientFirstName,
        endClientLastName: clientData.endClientLastName,
        endClientEmail: clientData.endClientEmail,
        endClientPhone: clientData.endClientPhone,
        endClientAddress: clientData.endClientAddress,
        endClientPostalCode: clientData.endClientPostalCode,
        endClientCity: clientData.endClientCity,
        // Infos projet
        projectCity: clientData.endClientCity,
        projectType: clientData.projectType,
        projectAddress: clientData.endClientAddress,
        projectPostalCode: clientData.endClientPostalCode,
        mprId: clientData.mprId,
        mprStatus: clientData.mprStatus,
        mprSubmittedAt: new Date(),
        projectInfoStatus: clientData.projectInfoStatus,
        projectInfoSubmittedAt: clientData.projectInfoStatus !== 'DRAFT' ? new Date() : null,
        energyType: clientData.energyType,
        housingType: clientData.housingType,
        housingSurface: clientData.housingSurface,
        constructionYear: clientData.constructionYear,
        mandatStatus: artisanClientData.mandatStatus || 'DRAFT',
        quotesStatus: artisanClientData.quotesStatus || 'DRAFT',
        invoicesStatus: artisanClientData.invoicesStatus || 'DRAFT',
        workStatus: artisanClientData.workStatus || 'NOT_STARTED',
        paymentStatus: artisanClientData.paymentStatus || 'PENDING',
        servicePaymentStatus: (clientData as { servicePaymentStatus?: string }).servicePaymentStatus || 'DRAFT',
        selectedWorks: artisanClientData.selectedWorks
          ? JSON.stringify(artisanClientData.selectedWorks)
          : null,
        mprAmount: clientData.mprAmount,
        ceeAmount: clientData.ceeAmount,
      },
    })

    // Créer les étapes du dossier (10 étapes)
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i]
      const stepConfig = clientData.stepsConfig[i]

      await prisma.dossierStep.create({
        data: {
          dossierId: newDossier.id,
          templateId: template.id,
          status: stepConfig.status,
          validatedAt: stepConfig.status === 'VALIDATED' ? new Date() : null,
          validatedBy: stepConfig.status === 'VALIDATED' ? admin.id : null,
        },
      })
    }

    // Créer l'historique MPR
    await prisma.mprHistory.create({
      data: {
        dossierId: newDossier.id,
        action: 'SUBMITTED',
        newValue: clientData.mprId,
        actorId: selectedArtisan.id,
        actorType: 'ARTISAN',
      },
    })

    await prisma.mprHistory.create({
      data: {
        dossierId: newDossier.id,
        action: 'APPROVED',
        previousValue: clientData.mprId,
        newValue: clientData.mprId,
        actorId: null,
        actorType: 'SYSTEM',
        message: 'Validation automatique',
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: selectedArtisan.id,
        dossierId: newDossier.id,
        action: 'ARTISAN_DOSSIER_CREATED',
        details: `Dossier créé par ${selectedArtisan.firstName} ${selectedArtisan.lastName} pour ${clientData.endClientFirstName} ${clientData.endClientLastName}`,
      },
    })

    console.log(`  - ${clientData.endClientFirstName} ${clientData.endClientLastName} (${newReference}) - Étape ${clientData.currentStep} [${selectedArtisan.firstName} ${selectedArtisan.lastName}]`)
    clientIndex++
  }

  console.log('11 artisan-managed dossiers created!')
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
