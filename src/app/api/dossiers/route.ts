import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createDossier } from '@/lib/dossier-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()

    const dossier = await createDossier(session.userId, {
      projectType: body.projectType,
      projectAddress: body.projectAddress,
      projectCity: body.projectCity,
      projectPostalCode: body.projectPostalCode,
      estimatedBudget: body.estimatedBudget,
      revenueCategory: body.revenueCategory,
      householdSize: body.householdSize,
    })

    return NextResponse.json({ dossier })
  } catch (error) {
    console.error('Create dossier error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
