import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'

// GET - List all clients
export async function GET() {
  try {
    const user = await requireRole(['ADMIN', 'ADVISOR'])

    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        firstLoginAt: true,
        mustChangePassword: true,
        dossiers: {
          select: {
            id: true,
            reference: true,
            status: true,
            currentStep: true,
            mprId: true,
            mprStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des clients' },
      { status: 500 }
    )
  }
}

// POST - Create new client with dossier
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(['ADMIN', 'ADVISOR'])

    const body = await request.json()
    const { firstName, lastName, email, phone, password } = body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      )
    }

    // Normalize and trim values
    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const normalizedEmail = email.trim().toLowerCase()

    // Validate name format (2-50 chars, letters, accents, apostrophes, spaces, hyphens)
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/
    if (!nameRegex.test(trimmedFirstName)) {
      return NextResponse.json(
        { error: 'Le prénom doit contenir entre 2 et 50 caractères (lettres, accents, tirets, apostrophes)' },
        { status: 400 }
      )
    }

    if (!nameRegex.test(trimmedLastName)) {
      return NextResponse.json(
        { error: 'Le nom doit contenir entre 2 et 50 caractères (lettres, accents, tirets, apostrophes)' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Adresse email invalide' },
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

    // Check if email already exists (case-insensitive)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cette adresse e-mail.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate reference
    const year = new Date().getFullYear()
    const count = await prisma.dossier.count({
      where: {
        reference: {
          startsWith: `KPR-${year}`,
        },
      },
    })
    const reference = `KPR-${year}-${String(count + 1).padStart(4, '0')}`

    // Create client and dossier in transaction
    const client = await prisma.$transaction(async (tx) => {
      // Create client
      const newClient = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          phone: phone?.trim() || null,
          role: 'CLIENT',
          createdById: admin.id,
          mustChangePassword: true,
        },
      })

      // Create dossier
      const dossier = await tx.dossier.create({
        data: {
          reference,
          clientId: newClient.id,
          status: 'EN_COURS',
          currentStep: 2,
          mprStatus: 'DRAFT',
        },
      })

      // Get step templates
      const templates = await tx.stepTemplate.findMany({
        orderBy: { order: 'asc' },
      })

      // Create dossier steps
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i]
        let status = 'LOCKED'

        if (i === 0) {
          // Step 1 (Paiement validé) - automatically validated by admin
          status = 'VALIDATED'
        } else if (i === 1) {
          // Step 2 (Identifiant MPR) - available for client
          status = 'AVAILABLE'
        }

        await tx.dossierStep.create({
          data: {
            dossierId: dossier.id,
            templateId: template.id,
            status,
            validatedAt: status === 'VALIDATED' ? new Date() : null,
            validatedBy: status === 'VALIDATED' ? admin.id : null,
          },
        })
      }

      // Create welcome notification
      await tx.notification.create({
        data: {
          userId: newClient.id,
          dossierId: dossier.id,
          type: 'ACCOUNT_CREATED',
          title: 'Bienvenue sur KOPRO !',
          message: `Bonjour ${trimmedFirstName}, votre compte a été créé. Connectez-vous pour renseigner votre identifiant MaPrimeRénov'.`,
          link: '/dashboard',
        },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: admin.id,
          dossierId: dossier.id,
          action: 'CLIENT_CREATED',
          details: `Compte client créé pour ${trimmedFirstName} ${trimmedLastName} (${normalizedEmail})`,
        },
      })

      return newClient
    })

    // Send welcome email with credentials
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const emailResult = await sendWelcomeEmail({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: normalizedEmail,
      password: password, // Send the original password (before hashing)
      loginUrl: `${appUrl}/login`,
    })

    if (!emailResult.success) {
      // Log error but don't fail the request - account was created successfully
      console.error(`[EMAIL] Failed to send welcome email to ${normalizedEmail}:`, emailResult.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Client créé avec succès',
      client: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
      },
      emailSent: emailResult.success,
    })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du client' },
      { status: 500 }
    )
  }
}
