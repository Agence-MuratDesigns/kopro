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
          where: { template: { code: 'QUOTE_DEPOSIT' } },
        },
      },
    })

    if (!dossier || dossier.clientId !== session.userId) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    // Check if quotes step is accessible
    const quoteStep = dossier.steps[0]
    if (!quoteStep || quoteStep.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas encore accessible' },
        { status: 403 }
      )
    }

    // Check if already approved
    if (dossier.quotesStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'Les devis ont déjà été validés' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const workType = formData.get('workType') as string
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    if (!workType) {
      return NextResponse.json({ error: 'Type de travaux requis' }, { status: 400 })
    }

    // Validate work type against selected works
    const selectedWorks: string[] = dossier.selectedWorks ? JSON.parse(dossier.selectedWorks) : []
    if (!selectedWorks.includes(workType)) {
      return NextResponse.json(
        { error: 'Type de travaux non sélectionné' },
        { status: 400 }
      )
    }

    // Validate file type - PDF only for quotes
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Seuls les fichiers PDF sont acceptés pour les devis' },
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

    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', id, 'devis')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const fileName = `DEVIS_${workType}_${timestamp}.pdf`
    const filePath = join(uploadDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: file.name,
        type: type || 'DEVIS',
        workType,
        fileName,
        filePath: `/uploads/${id}/devis/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        uploaderId: session.userId,
        dossierId: id,
        stepId: quoteStep.id,
      },
    })

    // Update dossier status if in REJECTED state, go back to DRAFT
    if (dossier.quotesStatus === 'REJECTED') {
      await prisma.dossier.update({
        where: { id },
        data: {
          quotesStatus: 'DRAFT',
        },
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        dossierId: id,
        userId: session.userId,
        action: 'DOCUMENT_UPLOAD',
        details: `Devis uploadé pour ${workType}: ${file.name}`,
      },
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Quote upload error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
