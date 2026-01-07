const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const db = new Database('prisma/dev.db');

// Create tables
console.log('Creating tables...');

db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'CLIENT',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    createdById TEXT,
    firstLoginAt TEXT,
    mustChangePassword INTEGER DEFAULT 1,
    lastLoginAt TEXT,
    address TEXT,
    addressComplement TEXT,
    postalCode TEXT,
    city TEXT,
    avatarUrl TEXT,
    soundEnabled INTEGER DEFAULT 1,
    emailNotifications INTEGER DEFAULT 1,
    pushNotifications INTEGER DEFAULT 1,
    preferredChannel TEXT DEFAULT 'BOTH'
  );

  -- Dossiers table
  CREATE TABLE IF NOT EXISTS dossiers (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'BROUILLON',
    currentStep INTEGER DEFAULT 2,
    isActive INTEGER DEFAULT 1,
    mprId TEXT,
    mprStatus TEXT DEFAULT 'DRAFT',
    mprSubmittedAt TEXT,
    mprLastUpdatedAt TEXT,
    mprReviewedAt TEXT,
    mprReviewMessage TEXT,
    mprReviewedById TEXT,
    mprCertified INTEGER DEFAULT 0,
    mandatStatus TEXT DEFAULT 'DRAFT',
    mandatSignedAt TEXT,
    mandatMethod TEXT,
    mandatReviewMessage TEXT,
    selectedWorks TEXT,
    worksSelectedAt TEXT,
    quotesStatus TEXT DEFAULT 'DRAFT',
    quotesSubmittedAt TEXT,
    quotesReviewMessage TEXT,
    workStartedAt TEXT,
    workStatus TEXT DEFAULT 'NOT_STARTED',
    invoicesStatus TEXT DEFAULT 'DRAFT',
    invoicesSubmittedAt TEXT,
    invoicesReviewMessage TEXT,
    closedAt TEXT,
    closedById TEXT,
    projectType TEXT,
    projectAddress TEXT,
    projectCity TEXT,
    projectPostalCode TEXT,
    estimatedBudget REAL,
    mprAmount REAL,
    ceeAmount REAL,
    totalWorksAmount REAL,
    mprPaidAmount REAL,
    ceePaidAmount REAL,
    paymentStatus TEXT DEFAULT 'PENDING',
    revenueCategory TEXT,
    householdSize INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    clientId TEXT NOT NULL,
    advisorId TEXT,
    FOREIGN KEY (clientId) REFERENCES users(id),
    FOREIGN KEY (advisorId) REFERENCES users(id)
  );

  -- Step templates table
  CREATE TABLE IF NOT EXISTS step_templates (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    category TEXT NOT NULL,
    requiredDocs TEXT,
    validationRules TEXT,
    autoValidation INTEGER DEFAULT 0,
    adminOnly INTEGER DEFAULT 0
  );

  -- Dossier steps table
  CREATE TABLE IF NOT EXISTS dossier_steps (
    id TEXT PRIMARY KEY,
    status TEXT DEFAULT 'LOCKED',
    startedAt TEXT,
    completedAt TEXT,
    validatedAt TEXT,
    validatedBy TEXT,
    notes TEXT,
    blockedReason TEXT,
    data TEXT,
    dossierId TEXT NOT NULL,
    templateId TEXT NOT NULL,
    FOREIGN KEY (dossierId) REFERENCES dossiers(id) ON DELETE CASCADE,
    FOREIGN KEY (templateId) REFERENCES step_templates(id),
    UNIQUE(dossierId, templateId)
  );

  -- Documents table
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    workType TEXT,
    fileName TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    mimeType TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    rejectionReason TEXT,
    uploadedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    validatedAt TEXT,
    uploaderId TEXT NOT NULL,
    dossierId TEXT NOT NULL,
    stepId TEXT,
    FOREIGN KEY (uploaderId) REFERENCES users(id),
    FOREIGN KEY (dossierId) REFERENCES dossiers(id) ON DELETE CASCADE,
    FOREIGN KEY (stepId) REFERENCES dossier_steps(id)
  );

  -- Messages table
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    isRead INTEGER DEFAULT 0,
    messageType TEXT DEFAULT 'CLIENT',
    category TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    senderId TEXT,
    dossierId TEXT NOT NULL,
    FOREIGN KEY (senderId) REFERENCES users(id),
    FOREIGN KEY (dossierId) REFERENCES dossiers(id) ON DELETE CASCADE
  );

  -- Notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    isRead INTEGER DEFAULT 0,
    link TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    userId TEXT NOT NULL,
    dossierId TEXT,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (dossierId) REFERENCES dossiers(id) ON DELETE CASCADE
  );

  -- Activity logs table
  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT,
    ipAddress TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    userId TEXT,
    dossierId TEXT,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (dossierId) REFERENCES dossiers(id) ON DELETE CASCADE
  );

  -- MPR history table
  CREATE TABLE IF NOT EXISTS mpr_history (
    id TEXT PRIMARY KEY,
    dossierId TEXT NOT NULL,
    previousValue TEXT,
    newValue TEXT,
    action TEXT NOT NULL,
    actorId TEXT,
    actorType TEXT NOT NULL,
    message TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dossierId) REFERENCES dossiers(id) ON DELETE CASCADE
  );
