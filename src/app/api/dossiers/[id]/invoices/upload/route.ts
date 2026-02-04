export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { id } = await context.params

    // Verify ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        steps: {
          include: { template: true },
        },
      },
    })

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check access: client owns the dossier OR artisan manages it
    const isOwner = dossier.clientId === session.userId
    const isArtisanManager = dossier.artisanId === session.userId
    if (!isOwner && !isArtisanManager) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Verify step is accessible
    const invoiceStep = dossier.steps.find(s => s.template.code === 'INVOICE_DEPOSIT')
    if (!invoiceStep || !['AVAILABLE', 'IN_PROGRESS'].includes(invoiceStep.status)) {
      // Allow if rejected to enable resubmission
      if (dossier.invoicesStatus !== 'REJECTED') {
        return NextResponse.json(
          { error: 'Cette étape n\'est pas accessible' },
          { status: 400 }
        )
      }
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const workType = formData.get('workType') as string

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    if (!workType) {
      return NextResponse.json({ error: 'Type de travaux requis' }, { status: 400 })
    }

    // Validate file type - PDF only for invoices
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Seuls les fichiers PDF sont acceptés' },
        { status: 400 }
      )
    }

    // Max file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 10 Mo' },
        { status: 400 }
      )
    }

    // Parse selected works from JSON string
    const selectedWorks: string[] = dossier.selectedWorks
      ? JSON.parse(dossier.selectedWorks)
      : []

    // Validate work type is selected for this dossier
    if (!selectedWorks.includes(workType)) {
      return NextResponse.json(
        { error: 'Type de travaux non sélectionné pour ce dossier' },
        { status: 400 }
      )
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', id, 'invoices')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const fileName = `FACTURE_${workType}_${timestamp}.${ext}`
    const filePath = join(uploadDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: file.name,
        type: 'FACTURE',
        workType,
        fileName,
        filePath: `/uploads/${id}/invoices/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        uploaderId: session.userId,
        dossierId: id,
        stepId: invoiceStep?.id || null,
      },
    })

    // Update step status to IN_PROGRESS if it was AVAILABLE
    if (invoiceStep && invoiceStep.status === 'AVAILABLE') {
      await prisma.dossierStep.update({
        where: { id: invoiceStep.id },
        data: { status: 'IN_PROGRESS' },
      })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Invoice upload error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
