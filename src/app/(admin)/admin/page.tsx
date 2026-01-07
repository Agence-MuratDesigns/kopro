import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatCurrency, stepStatusLabels } from '@/lib/utils'
import Link from 'next/link'
import {
  FileText,
  Users,
  MessageSquare,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Euro,
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const user = await requireRole(['ADMIN', 'ADVISOR'])

  // Stats
  const [
    totalDossiers,
    dossiersEnCours,
    dossiersTermines,
    dossiersEnAttente,
    totalClients,
    unreadMessages,
    pendingValidations,
    recentDossiers,
  ] = await Promise.all([
    prisma.dossier.count(),
    prisma.dossier.count({ where: { status: 'EN_COURS' } }),
    prisma.dossier.count({ where: { status: 'TERMINE' } }),
    prisma.dossier.count({ where: { status: 'EN_ATTENTE' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.message.count({ where: { isRead: false, isFromClient: true } }),
    prisma.dossierStep.count({ where: { status: 'PENDING_VALIDATION' } }),
    prisma.dossier.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        steps: {
          include: { template: true },
          orderBy: { template: { order: 'asc' } },
        },
      },
    }),
  ])

  // Calculate total amounts
  const amountsResult = await prisma.dossier.aggregate({
    _sum: {
      mprAmount: true,
      ceeAmount: true,
    },
  })

  const totalAides = (amountsResult._sum.mprAmount || 0) + (amountsResult._sum.ceeAmount || 0)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tableau de bord administrateur
        </h1>
        <p className="text-gray-600 mt-1">
          Vue d'ensemble de l'activité KOPRO
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dossiers totaux</p>
              <p className="text-2xl font-bold text-gray-900">{totalDossiers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clients</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients}</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/admin/messages">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-yellow-100 rounded-lg relative">
                <MessageSquare className="h-6 w-6 text-yellow-600" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Messages non lus</p>
                <p className="text-2xl font-bold text-gray-900">{unreadMessages}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En attente validation</p>
              <p className="text-2xl font-bold text-gray-900">{pendingValidations}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dossiers Status Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Répartition des dossiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">En cours</span>
                <span className="font-medium">{dossiersEnCours}</span>
              </div>
              <Progress
                value={totalDossiers > 0 ? (dossiersEnCours / totalDossiers) * 100 : 0}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">En attente</span>
                <span className="font-medium">{dossiersEnAttente}</span>
              </div>
              <Progress
                value={totalDossiers > 0 ? (dossiersEnAttente / totalDossiers) * 100 : 0}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Terminés</span>
                <span className="font-medium">{dossiersTermines}</span>
              </div>
              <Progress
                value={totalDossiers > 0 ? (dossiersTermines / totalDossiers) * 100 : 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Aides mobilisées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">MaPrimeRénov'</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(amountsResult._sum.mprAmount || 0)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Prime CEE</p>
                <p className="text-xl font-bold text-blue-700">
                  {formatCurrency(amountsResult._sum.ceeAmount || 0)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-xl font-bold text-purple-700">
                  {formatCurrency(totalAides)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Dossiers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dossiers récents</CardTitle>
          <Link
            href="/admin/dossiers"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Voir tous
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDossiers.map(dossier => {
              const currentStep = dossier.steps.find(
                s =>
                  s.status === 'IN_PROGRESS' ||
                  s.status === 'PENDING_VALIDATION' ||
                  s.status === 'AVAILABLE'
              )
              const progress = Math.round(
                (dossier.steps.filter(s => s.status === 'VALIDATED').length /
                  dossier.steps.length) *
                  100
              )

              return (
                <Link
                  key={dossier.id}
                  href={`/admin/dossiers/${dossier.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {dossier.reference}
                          </p>
                          <Badge
                            variant={
                              dossier.status === 'TERMINE'
                                ? 'success'
                                : dossier.status === 'EN_ATTENTE'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {dossier.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {dossier.client.firstName} {dossier.client.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {currentStep && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Étape en cours</p>
                          <p className="text-sm font-medium">
                            {currentStep.template.name}
                          </p>
                        </div>
                      )}
                      <div className="w-24">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-gray-500 text-center mt-1">
                          {progress}%
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
