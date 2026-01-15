import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string }>
}

// PATCH - Update amounts without closing the dossier
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { totalWorksAmount, mprAmount, ceeAmount } = body

    // Get dossier
    const dossier = await prisma.dossier.findUnique({
      where: { id },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Update dossier amounts
    const updatedDossier = await prisma.dossier.update({
      where: { id },
      data: {
        totalWorksAmount: totalWorksAmount !== undefined ? totalWorksAmount : dossier.totalWorksAmount,
        mprAmount: mprAmount !== undefined ? mprAmount : dossier.mprAmount,
        ceeAmount: ceeAmount !== undefined ? ceeAmount : dossier.ceeAmount,
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: 'AMOUNTS_UPDATED',
        details: `Montants mis à jour: Travaux=${totalWorksAmount}€, MPR=${mprAmount}€, CEE=${ceeAmount}€`,
        userId: session.userId,
        dossierId: id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Montants mis à jour avec succès',
      dossier: updatedDossier,
    })
  } catch (error) {
    console.error('Update amounts error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
