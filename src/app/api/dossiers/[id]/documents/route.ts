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
    })

    if (!dossier || dossier.clientId !== session.userId) {
      return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const stepId = formData.get('stepId') as string

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé' },
        { status: 400 }
      )
    }

    // Max file size: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10 Mo)' },
        { status: 400 }
      )
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', id)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const fileName = `${type}_${timestamp}.${ext}`
    const filePath = join(uploadDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create document record
    const document = await prisma.document.create({
      data: {
        name: file.name,
        type: type as any,
        fileName,
        filePath: `/uploads/${id}/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        uploaderId: session.userId,
        dossierId: id,
        stepId: stepId || null,
      },
    })

    // Create notification for admin
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'ADVISOR'] } },
    })

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          dossierId: id,
          type: 'DOCUMENT_REQUIRED',
          title: 'Nouveau document',
          message: `Un nouveau document a été téléversé pour le dossier ${dossier.reference}`,
          link: `/admin/dossiers/${id}`,
        },
      })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
