import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'
import archiver from 'archiver'
import { Readable, PassThrough } from 'stream'

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await context.params

    // Get dossier and verify access
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        documents: true,
        client: {
          select: { firstName: true, lastName: true },
        },
      },
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

    if (dossier.documents.length === 0) {
      return NextResponse.json({ error: 'Aucun document à télécharger' }, { status: 404 })
    }

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } })
    const passThrough = new PassThrough()

    archive.pipe(passThrough)

    // Organize documents by category
    const adminDocs = dossier.documents.filter(d => ['MANDAT', 'ATTESTATION'].includes(d.type))
    const techDocs = dossier.documents.filter(d => ['DEVIS', 'FACTURE'].includes(d.type))
    const otherDocs = dossier.documents.filter(d => !['MANDAT', 'ATTESTATION', 'DEVIS', 'FACTURE'].includes(d.type))

    // Add documents to archive by category
    for (const doc of adminDocs) {
      try {
        const filePath = join(process.cwd(), 'uploads', id, doc.fileName)
        const fileBuffer = await readFile(filePath)
        archive.append(fileBuffer, { name: `Documents_Administratifs/${doc.name}` })
      } catch {
        console.warn(`File not found: ${doc.fileName}`)
      }
    }

    for (const doc of techDocs) {
      try {
        const filePath = join(process.cwd(), 'uploads', id, doc.fileName)
        const fileBuffer = await readFile(filePath)
        const folder = doc.type === 'DEVIS' ? 'Devis' : 'Factures'
        archive.append(fileBuffer, { name: `Documents_Techniques/${folder}/${doc.name}` })
      } catch {
        console.warn(`File not found: ${doc.fileName}`)
      }
    }

    for (const doc of otherDocs) {
      try {
        const filePath = join(process.cwd(), 'uploads', id, doc.fileName)
        const fileBuffer = await readFile(filePath)
        archive.append(fileBuffer, { name: `Autres/${doc.name}` })
      } catch {
        console.warn(`File not found: ${doc.fileName}`)
      }
    }

    archive.finalize()

    // Convert stream to buffer for response
    const chunks: Buffer[] = []
    for await (const chunk of passThrough) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const zipBuffer = Buffer.concat(chunks)

    // Filename for download
    const clientName = dossier.client
      ? `${dossier.client.firstName}_${dossier.client.lastName}`.replace(/\s+/g, '_')
      : dossier.endClientFirstName
        ? `${dossier.endClientFirstName}_${dossier.endClientLastName || ''}`.replace(/\s+/g, '_')
        : 'Client'
    const fileName = `Dossier_${dossier.reference}_${clientName}.zip`

    // Return ZIP file
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    headers.set('Content-Length', String(zipBuffer.length))

    return new NextResponse(zipBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Batch download error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
