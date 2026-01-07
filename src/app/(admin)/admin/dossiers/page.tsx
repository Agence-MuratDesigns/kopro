import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Search, Filter, ChevronRight } from 'lucide-react'

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>
}

export default async function AdminDossiersPage({ searchParams }: Props) {
  const params = await searchParams
  await requireRole(['ADMIN', 'ADVISOR'])

  const where: any = {}

  if (params.status) {
    where.status = params.status
  }

  if (params.search) {
    where.OR = [
      { reference: { contains: params.search } },
      { client: { firstName: { contains: params.search } } },
      { client: { lastName: { contains: params.search } } },
      { client: { email: { contains: params.search } } },
    ]
  }

  const dossiers = await prisma.dossier.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      advisor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      steps: {
        include: { template: true },
        orderBy: { template: { order: 'asc' } },
      },
      _count: {
        select: {
          documents: true,
          messages: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const statusCounts = await prisma.dossier.groupBy({
    by: ['status'],
    _count: true,
  })

  const counts = {
    all: dossiers.length,
    EN_COURS: statusCounts.find(s => s.status === 'EN_COURS')?._count || 0,
    EN_ATTENTE: statusCounts.find(s => s.status === 'EN_ATTENTE')?._count || 0,
    TERMINE: statusCounts.find(s => s.status === 'TERMINE')?._count || 0,
    REFUSE: statusCounts.find(s => s.status === 'REFUSE')?._count || 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des dossiers</h1>
          <p className="text-gray-600 mt-1">
            {dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/dossiers">
              <Button
                variant={!params.status ? 'primary' : 'outline'}
                size="sm"
              >
                Tous ({counts.all})
              </Button>
            </Link>
            <Link href="/admin/dossiers?status=EN_COURS">
              <Button
                variant={params.status === 'EN_COURS' ? 'primary' : 'outline'}
                size="sm"
              >
                En cours ({counts.EN_COURS})
              </Button>
            </Link>
            <Link href="/admin/dossiers?status=EN_ATTENTE">
              <Button
                variant={params.status === 'EN_ATTENTE' ? 'primary' : 'outline'}
                size="sm"
              >
                En attente ({counts.EN_ATTENTE})
              </Button>
            </Link>
            <Link href="/admin/dossiers?status=TERMINE">
              <Button
                variant={params.status === 'TERMINE' ? 'primary' : 'outline'}
                size="sm"
              >
                Terminés ({counts.TERMINE})
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Dossiers List */}
      <div className="space-y-4">
        {dossiers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Aucun dossier trouvé</p>
            </CardContent>
          </Card>
        ) : (
          dossiers.map(dossier => {
            const currentStep = dossier.steps.find(
              s =>
                s.status === 'PENDING_VALIDATION' ||
                s.status === 'IN_PROGRESS' ||
                s.status === 'AVAILABLE'
            )
            const pendingValidation = dossier.steps.filter(
              s => s.status === 'PENDING_VALIDATION'
            ).length
            const progress = Math.round(
              (dossier.steps.filter(s => s.status === 'VALIDATED').length /
                dossier.steps.length) *
                100
            )

            return (
              <Link key={dossier.id} href={`/admin/dossiers/${dossier.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">
                            {dossier.reference}
                          </span>
                          <Badge
                            variant={
                              dossier.status === 'TERMINE'
                                ? 'success'
                                : dossier.status === 'EN_ATTENTE'
                                ? 'warning'
                                : dossier.status === 'REFUSE'
                                ? 'error'
                                : 'info'
                            }
                          >
                            {dossier.status.replace('_', ' ')}
                          </Badge>
                          {pendingValidation > 0 && (
                            <Badge variant="warning">
                              {pendingValidation} à valider
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>
                            Client : {dossier.client.firstName} {dossier.client.lastName}
                          </span>
                          {dossier.projectCity && (
                            <span>Ville : {dossier.projectCity}</span>
                          )}
                          {dossier.projectType && (
                            <span>Type : {dossier.projectType}</span>
                          )}
                        </div>
                      </div>

                      {/* Current Step */}
                      <div className="text-sm md:text-right">
                        {currentStep && (
                          <>
                            <p className="text-gray-500">Étape en cours</p>
                            <p className="font-medium text-gray-900">
                              {currentStep.template.name}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Progress */}
                      <div className="w-32">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-gray-500 text-center mt-1">
                          {progress}% complet
                        </p>
                      </div>

                      {/* Aides */}
                      {(dossier.mprAmount || dossier.ceeAmount) && (
                        <div className="text-sm md:text-right">
                          <p className="text-gray-500">Aides estimées</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency((dossier.mprAmount || 0) + (dossier.ceeAmount || 0))}
                          </p>
                        </div>
                      )}

                      <ChevronRight className="h-5 w-5 text-gray-400 hidden md:block" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
