import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ContactForm } from './contact-form'
import { SupportTabs } from './support-tabs'
import {
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react'

export default async function SupportPage() {
  const user = await requireAuth()

  // Get user's active dossier for contact form
  const dossier = await prisma.dossier.findFirst({
    where: { clientId: user.id, isActive: true },
    select: { id: true, reference: true },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-kopro-dark">Aide & Support</h1>
        <p className="text-kopro-grey mt-2 text-lg">
          Guide du parcours, glossaire des termes et FAQ pour vous accompagner
        </p>
      </div>

      {/* Quick Contact Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Phone className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-primary-900">Par téléphone</p>
                <p className="text-sm text-primary-700">01 23 45 67 89</p>
                <p className="text-xs text-primary-600">Lun-Ven 9h-18h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Mail className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-primary-900">Par email</p>
                <p className="text-sm text-primary-700">support@kopro.fr</p>
                <p className="text-xs text-primary-600">Réponse sous 24h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Section */}
      <SupportTabs />

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Nous contacter
          </CardTitle>
          <CardDescription>
            Une question spécifique ? Envoyez-nous un message
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm dossierId={dossier?.id} />
        </CardContent>
      </Card>
    </div>
  )
}
