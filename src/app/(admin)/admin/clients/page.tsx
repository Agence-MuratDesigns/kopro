import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import {
  Users,
  UserPlus,
  FileText,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react'

export default async function ClientsPage() {
  await requireRole(['ADMIN'])

  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    include: {
      dossiers: {
        include: {
          steps: {
            include: { template: true },
            orderBy: { template: { order: 'asc' } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const getMprStatusBadge = (status: string | null) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <Badge variant="warning">En attente de validation</Badge>
      case 'APPROVED':
        return <Badge variant="success">Validé</Badge>
      case 'REJECTED':
        return <Badge variant="error">Rejeté</Badge>
      default:
        return <Badge variant="secondary">Non renseigné</Badge>
    }
  }

  const getProgress = (steps: { status: string }[]) => {
    if (!steps || steps.length === 0) return 0
    const validatedCount = steps.filter(s => s.status === 'VALIDATED').length
    return Math.round((validatedCount / steps.length) * 100)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des clients</h1>
          <p className="text-gray-600 mt-1">
            {clients.length} client{clients.length > 1 ? 's' : ''} enregistré{clients.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/admin/clients/new">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un client
          </Button>
        </Link>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun client
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par ajouter votre premier client.
            </p>
            <Link href="/admin/clients/new">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter un client
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clients.map(client => {
            const dossier = client.dossiers[0]
            const progress = dossier ? getProgress(dossier.steps) : 0
            const currentStep = dossier?.steps.find(
              s => s.status === 'IN_PROGRESS' || s.status === 'AVAILABLE' || s.status === 'PENDING_VALIDATION'
            )

            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Client Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-700 font-semibold">
                            {client.firstName[0]}{client.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {client.firstName} {client.lastName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </span>
                            {client.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          Créé le {formatDate(client.createdAt)}
                        </span>
                        {client.firstLoginAt ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Première connexion effectuée
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-3 w-3" />
                            Jamais connecté
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dossier Info */}
                    {dossier ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                        <div className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{dossier.reference}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">MPR:</span>
                            {getMprStatusBadge(dossier.mprStatus)}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary-600">{progress}%</div>
                          <div className="text-xs text-gray-500">Progression</div>
                        </div>

                        {currentStep && (
                          <div className="text-sm text-right">
                            <p className="text-gray-500">Étape en cours</p>
                            <p className="font-medium text-gray-900">{currentStep.template.name}</p>
                          </div>
                        )}

                        <Link href={`/admin/dossiers/${dossier.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Aucun dossier</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
