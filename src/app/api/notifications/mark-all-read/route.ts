import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const user = { id: session.userId }

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Mark All Read] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
