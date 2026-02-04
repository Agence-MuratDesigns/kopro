import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Types de documents projet autorisés
const ALLOWED_DOC_TYPES = ['TAXE_FONCIERE', 'AVIS_IMPOSITION', 'CARTE_IDENTITE', 'RIB']

// GET - Liste des documents projet
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()

    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
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
    const isOwner = dossier.clientId === user.id
    const isArtisanManager = user.role === 'ARTISAN' && dossier.artisanId === user.id
    if (!isOwner && !isArtisanManager) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Find PROJECT_INFO step
    const projectInfoStep = dossier.steps.find(s => s.template.code === 'PROJECT_INFO')

    // Get documents for this step
    const documents = await prisma.document.findMany({
      where: {
        dossierId,
        stepId: projectInfoStep?.id,
        type: { in: ALLOWED_DOC_TYPES },
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        fileName: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
    })

    // Add URL for viewing
    const docsWithUrls = documents.map(doc => ({
      ...doc,
      url: `/api/dossiers/${dossierId}/documents/${doc.id}/view`,
    }))

    return NextResponse.json({ documents: docsWithUrls })
  } catch (error) {
    console.error('Error fetching project documents:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}

// POST - Upload un document projet
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dossierId } = await params
    const user = await requireAuth()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const docType = formData.get('type') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    if (!docType || !ALLOWED_DOC_TYPES.includes(docType)) {
      return NextResponse.json(
        { error: 'Type de document invalide' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Seuls les fichiers PDF et images sont acceptés' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Le fichier ne doit pas dépasser 10 Mo' },
        { status: 400 }
      )
    }

    // Get dossier and verify ownership
    const dossier = await prisma.dossier.findUnique({
      where: { id: dossierId },
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
    const isOwnerPost = dossier.clientId === user.id
    const isArtisanManagerPost = user.role === 'ARTISAN' && dossier.artisanId === user.id
    if (!isOwnerPost && !isArtisanManagerPost) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    }

    // Find PROJECT_INFO step
    const projectInfoStep = dossier.steps.find(s => s.template.code === 'PROJECT_INFO')
    if (!projectInfoStep) {
      return NextResponse.json(
        { error: 'Étape des informations projet non trouvée' },
        { status: 400 }
      )
    }

    // Check if step is available
    if (projectInfoStep.status === 'LOCKED' || projectInfoStep.status === 'VALIDATED') {
      return NextResponse.json(
        { error: 'Cette étape n\'est pas modifiable' },
        { status: 400 }
      )
    }

    // Delete existing document of same type
    const existingDoc = await prisma.document.findFirst({
      where: {
        dossierId,
        stepId: projectInfoStep.id,
        type: docType,
      },
    })

    if (existingDoc) {
      await prisma.document.delete({ where: { id: existingDoc.id } })
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'project-documents', dossierId)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = path.extname(file.name)
    const timestamp = Date.now()
    const fileName = `${docType}_${timestamp}${ext}`
    const filePath = path.join(uploadDir, fileName)
    const relativePath = `/uploads/project-documents/${dossierId}/${fileName}`

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: getDocumentLabel(docType),
        type: docType,
        fileName: file.name,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.type,
        status: 'PENDING',
        uploaderId: user.id,
        dossierId,
        stepId: projectInfoStep.id,
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        fileName: true,
        uploadedAt: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        dossierId,
        action: 'DOCUMENT_UPLOAD',
        details: `Document déposé: ${getDocumentLabel(docType)}`,
      },
    })

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        url: `/api/dossiers/${dossierId}/documents/${document.id}/view`,
      },
    })
  } catch (error) {
    console.error('Error uploading project document:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    )
  }
}

function getDocumentLabel(type: string): string {
  const labels: Record<string, string> = {
    TAXE_FONCIERE: 'Taxe foncière',
    AVIS_IMPOSITION: "Avis d'imposition",
    CARTE_IDENTITE: "Carte d'identité",
    RIB: 'RIB',
  }
  return labels[type] || type
}
