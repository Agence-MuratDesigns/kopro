import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatCurrency, stepStatusLabels } from '@/lib/utils'
import { RecentDossiers } from '@/components/admin/recent-dossiers'
import { PaymentRevenueCard } from '@/components/admin/payment-revenue-card'
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
  ClipboardCheck,
  Building2,
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
    totalArtisans,
    unreadMessages,
    pendingValidations,
    recentDossiers,
    paymentStats,
    pendingPaymentsCount,
    recentPayments,
  ] = await Promise.all([
    prisma.dossier.count(),
    prisma.dossier.count({ where: { status: 'EN_COURS' } }),
    prisma.dossier.count({ where: { status: 'TERMINE' } }),
    prisma.dossier.count({ where: { status: 'EN_ATTENTE' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.user.count({ where: { role: 'ARTISAN' } }),
    prisma.message.count({ where: { isRead: false, messageType: 'CLIENT' } }),
    prisma.dossierStep.count({ where: { status: 'PENDING_VALIDATION' } }),
    prisma.dossier.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        artisan: {
          select: { firstName: true, lastName: true, companyName: true },
        },
        steps: {
          include: { template: true },
          orderBy: { template: { order: 'asc' } },
        },
      },
    }),
    prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.count({
      where: { status: { in: ['PENDING', 'PROCESSING'] } },
    }),
    prisma.payment.findMany({
      where: { status: 'SUCCEEDED' },
      select: {
        amount: true,
        paidAt: true,
        dossier: { select: { reference: true } },
      },
      orderBy: { paidAt: 'desc' },
      take: 10,
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

  // Get all dossiers with pending validations (steps with PENDING_VALIDATION status)
  const dossiersWithPendingSteps = await prisma.dossier.findMany({
    where: {
      steps: {
        some: {
          status: 'PENDING_VALIDATION'
        }
      }
    },
    select: {
      id: true,
      reference: true,
      endClientFirstName: true,
      endClientLastName: true,
      client: {
        select: { firstName: true, lastName: true }
      },
      steps: {
        where: { status: 'PENDING_VALIDATION' },
        include: { template: true }
      }
    }
  })

  // Count total pending validations by step type
  const pendingByStepType: Record<string, { count: number; dossiers: typeof dossiersWithPendingSteps }> = {}

  dossiersWithPendingSteps.forEach(dossier => {
    dossier.steps.forEach(step => {
      const stepName = step.template.name
      if (!pendingByStepType[stepName]) {
        pendingByStepType[stepName] = { count: 0, dossiers: [] }
      }
      pendingByStepType[stepName].count++
      if (!pendingByStepType[stepName].dossiers.find(d => d.id === dossier.id)) {
        pendingByStepType[stepName].dossiers.push(dossier)
      }
    })
  })

  const totalPendingDossiers = dossiersWithPendingSteps.length
  const singlePendingDossier = totalPendingDossiers === 1 ? dossiersWithPendingSteps[0] : null

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
        <div className="flex gap-3">
          <Link href="/admin/artisans/new">
            <Button variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              Ajouter un artisan
            </Button>
          </Link>
          <Link href="/admin/clients/new">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un client
            </Button>
          </Link>
        </div>
      </div>

      {/* Pending Validations Alert */}
      {totalPendingDossiers > 0 && (
        <div
          className="rounded-2xl bg-accent text-white"
          style={{
            boxShadow: 'rgba(250, 251, 253, 0.68) 0px 0px 1em -0.3em inset, rgba(78, 27, 81, 0.07) 0px 1.7px 6.9px 0px, rgba(78, 27, 81, 0.082) 0px 3.8px 14.1px 0px, rgba(78, 27, 81, 0.086) 0px 7.1px 22.1px 0px, rgba(78, 27, 81, 0.094) 0px 15px 33.1px 0px'
          }}
        >
          <div className="py-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <ClipboardCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-white/80 mb-1">Action requise</p>
                  <h3 className="text-xl font-bold text-white">
                    {singlePendingDossier
                      ? `1 dossier à valider`
                      : `${totalPendingDossiers} dossiers à valider`
                    }
                  </h3>
                  {singlePendingDossier ? (
                    <p className="text-white/90 mt-1">
                      {singlePendingDossier.client
                        ? `${singlePendingDossier.client.firstName} ${singlePendingDossier.client.lastName}`
                        : singlePendingDossier.endClientFirstName
                          ? `${singlePendingDossier.endClientFirstName} ${singlePendingDossier.endClientLastName || ''}`
                          : 'Client'
                      } - {singlePendingDossier.reference}
                      <span className="block text-white/70 text-sm mt-0.5">
                        Étape : {singlePendingDossier.steps[0]?.template.name}
                      </span>
                    </p>
                  ) : (
                    <div className="text-white/90 mt-2 space-y-1">
                      {Object.entries(pendingByStepType).map(([stepName, data]) => (
                        <p key={stepName} className="text-sm flex items-center gap-2">
                          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                            {data.count}
                          </span>
                          {stepName}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Link href={singlePendingDossier
                ? `/admin/dossiers/${singlePendingDossier.id}`
                : '/admin/dossiers'
              }>
                <Button className="btn-primary text-lg py-3 px-8 bg-white text-accent hover:bg-gray-100 hover:text-kopro-dark">
                  {singlePendingDossier ? 'Valider maintenant' : 'Voir les dossiers'}
                </Button>
              </Link>
            </div>
          </div>
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

        <Link href="/admin/artisans">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-[var(--accent)]/10 rounded-xl">
                <Building2 className="h-6 w-6 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--grey)]">Artisans</p>
                <p className="text-2xl font-bold text-[var(--dark)]">{totalArtisans}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

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

      {/* Payment Revenue Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <PaymentRevenueCard
          totalRevenue={paymentStats._sum.amount || 0}
          totalPayments={paymentStats._count || 0}
          pendingPayments={pendingPaymentsCount}
          recentPayments={recentPayments}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--accent)]" />
              Taux de conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--grey)]">Paiements réussis</span>
                  <span className="font-medium text-[var(--dark)]">
                    {totalDossiers > 0
                      ? Math.round(((paymentStats._count || 0) / totalDossiers) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress
                  value={totalDossiers > 0
                    ? ((paymentStats._count || 0) / totalDossiers) * 100
                    : 0}
                  className="h-2"
                />
              </div>
              <div className="pt-2 border-t text-center">
                <p className="text-2xl font-bold text-[var(--accent)]">
                  {paymentStats._count || 0} / {totalDossiers}
                </p>
                <p className="text-sm text-[var(--grey)]">dossiers payés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Dossiers */}
      <RecentDossiers dossiers={recentDossiers} />
    </div>
  )
}
