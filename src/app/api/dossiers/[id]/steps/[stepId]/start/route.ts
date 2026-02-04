export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { startStep } from '@/lib/dossier-service'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string; stepId: string }>
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id, stepId } = await context.params

    // Verify ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id },
    })

    if (!dossier || dossier.clientId !== session.userId) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    const result = await startStep(id, stepId)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Start step error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
