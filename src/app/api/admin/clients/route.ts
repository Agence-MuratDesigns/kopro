import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET - List all clients
export async function GET() {
  try {
    const user = await requireRole(['ADMIN'])

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
    const admin = await requireRole(['ADMIN'])

    const body = await request.json()
    const { firstName, lastName, email, phone, password } = body

    // Validation
    if (!firstName || !lastName || !email || !password) {
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
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
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
          message: `Bonjour ${firstName}, votre compte a été créé. Connectez-vous pour renseigner votre identifiant MaPrimeRénov'.`,
          link: '/dashboard',
        },
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: admin.id,
          dossierId: dossier.id,
          action: 'CLIENT_CREATED',
          details: `Compte client créé pour ${firstName} ${lastName} (${email})`,
        },
      })

      return newClient
    })

    // TODO: Send welcome email (implement email service)
    console.log(`[EMAIL] Welcome email should be sent to ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Client créé avec succès',
      client: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
      },
    })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du client' },
      { status: 500 }
    )
  }
}
