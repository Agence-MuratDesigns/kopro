import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/utils'
import { ProfileForm } from './profile-form'
import { AvatarUpload } from './avatar-upload'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Clock,
} from 'lucide-react'

export default async function ProfilePage() {
  const user = await requireAuth()

  // Get full user details
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      address: true,
      addressComplement: true,
      postalCode: true,
      city: true,
      avatarUrl: true,
      createdAt: true,
      lastLoginAt: true,
      firstLoginAt: true,
    },
  })

  if (!fullUser) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-600 mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Avatar & Quick Info */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <AvatarUpload
              userId={fullUser.id}
              currentAvatarUrl={fullUser.avatarUrl}
              firstName={fullUser.firstName}
              lastName={fullUser.lastName}
            />
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900">
                {fullUser.firstName} {fullUser.lastName}
              </h2>
              <p className="text-gray-600">{fullUser.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Membre depuis {formatDate(fullUser.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
          <CardDescription>
            Mettez à jour vos informations de contact et d'adresse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={fullUser} />
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Mail className="h-4 w-4" />
                Adresse email
              </div>
              <p className="font-medium text-gray-900">{fullUser.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                L'email ne peut pas être modifié pour des raisons de sécurité
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Clock className="h-4 w-4" />
                Dernière connexion
              </div>
              <p className="font-medium text-gray-900">
                {fullUser.lastLoginAt
                  ? formatDateTime(fullUser.lastLoginAt)
                  : 'Première connexion'}
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Besoin de changer votre mot de passe ?</strong>
              <br />
              Contactez votre conseiller KOPRO pour réinitialiser votre mot de passe en toute sécurité.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
