import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/utils'
import { ProfileForm } from './profile-form'
import { AvatarUpload } from './avatar-upload'
import { PreferencesForm } from './preferences-form'
import { SecurityForm } from './security-form'
import {
  User,
  Calendar,
  Shield,
  Clock,
  Settings,
  ImageIcon,
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
      soundEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      preferredChannel: true,
    },
  })

  if (!fullUser) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-kopro-dark">Mon profil</h1>
        <p className="text-kopro-grey mt-2 text-lg">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Two column layout for avatar and quick info */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Avatar Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-light rounded-lg">
                <ImageIcon className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-kopro-dark">Photo de profil</h2>
            </div>
            <AvatarUpload
              userId={fullUser.id}
              currentAvatarUrl={fullUser.avatarUrl}
              firstName={fullUser.firstName}
              lastName={fullUser.lastName}
            />
          </CardContent>
        </Card>

        {/* Quick Info Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-light rounded-lg">
                <User className="h-5 w-5 text-accent" />
              </div>
              <h2 className="text-lg font-semibold text-kopro-dark">Aperçu du compte</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-kopro-grey uppercase tracking-wide mb-1">Nom complet</p>
                <p className="text-lg font-medium text-kopro-dark">
                  {fullUser.firstName} {fullUser.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-kopro-grey uppercase tracking-wide mb-1">Adresse email</p>
                <p className="text-lg font-medium text-kopro-dark">{fullUser.email}</p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-kopro-grey">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis {formatDate(fullUser.createdAt)}</span>
                </div>
                {fullUser.lastLoginAt && (
                  <div className="flex items-center gap-2 text-sm text-kopro-grey mt-2">
                    <Clock className="h-4 w-4" />
                    <span>Dernière connexion : {formatDateTime(fullUser.lastLoginAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Form - Full width */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent-light rounded-lg">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-kopro-dark">Informations personnelles</h2>
              <p className="text-sm text-kopro-grey">Mettez à jour vos informations de contact et d'adresse</p>
            </div>
          </div>
          <ProfileForm user={fullUser} />
        </CardContent>
      </Card>

      {/* Two column layout for security and preferences */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Security Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-light rounded-lg">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-kopro-dark">Sécurité</h2>
                <p className="text-sm text-kopro-grey">Email et mot de passe</p>
              </div>
            </div>
            <SecurityForm userId={fullUser.id} currentEmail={fullUser.email} />
          </CardContent>
        </Card>

        {/* Preferences Card */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-light rounded-lg">
                <Settings className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-kopro-dark">Préférences</h2>
                <p className="text-sm text-kopro-grey">Personnalisez votre expérience</p>
              </div>
            </div>
            <PreferencesForm
              userId={fullUser.id}
              preferences={{
                soundEnabled: fullUser.soundEnabled,
                emailNotifications: fullUser.emailNotifications,
                pushNotifications: fullUser.pushNotifications,
                preferredChannel: fullUser.preferredChannel,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
