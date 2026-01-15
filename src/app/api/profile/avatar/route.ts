import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format accepté : JPG ou PNG' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'La taille maximale est de 2 Mo' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    await mkdir(uploadsDir, { recursive: true })

    // Delete old avatar if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    })

    if (currentUser?.avatarUrl) {
      const oldFilePath = path.join(process.cwd(), 'public', currentUser.avatarUrl)
      try {
        await unlink(oldFilePath)
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${user.id}-${Date.now()}.${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update user avatar URL
    const avatarUrl = `/uploads/avatars/${filename}`
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'AVATAR_UPDATE',
        details: 'Photo de profil mise à jour',
      },
    })

    return NextResponse.json({
      success: true,
      avatarUrl,
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement de l\'avatar' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Get current avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    })

    if (!currentUser?.avatarUrl) {
      return NextResponse.json(
        { error: 'Aucun avatar à supprimer' },
        { status: 400 }
      )
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'public', currentUser.avatarUrl)
    try {
      await unlink(filePath)
    } catch {
      // Ignore if file doesn't exist
    }

    // Update user to remove avatar URL
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'AVATAR_DELETE',
        details: 'Photo de profil supprimée',
      },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'avatar' },
      { status: 500 }
    )
  }
}
