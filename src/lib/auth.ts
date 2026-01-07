import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
)

export interface JWTPayload {
  userId: string
  email: string
  role: 'CLIENT' | 'ADVISOR' | 'ADMIN'
  exp?: number
}

export async function createToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch {
    return null
  }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  const token = await createToken({
    userId: user.id,
    email: user.email,
    role: user.role as JWTPayload['role'],
  })

  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      details: 'Connexion réussie',
    },
  })

  return { user: { id: user.id, email: user.email, role: user.role } }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  return verifyToken(token)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
    },
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireRole(roles: ('CLIENT' | 'ADVISOR' | 'ADMIN')[]) {
  const user = await requireAuth()
  if (!roles.includes(user.role as any)) {
    redirect('/unauthorized')
  }
  return user
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function register(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    return { error: 'Un compte existe déjà avec cet email' }
  }

  const hashedPassword = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      role: 'CLIENT',
    },
  })

  // Auto-login after registration
  const token = await createToken({
    userId: user.id,
    email: user.email,
    role: 'CLIENT',
  })

  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return { user: { id: user.id, email: user.email, role: user.role } }
}