`);

console.log('Tables created!');

// Seed data
console.log('Seeding data...');

const now = new Date().toISOString();

// Create admin user
const adminId = randomUUID();
const adminPassword = bcrypt.hashSync('admin123', 10);
db.prepare(`
  INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt, mustChangePassword)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(adminId, 'admin@kopro.fr', adminPassword, 'Admin', 'KOPRO', 'ADMIN', now, now, 0);
console.log('✓ Admin user created: admin@kopro.fr / admin123');

// Create advisor user
const advisorId = randomUUID();
const advisorPassword = bcrypt.hashSync('admin123', 10);
db.prepare(`
  INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt, mustChangePassword)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(advisorId, 'conseiller@kopro.fr', advisorPassword, 'Jean', 'Conseiller', 'ADVISOR', now, now, 0);
console.log('✓ Advisor user created: conseiller@kopro.fr / admin123');

// Create client user
const clientId = randomUUID();
const clientPassword = bcrypt.hashSync('client123', 10);
db.prepare(`
  INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt, mustChangePassword)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(clientId, 'client@exemple.fr', clientPassword, 'Marie', 'Dupont', 'CLIENT', now, now, 0);
console.log('✓ Client user created: client@exemple.fr / client123');

// Create step templates
const stepTemplates = [
  { code: 'CLIENT_CREATION', name: 'Création du compte', description: 'Création du compte client par l\'administrateur', order: 1, category: 'ADMIN_SETUP', adminOnly: 1 },
  { code: 'MPR_IDENTIFIER', name: 'Identifiant MaPrimeRénov\'', description: 'Saisissez votre identifiant MaPrimeRénov\' (format: MPR-XXXXAB)', order: 2, category: 'CLIENT_ACTION' },
  { code: 'MANDATE_SIGNATURE', name: 'Signature du mandat', description: 'Signez le mandat administratif pour nous autoriser à effectuer les démarches', order: 3, category: 'CLIENT_ACTION' },
  { code: 'WORK_SELECTION', name: 'Sélection des travaux', description: 'Sélectionnez les types de travaux que vous souhaitez réaliser', order: 4, category: 'CLIENT_ACTION', autoValidation: 1 },
  { code: 'QUOTE_DEPOSIT', name: 'Dépôt des devis', description: 'Déposez les devis correspondant aux travaux sélectionnés', order: 5, category: 'CLIENT_ACTION' },
  { code: 'WORK_AUTHORIZATION', name: 'Autorisation des travaux', description: 'Confirmez le démarrage des travaux une fois les devis validés', order: 6, category: 'CLIENT_ACTION' },
  { code: 'INVOICE_DEPOSIT', name: 'Dépôt des factures', description: 'Déposez les factures finales une fois les travaux terminés', order: 7, category: 'CLIENT_ACTION' },
  { code: 'FINAL_RECAP', name: 'Récapitulatif final', description: 'Consultez le récapitulatif de votre dossier et les informations de versement', order: 8, category: 'FINAL' },
];

const insertStep = db.prepare(`
  INSERT INTO step_templates (id, code, name, description, "order", category, autoValidation, adminOnly)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const templateIds = {};
stepTemplates.forEach(step => {
  const id = randomUUID();
  templateIds[step.code] = id;
  insertStep.run(id, step.code, step.name, step.description, step.order, step.category, step.autoValidation || 0, step.adminOnly || 0);
});
console.log('✓ Step templates created');

// Create a dossier for the client
const dossierId = randomUUID();
const reference = 'KOPRO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
db.prepare(`
  INSERT INTO dossiers (id, reference, status, currentStep, clientId, advisorId, createdAt, updatedAt, mprAmount, ceeAmount)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(dossierId, reference, 'EN_COURS', 2, clientId, advisorId, now, now, 5000, 2500);
console.log(`✓ Dossier created: ${reference}`);

// Create dossier steps
const insertDossierStep = db.prepare(`
  INSERT INTO dossier_steps (id, status, dossierId, templateId)
  VALUES (?, ?, ?, ?)
`);

stepTemplates.forEach((step, index) => {
  let status = 'LOCKED';
  if (index === 0) status = 'VALIDATED'; // First step is done (account created)
  if (index === 1) status = 'AVAILABLE'; // Second step is available

  insertDossierStep.run(randomUUID(), status, dossierId, templateIds[step.code]);
});
console.log('✓ Dossier steps created');

// Create welcome notification
db.prepare(`
  INSERT INTO notifications (id, type, title, message, userId, dossierId, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(randomUUID(), 'WELCOME', 'Bienvenue sur KOPRO', 'Votre compte a été créé avec succès. Commencez par saisir votre identifiant MaPrimeRénov\'.', clientId, dossierId, now);

// Create welcome message
db.prepare(`
  INSERT INTO messages (id, content, messageType, category, dossierId, createdAt)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(randomUUID(), 'Bienvenue sur KOPRO ! Votre dossier de rénovation a été créé. Vous pouvez maintenant commencer par saisir votre identifiant MaPrimeRénov\'.', 'SYSTEM', 'INFO', dossierId, now);
console.log('✓ Welcome notification and message created');

db.close();
console.log('\n✅ Database setup complete!');
console.log('\nComptes de test:');
console.log('  Client:    client@exemple.fr / client123');
console.log('  Admin:     admin@kopro.fr / admin123');
console.log('  Conseiller: conseiller@kopro.fr / admin123');
