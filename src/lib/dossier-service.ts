import { prisma } from './prisma'
import { generateReference } from './utils'

export async function createDossier(clientId: string, data: {
  projectType?: string
  projectAddress?: string
  projectCity?: string
  projectPostalCode?: string
  estimatedBudget?: number
  revenueCategory?: string
  householdSize?: number
}) {
  // Generate unique reference
  let reference = generateReference()
  let exists = await prisma.dossier.findUnique({ where: { reference } })
  while (exists) {
    reference = generateReference()
    exists = await prisma.dossier.findUnique({ where: { reference } })
  }

  // Create dossier with all steps
  const dossier = await prisma.dossier.create({
    data: {
      reference,
      clientId,
      status: 'EN_COURS',
      currentStep: 2,
      mprStatus: 'DRAFT',
      ...data,
    },
  })

  // Get all step templates
  const templates = await prisma.stepTemplate.findMany({
    orderBy: { order: 'asc' },
  })

  // Create all steps for this dossier
  // Step 1 (CLIENT_CREATION) is auto-validated since client already has an account
  // Step 2 (MPR_IDENTIFIER) is set to AVAILABLE for client to start
  // All other steps are LOCKED
  for (let i = 0; i < templates.length; i++) {
    let status = 'LOCKED'
    if (i === 0) {
      status = 'VALIDATED' // Step 1 auto-validated (client has account)
    } else if (i === 1) {
      status = 'AVAILABLE' // Step 2 available for client input
    }

    await prisma.dossierStep.create({
      data: {
        dossierId: dossier.id,
        templateId: templates[i].id,
        status,
        validatedAt: i === 0 ? new Date() : null,
        startedAt: i === 1 ? new Date() : null,
      },
    })
  }

  // Create initial notification
  await prisma.notification.create({
    data: {
      userId: clientId,
      dossierId: dossier.id,
      type: 'STEP_AVAILABLE',
      title: 'Dossier créé',
      message: `Votre dossier ${reference} a été créé. Vous pouvez commencer en renseignant votre identifiant MaPrimeRénov'.`,
      link: `/dossier/${dossier.id}`,
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: clientId,
      dossierId: dossier.id,
      action: 'DOSSIER_CREATED',
      details: `Nouveau dossier créé : ${reference}`,
    },
  })

  return dossier
}

export async function getDossierWithSteps(dossierId: string) {
  return prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          firstLoginAt: true,
        },
      },
      artisan: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          companyName: true,
          siret: true,
        },
      },
      advisor: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      steps: {
        include: {
          template: true,
          documents: true,
        },
        orderBy: {
          template: {
            order: 'asc',
          },
        },
      },
      documents: true,
      mprHistory: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: {
        select: {
          messages: true,
          documents: true,
        },
      },
    },
  })
}

export async function getClientDossiers(clientId: string) {
  return prisma.dossier.findMany({
    where: { clientId },
    include: {
      steps: {
        include: {
          template: true,
        },
        orderBy: {
          template: {
            order: 'asc',
          },
        },
      },
      _count: {
        select: {
          messages: true,
          documents: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function startStep(dossierId: string, stepId: string) {
  const step = await prisma.dossierStep.findUnique({
    where: { id: stepId },
    include: { template: true },
  })

  if (!step || step.status !== 'AVAILABLE') {
    return { error: 'Cette étape n\'est pas disponible' }
  }

  await prisma.dossierStep.update({
    where: { id: stepId },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  })

  // Note: currentStep is tracked via step status, not a direct field update

  return { success: true }
}

export async function completeStep(dossierId: string, stepId: string) {
  const step = await prisma.dossierStep.findUnique({
    where: { id: stepId },
    include: { template: true, dossier: true },
  })

  if (!step || step.status !== 'IN_PROGRESS') {
    return { error: 'Cette étape ne peut pas être complétée' }
  }

  // Check if required documents are uploaded and validated
  if (step.template.requiredDocs) {
    const requiredTypes = JSON.parse(step.template.requiredDocs)
    const uploadedDocs = await prisma.document.findMany({
      where: {
        stepId,
        status: 'VALIDATED',
      },
    })

    const uploadedTypes = uploadedDocs.map(d => d.type)
    const missingDocs = requiredTypes.filter((t: string) => !uploadedTypes.includes(t))

    if (missingDocs.length > 0) {
      return { error: 'Tous les documents requis ne sont pas validés' }
    }
  }

  // Mark step as pending validation (will be validated by admin)
  await prisma.dossierStep.update({
    where: { id: stepId },
    data: {
      status: 'PENDING_VALIDATION',
      completedAt: new Date(),
    },
  })

  // Notify admins
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
  })

  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        dossierId,
        type: 'STEP_VALIDATED',
        title: 'Étape à valider',
        message: `L'étape "${step.template.name}" du dossier ${step.dossier.reference} est en attente de validation.`,
        link: `/admin/dossiers/${dossierId}`,
      },
    })
  }

  return { success: true }
}

