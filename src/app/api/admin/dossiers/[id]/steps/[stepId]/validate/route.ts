import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { validateStep } from '@/lib/dossier-service'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string; stepId: string }>
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session || !['ADMIN', 'ADVISOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id, stepId } = await context.params
    const body = await request.json().catch(() => ({}))

    const result = await validateStep(id, stepId, session.userId, body.notes)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        dossierId: id,
        action: 'STEP_VALIDATED',
        details: `Étape validée${body.notes ? `: ${body.notes}` : ''}`,
      },
    })

    return NextResponse.json({ success: true, nextStep: result.nextStep })
  } catch (error) {
    console.error('Validate step error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
