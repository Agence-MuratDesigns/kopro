import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

interface Context {
  params: Promise<{ id: string; docId: string }>
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id, docId } = await context.params

    // Get dossier and verify access
    const dossier = await prisma.dossier.findUnique({
      where: { id },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check authorization: client owns the dossier OR user is admin/advisor
    const isOwner = dossier.clientId === session.userId
    const isAdmin = session.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: docId, dossierId: id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    // Read file from disk
    const filePath = join(process.cwd(), 'uploads', id, document.fileName)

    try {
      const fileBuffer = await readFile(filePath)

      // Return file with inline disposition for viewing in browser
      const headers = new Headers()
      headers.set('Content-Type', document.mimeType || 'application/pdf')
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(document.name)}"`)
      headers.set('Content-Length', String(fileBuffer.length))

      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      })
    } catch {
      return NextResponse.json({ error: 'Fichier non trouvé sur le serveur' }, { status: 404 })
    }
  } catch (error) {
    console.error('Document view error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
