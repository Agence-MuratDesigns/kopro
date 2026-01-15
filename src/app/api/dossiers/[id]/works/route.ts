import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { WORK_TYPES } from '@/lib/utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Submit work selection
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()
    const body = await request.json()
    const { works } = body

    // Validate works array
    if (!Array.isArray(works) || works.length === 0) {
      return NextResponse.json(
        { error: 'Veuillez sélectionner au moins un type de travaux' },
        { status: 400 }
      )
    }

    // Validate work type codes
    const validCodes: readonly string[] = WORK_TYPES.map(w => w.code)
    const invalidCodes = works.filter((code: string) => !validCodes.includes(code))
    if (invalidCodes.length > 0) {
      return NextResponse.json(
        { error: `Types de travaux invalides : ${invalidCodes.join(', ')}` },
        { status: 400 }
      )
    }

    // Get dossier and verify ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      include: {
        client: true,
        steps: {
          include: { template: true },
          orderBy: { template: { order: 'asc' } },
        },
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    if (dossier.clientId !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Find the WORK_SELECTION step (étape 4)
    const workStep = dossier.steps.find(s => s.template.code === 'WORK_SELECTION')
    if (!workStep) {
      return NextResponse.json(
        { error: 'Étape de sélection des travaux non trouvée' },
        { status: 400 }
      )
    }

    // Find the QUOTE_DEPOSIT step (étape 5)
    const quoteStep = dossier.steps.find(s => s.template.code === 'QUOTE_DEPOSIT')

    // Check if step is available (not locked)
    if (workStep.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas encore accessible' },
        { status: 400 }
      )
    }

    // Vérifier si c'est une modification (works déjà sélectionnés et étape déjà validée)
    const previousWorks = dossier.selectedWorks ? JSON.parse(dossier.selectedWorks) : []
    const isModification = previousWorks.length > 0 && workStep.status === 'VALIDATED'

    // Si c'est une modification, vérifier que l'étape 5 (devis) n'est pas encore validée
    if (isModification && quoteStep && quoteStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Les devis ont déjà été validés. Vous ne pouvez plus modifier les travaux sélectionnés.' },
        { status: 400 }
      )
    }

    // Identifier les travaux retirés et ajoutés
    const removedWorks = previousWorks.filter((w: string) => !works.includes(w))
    const addedWorks = works.filter((w: string) => !previousWorks.includes(w))
    const hasSelectionChanged = removedWorks.length > 0 || addedWorks.length > 0

    // Update dossier and step in transaction
    await prisma.$transaction(async (tx) => {
      // Update dossier with selected works
      const dossierUpdateData: Record<string, unknown> = {
        selectedWorks: JSON.stringify(works),
        worksSelectedAt: new Date(),
        currentStep: isModification ? dossier.currentStep : 5,
      }

      // Si c'est une modification et que la sélection a changé, réinitialiser le statut des devis
      if (isModification && hasSelectionChanged) {
        dossierUpdateData.quotesStatus = null
        dossierUpdateData.quotesSubmittedAt = null
        dossierUpdateData.quotesReviewedAt = null
        dossierUpdateData.quotesReviewMessage = null
      }

      await tx.dossier.update({
        where: { id: dossierId },
        data: dossierUpdateData,
      })

      // Si c'est la première soumission, valider l'étape 4 (auto-validation)
      if (!isModification) {
        await tx.dossierStep.update({
          where: { id: workStep.id },
          data: {
            status: 'VALIDATED',
            startedAt: workStep.startedAt || new Date(),
            completedAt: new Date(),
            validatedAt: new Date(),
          },
        })

        // Unlock next step if it exists
        if (quoteStep) {
          await tx.dossierStep.update({
            where: { id: quoteStep.id },
            data: {
              status: 'AVAILABLE',
            },
          })
        }
      }

      // Si des travaux ont été retirés, supprimer les documents (devis) associés
      if (removedWorks.length > 0) {
        await tx.document.deleteMany({
          where: {
            dossierId,
            type: 'DEVIS',
            workType: { in: removedWorks },
          },
        })
      }

      // Si la sélection a changé (ajout ou suppression), réinitialiser l'étape 5
      if (isModification && hasSelectionChanged && quoteStep) {
        // Remettre l'étape 5 en AVAILABLE pour que le client redépose/confirme ses devis
        if (quoteStep.status === 'PENDING_VALIDATION' || quoteStep.status === 'IN_PROGRESS') {
          await tx.dossierStep.update({
            where: { id: quoteStep.id },
            data: {
              status: 'AVAILABLE',
              completedAt: null,
            },
          })
        }
      }

      // Create notification for admins
      const admins = await tx.user.findMany({
        where: { role: { in: ['ADMIN'] } },
      })

      // Get work labels for notification
      const workLabels = works
        .map((code: string) => WORK_TYPES.find(w => w.code === code)?.label)
        .filter(Boolean)
        .join(', ')

      for (const admin of admins) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            dossierId,
            type: 'WORKS_SELECTED',
            title: isModification ? 'Travaux modifiés' : 'Travaux sélectionnés',
            message: `${user.firstName} ${user.lastName} a ${isModification ? 'modifié' : 'sélectionné'} les travaux suivants : ${workLabels}`,
            link: `/admin/dossiers/${dossierId}`,
          },
        })
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          dossierId,
          action: 'WORKS_SELECTED',
          details: `Travaux ${isModification ? 'modifiés' : 'sélectionnés'} : ${workLabels}`,
        },
      })
    })

    // Construire le message de retour
    let successMessage = 'Travaux sélectionnés avec succès ! Vous pouvez passer à l\'étape suivante.'
    if (isModification) {
      if (hasSelectionChanged) {
        successMessage = 'Travaux modifiés avec succès. Veuillez vérifier vos devis à l\'étape suivante.'
        if (removedWorks.length > 0) {
          successMessage = 'Travaux modifiés avec succès. Les devis des travaux retirés ont été supprimés. Veuillez vérifier vos devis à l\'étape suivante.'
        }
      } else {
        successMessage = 'Aucune modification effectuée.'
      }
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
    })
  } catch (error) {
    console.error('Error submitting works:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'enregistrement des travaux' },
      { status: 500 }
    )
  }
}

// GET - Get selected works
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
      select: {
        clientId: true,
        selectedWorks: true,
        worksSelectedAt: true,
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    if (dossier.clientId !== user.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    const selectedWorks = dossier.selectedWorks
      ? JSON.parse(dossier.selectedWorks)
      : []

    return NextResponse.json({
      selectedWorks,
      worksSelectedAt: dossier.worksSelectedAt,
    })
  } catch (error) {
    console.error('Error fetching works:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}
