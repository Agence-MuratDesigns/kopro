import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

interface Context {
  params: Promise<{ id: string; docId: string }>
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id, docId } = await context.params

    // Verify ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id },
    })

    if (!dossier || dossier.clientId !== session.userId) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check if invoices can be modified
    if (dossier.invoicesStatus === 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Les factures sont en cours de vérification et ne peuvent pas être modifiées' },
        { status: 400 }
      )
    }

    if (dossier.invoicesStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Les factures ont été validées et ne peuvent plus être modifiées' },
        { status: 400 }
      )
    }

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id: docId },
    })

    if (!document || document.dossierId !== id) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    if (document.type !== 'FACTURE') {
      return NextResponse.json(
        { error: 'Ce document n\'est pas une facture' },
        { status: 400 }
      )
    }

    // Only allow deletion of documents uploaded by the user
    if (document.uploaderId !== session.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer ce document' },
        { status: 403 }
      )
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), document.filePath)
      await unlink(filePath)
    } catch {
      // File might not exist, continue with database deletion
      console.warn(`File not found: ${document.filePath}`)
    }

    // Delete document record
    await prisma.document.delete({
      where: { id: docId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Invoice delete error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id, docId } = await context.params

    // Verify ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id },
    })

    if (!dossier || dossier.clientId !== session.userId) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id: docId },
    })

    if (!document || document.dossierId !== id) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Invoice get error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
