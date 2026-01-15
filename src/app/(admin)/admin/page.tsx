import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  UserPlus,
  Key,
} from 'lucide-react'

export default async function AdminDashboardPage() {
  const user = await requireRole(['ADMIN'])

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
    prisma.message.count({ where: { isRead: false, messageType: 'CLIENT' } }),
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

  // Get pending MPR validations
  const pendingMprValidations = await prisma.dossier.count({
    where: { mprStatus: 'PENDING_REVIEW' },
  })

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dark)]">
            Tableau de bord administrateur
          </h1>
          <p className="text-[var(--grey)] mt-1">
            Vue d'ensemble de l'activité KOPRO
          </p>
        </div>
        <Link href="/admin/clients/new">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un client
          </Button>
        </Link>
      </div>

      {/* Pending MPR Alert */}
      {pendingMprValidations > 0 && (
        <div className="p-4 bg-[var(--accent-2)]/10 border border-[var(--accent-2)]/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-2)]/20 rounded-xl">
              <Key className="h-5 w-5 text-[var(--accent-2)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--dark)]">
                {pendingMprValidations} identifiant{pendingMprValidations > 1 ? 's' : ''} MaPrimeRénov' à valider
              </p>
              <p className="text-sm text-[var(--grey)]">
                Des clients attendent la validation de leur identifiant
              </p>
            </div>
          </div>
          <Link href="/admin/dossiers?filter=mpr_pending">
            <Button variant="secondary" size="sm">
              Voir les dossiers
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-[var(--light-purple)] rounded-xl">
              <FileText className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--grey)]">Dossiers totaux</p>
              <p className="text-2xl font-bold text-[var(--dark)]">{totalDossiers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-[var(--success)]/10 rounded-xl">
              <Users className="h-6 w-6 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--grey)]">Clients</p>
              <p className="text-2xl font-bold text-[var(--dark)]">{totalClients}</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/admin/messages">
          <Card className="cursor-pointer">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-[var(--accent-2)]/10 rounded-xl relative">
                <MessageSquare className="h-6 w-6 text-[var(--accent-2)]" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--required)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadMessages}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-[var(--grey)]">Messages non lus</p>
                <p className="text-2xl font-bold text-[var(--dark)]">{unreadMessages}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-[var(--light-purple)] rounded-xl">
              <Clock className="h-6 w-6 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--grey)]">En attente validation</p>
              <p className="text-2xl font-bold text-[var(--dark)]">{pendingValidations}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dossiers Status Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
              Répartition des dossiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--grey)]">En cours</span>
                <span className="font-medium text-[var(--dark)]">{dossiersEnCours}</span>
              </div>
              <Progress
                value={totalDossiers > 0 ? (dossiersEnCours / totalDossiers) * 100 : 0}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--grey)]">En attente</span>
                <span className="font-medium text-[var(--dark)]">{dossiersEnAttente}</span>
              </div>
              <Progress
                value={totalDossiers > 0 ? (dossiersEnAttente / totalDossiers) * 100 : 0}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--grey)]">Terminés</span>
                <span className="font-medium text-[var(--dark)]">{dossiersTermines}</span>
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
              <Euro className="h-5 w-5 text-[var(--accent)]" />
              Aides mobilisées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--success)]/10 rounded-xl">
                <p className="text-sm text-[var(--grey)] mb-1">MaPrimeRénov'</p>
                <p className="text-xl font-bold text-[var(--success)]">
                  {formatCurrency(amountsResult._sum.mprAmount || 0)}
                </p>
              </div>
              <div className="p-4 bg-[var(--accent)]/10 rounded-xl">
                <p className="text-sm text-[var(--grey)] mb-1">Prime CEE</p>
                <p className="text-xl font-bold text-[var(--accent)]">
                  {formatCurrency(amountsResult._sum.ceeAmount || 0)}
                </p>
              </div>
              <div className="p-4 bg-[var(--accent-2)]/10 rounded-xl">
                <p className="text-sm text-[var(--grey)] mb-1">Total</p>
                <p className="text-xl font-bold text-[var(--accent-2)]">
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
            className="text-sm text-[var(--accent)] hover:text-[var(--dark)] transition-colors"
          >
            Voir tous
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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

              const isClosed = dossier.status === 'CLOTURE' || dossier.status === 'TERMINE'

              return (
                <Link
                  key={dossier.id}
                  href={`/admin/dossiers/${dossier.id}`}
                  className="block"
                >
                  <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                    isClosed
                      ? 'bg-[var(--success)]/5 hover:bg-[var(--success)]/10 border border-[var(--success)]/20'
                      : 'bg-[var(--light-purple)]/30 hover:bg-[var(--light-purple)]/50'
                  }`}>
                    <div className="flex items-center gap-4">
                      {isClosed && (
                        <div className="p-2 bg-[var(--success)]/10 rounded-full">
                          <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${isClosed ? 'text-[var(--success)]' : 'text-[var(--dark)]'}`}>
                            {dossier.reference}
                          </p>
                          <Badge
                            variant="success"
                            className={
                              isClosed
                                ? 'bg-[var(--success)] text-white'
                                : dossier.status === 'EN_ATTENTE'
                                ? 'bg-[var(--accent-2)]/20 text-[var(--accent-2)]'
                                : 'bg-[var(--light-purple)] text-[var(--accent)]'
                            }
                          >
                            {isClosed ? 'Clôturé' : dossier.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className={`text-sm ${isClosed ? 'text-[var(--success)]' : 'text-[var(--grey)]'}`}>
                          {dossier.client.firstName} {dossier.client.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {currentStep && !isClosed && (
                        <div className="text-right">
                          <p className="text-xs text-[var(--grey)]">Étape en cours</p>
                          <p className="text-sm font-medium text-[var(--dark)]">
                            {currentStep.template.name}
                          </p>
                        </div>
                      )}
                      {isClosed && (
                        <div className="text-right">
                          <p className="text-xs text-[var(--success)]">Dossier terminé</p>
                          <p className="text-sm font-medium text-[var(--success)]">
                            100% complété
                          </p>
                        </div>
                      )}
                      <div className="w-24">
                        <Progress value={progress} className={`h-2 ${isClosed ? '[&>div]:bg-[var(--success)]' : ''}`} />
                        <p className={`text-xs text-center mt-1 ${isClosed ? 'text-[var(--success)]' : 'text-[var(--grey)]'}`}>
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
