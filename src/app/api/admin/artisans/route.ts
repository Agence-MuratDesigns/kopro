import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET - List all artisans
export async function GET() {
  try {
    await requireRole(['ADMIN'])

    const artisans = await prisma.user.findMany({
      where: { role: 'ARTISAN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        siret: true,
        companyAddress: true,
        companyPostalCode: true,
        companyCity: true,
        rgeQualifications: true,
        isActive: true,
        createdAt: true,
        firstLoginAt: true,
        _count: {
          select: {
            managedDossiers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform the data to include dossier count directly
    const transformedArtisans = artisans.map((artisan) => ({
      ...artisan,
      dossiersCount: artisan._count.managedDossiers,
      rgeQualifications: artisan.rgeQualifications
        ? JSON.parse(artisan.rgeQualifications)
        : [],
    }))

    return NextResponse.json({ artisans: transformedArtisans })
  } catch (error) {
    console.error('Error fetching artisans:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des artisans' },
      { status: 500 }
    )
  }
}

// POST - Create new artisan
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN'])

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      companyName,
      siret,
      companyAddress,
      companyPostalCode,
      companyCity,
      rgeQualifications,
    } = body

    // Validation - required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !companyName ||
      !siret ||
      !phone ||
      !companyAddress ||
      !companyPostalCode ||
      !companyCity
    ) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
        { status: 400 }
      )
    }

    // Validate SIRET format (14 digits)
    const siretRegex = /^\d{14}$/
    if (!siretRegex.test(siret)) {
      return NextResponse.json(
        { error: 'Le numéro SIRET doit contenir exactement 14 chiffres' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    if (!Object.values(passwordValidation).every(Boolean)) {
      return NextResponse.json(
        { error: 'Le mot de passe ne respecte pas les critères de sécurité' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà utilisée' },
        { status: 400 }
      )
    }

    // Check if SIRET already exists
    const existingSiret = await prisma.user.findFirst({
      where: { siret },
    })

    if (existingSiret) {
      return NextResponse.json(
        { error: 'Ce numéro SIRET est déjà enregistré' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create artisan
    const artisan = await prisma.$transaction(async (tx) => {
      const newArtisan = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: 'ARTISAN',
          createdById: admin.id,
          mustChangePassword: true,
          isActive: true,
          companyName,
          siret,
          companyAddress,
          companyPostalCode,
          companyCity,
          rgeQualifications: rgeQualifications
            ? JSON.stringify(rgeQualifications)
            : null,
        },
      })

      // Create welcome notification
      await tx.notification.create({
        data: {
          userId: newArtisan.id,
          type: 'ACCOUNT_CREATED',
          title: 'Bienvenue sur KOPRO !',
          message: `Bonjour ${firstName}, votre compte artisan a été créé. Connectez-vous pour gérer les dossiers de vos clients.`,
          link: '/dashboard',
        },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: admin.id,
          action: 'ARTISAN_CREATED',
          details: `Compte artisan créé pour ${companyName} (${email})`,
        },
      })

      return newArtisan
    })

    // TODO: Send welcome email
    console.log(`[EMAIL] Welcome email should be sent to artisan ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Artisan créé avec succès',
      artisan: {
        id: artisan.id,
        email: artisan.email,
        firstName: artisan.firstName,
        lastName: artisan.lastName,
        companyName: artisan.companyName,
      },
    })
  } catch (error) {
    console.error('Error creating artisan:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'artisan' },
      { status: 500 }
    )
  }
}
