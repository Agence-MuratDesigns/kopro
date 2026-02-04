export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { blockStep } from '@/lib/dossier-service'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string; stepId: string }>
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session || !['ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id, stepId } = await context.params
    const body = await request.json()

    if (!body.reason) {
      return NextResponse.json({ error: 'Raison requise' }, { status: 400 })
    }

    const result = await blockStep(id, stepId, body.reason)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        dossierId: id,
        action: 'STEP_BLOCKED',
        details: `Étape bloquée: ${body.reason}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Block step error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
