-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "firstLoginAt" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT,
    "addressComplement" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "avatarUrl" TEXT,
    "companyName" TEXT,
    "siret" TEXT,
    "companyAddress" TEXT,
    "companyPostalCode" TEXT,
    "companyCity" TEXT,
    "rgeQualifications" TEXT,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "preferredChannel" TEXT NOT NULL DEFAULT 'BOTH',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BROUILLON',
    "currentStep" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mprId" TEXT,
    "mprStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "mprSubmittedAt" TIMESTAMP(3),
    "mprLastUpdatedAt" TIMESTAMP(3),
    "mprReviewedAt" TIMESTAMP(3),
    "mprReviewMessage" TEXT,
    "mprReviewedById" TEXT,
    "mprCertified" BOOLEAN NOT NULL DEFAULT false,
    "projectInfoStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "projectInfoSubmittedAt" TIMESTAMP(3),
    "projectInfoReviewedAt" TIMESTAMP(3),
    "projectInfoReviewMessage" TEXT,
    "projectInfoLastSavedAt" TIMESTAMP(3),
    "energyType" TEXT,
    "housingType" TEXT,
    "housingSurface" DOUBLE PRECISION,
    "constructionYear" INTEGER,
    "ownershipStatus" TEXT,
    "servicePaymentStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "servicePaymentAmount" INTEGER,
    "servicePaymentCompletedAt" TIMESTAMP(3),
    "mandatStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "mandatSignedAt" TIMESTAMP(3),
    "mandatMethod" TEXT,
    "mandatReviewMessage" TEXT,
    "selectedWorks" TEXT,
    "worksSelectedAt" TIMESTAMP(3),
    "quotesStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "quotesSubmittedAt" TIMESTAMP(3),
    "quotesReviewMessage" TEXT,
    "workStartedAt" TIMESTAMP(3),
    "workStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "invoicesStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "invoicesSubmittedAt" TIMESTAMP(3),
    "invoicesReviewMessage" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "projectType" TEXT,
    "projectAddress" TEXT,
    "projectCity" TEXT,
    "projectPostalCode" TEXT,
    "estimatedBudget" DOUBLE PRECISION,
    "mprAmount" DOUBLE PRECISION,
    "ceeAmount" DOUBLE PRECISION,
    "totalWorksAmount" DOUBLE PRECISION,
    "mprPaidAmount" DOUBLE PRECISION,
    "ceePaidAmount" DOUBLE PRECISION,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "revenueCategory" TEXT,
    "householdSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "advisorId" TEXT,
    "artisanId" TEXT,
    "endClientFirstName" TEXT,
    "endClientLastName" TEXT,
    "endClientEmail" TEXT,
    "endClientPhone" TEXT,
    "endClientAddress" TEXT,
    "endClientPostalCode" TEXT,
    "endClientCity" TEXT,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mpr_history" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mpr_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "requiredDocs" TEXT,
    "validationRules" TEXT,
    "autoValidation" BOOLEAN NOT NULL DEFAULT false,
    "adminOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "step_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_steps" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "notes" TEXT,
    "blockedReason" TEXT,
    "data" TEXT,
    "dossierId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "dossier_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "workType" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),
    "uploaderId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "stepId" TEXT,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "messageType" TEXT NOT NULL DEFAULT 'CLIENT',
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT,
    "dossierId" TEXT NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "dossierId" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "dossierId" TEXT,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "description" TEXT,
    "customerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "dossierId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_reference_key" ON "dossiers"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "step_templates_code_key" ON "step_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_steps_dossierId_templateId_key" ON "dossier_steps"("dossierId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripeSessionId_key" ON "payments"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentId_key" ON "payments"("stripePaymentId");

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mpr_history" ADD CONSTRAINT "mpr_history_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_steps" ADD CONSTRAINT "dossier_steps_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_steps" ADD CONSTRAINT "dossier_steps_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "step_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "dossier_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