export async function validateStep(
  dossierId: string,
  stepId: string,
  validatorId: string,
  notes?: string
) {
  const step = await prisma.dossierStep.findUnique({
    where: { id: stepId },
    include: { template: true, dossier: true },
  })

  if (!step) {
    return { error: 'Étape non trouvée' }
  }

  // Validate current step
  await prisma.dossierStep.update({
    where: { id: stepId },
    data: {
      status: 'VALIDATED',
      validatedAt: new Date(),
      validatedBy: validatorId,
      notes,
    },
  })

  // Find and unlock next step
  const allSteps = await prisma.dossierStep.findMany({
    where: { dossierId },
    include: { template: true },
    orderBy: { template: { order: 'asc' } },
  })

  const currentIndex = allSteps.findIndex(s => s.id === stepId)
  const nextStep = allSteps[currentIndex + 1]

  const notifyUserId = step.dossier.clientId || step.dossier.artisanId

  if (nextStep) {
    await prisma.dossierStep.update({
      where: { id: nextStep.id },
      data: { status: 'AVAILABLE' },
    })

    // Notify client or artisan
    if (notifyUserId) {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          dossierId,
          type: 'STEP_AVAILABLE',
          title: 'Nouvelle étape disponible',
          message: `L'étape "${nextStep.template.name}" est maintenant disponible.`,
          link: `/dossier/${dossierId}/etape/${nextStep.template.code}`,
        },
      })
    }
  } else {
    // All steps completed
    await prisma.dossier.update({
      where: { id: dossierId },
      data: { status: 'TERMINE' },
    })

    if (notifyUserId) {
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          dossierId,
          type: 'DOSSIER_UPDATE',
          title: 'Dossier terminé',
          message: 'Félicitations ! Le dossier est maintenant complet.',
          link: `/dossier/${dossierId}`,
        },
      })
    }
  }

  // Notify client or artisan of validation
  if (notifyUserId) {
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        dossierId,
        type: 'STEP_VALIDATED',
        title: 'Étape validée',
        message: `L'étape "${step.template.name}" a été validée.`,
        link: `/dossier/${dossierId}`,
      },
    })
  }

  return { success: true, nextStep: nextStep?.template.code }
}

export async function blockStep(
  dossierId: string,
  stepId: string,
  reason: string
) {
  const step = await prisma.dossierStep.findUnique({
    where: { id: stepId },
    include: { template: true, dossier: true },
  })

  if (!step) {
    return { error: 'Étape non trouvée' }
  }

  await prisma.dossierStep.update({
    where: { id: stepId },
    data: {
      status: 'BLOCKED',
      blockedReason: reason,
    },
  })

  await prisma.dossier.update({
    where: { id: dossierId },
    data: { status: 'EN_ATTENTE' },
  })

  // Notify client or artisan
  const notifyUserId = step.dossier.clientId || step.dossier.artisanId
  if (notifyUserId) {
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        dossierId,
        type: 'STEP_BLOCKED',
        title: 'Étape bloquée',
        message: `L'étape "${step.template.name}" nécessite votre attention : ${reason}`,
        link: `/dossier/${dossierId}/etape/${step.template.code}`,
      },
    })
  }

  return { success: true }
}

export async function unblockStep(dossierId: string, stepId: string) {
  await prisma.dossierStep.update({
    where: { id: stepId },
    data: {
      status: 'IN_PROGRESS',
      blockedReason: null,
    },
  })

  await prisma.dossier.update({
    where: { id: dossierId },
    data: { status: 'EN_COURS' },
  })

  return { success: true }
}

export function calculateProgress(steps: { status: string }[]): number {
  const validatedCount = steps.filter(s => s.status === 'VALIDATED').length
  return Math.round((validatedCount / steps.length) * 100)
}
