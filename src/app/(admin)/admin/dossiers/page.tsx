import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatDossierStatus } from '@/lib/utils'
import { StepFilterSelect } from '@/components/admin/step-filter-select'
import { SortSelect } from '@/components/admin/sort-select'
import { ArtisanLink } from '@/components/admin/artisan-link'
import Link from 'next/link'
import { CheckCircle, CreditCard } from 'lucide-react'
import { DossierSearch } from '@/components/admin/dossier-search'

interface Props {
  searchParams: Promise<{
    status?: string
    search?: string
    sort?: 'date' | 'status' | 'client'
    order?: 'asc' | 'desc'
    step?: string // Code de l'étape pour filtrer
  }>
}

export default async function AdminDossiersPage({ searchParams }: Props) {
  const params = await searchParams
  await requireRole(['ADMIN'])

  const where: any = {}

  if (params.status) {
    // Pour le filtre "Terminés", inclure TERMINE et CLOTURE
    if (params.status === 'TERMINE') {
      where.status = { in: ['TERMINE', 'CLOTURE'] }
    } else if (params.status === 'A_VALIDER') {
      // Filtre spécial pour les dossiers avec étapes en attente de validation
      where.steps = {
        some: {
          status: 'PENDING_VALIDATION'
        }
      }
    } else {
      where.status = params.status
    }
  }

  if (params.search) {
    where.OR = [
      { reference: { contains: params.search } },
      { client: { firstName: { contains: params.search } } },
      { client: { lastName: { contains: params.search } } },
      { client: { email: { contains: params.search } } },
      // Recherche dans les infos client final (dossiers artisan)
      { endClientFirstName: { contains: params.search } },
      { endClientLastName: { contains: params.search } },
      { endClientEmail: { contains: params.search } },
      // Recherche par artisan
      { artisan: { companyName: { contains: params.search } } },
    ]
  }

  // Définir l'ordre de tri
  const sortField = params.sort || 'date'
  const sortOrder = params.order || 'desc'

  // Ordre Prisma basé sur le champ de tri
  let orderBy: any = { updatedAt: sortOrder }
  if (sortField === 'client') {
    orderBy = { client: { lastName: sortOrder } }
  } else if (sortField === 'status') {
    orderBy = { status: sortOrder }
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
      artisan: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          companyName: true,
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
    orderBy,
  })

  const sortedDossiers = dossiers

  const statusCounts = await prisma.dossier.groupBy({
    by: ['status'],
    _count: true,
  })

  // Calculer le total de tous les dossiers
  const totalCount = statusCounts.reduce((sum, s) => sum + s._count, 0)

  // Compter les dossiers avec étapes à valider
  const pendingValidationCount = await prisma.dossier.count({
    where: {
      steps: {
        some: {
          status: 'PENDING_VALIDATION'
        }
      }
    }
  })

  const counts = {
    all: totalCount,
    EN_COURS: statusCounts.find(s => s.status === 'EN_COURS')?._count || 0,
    A_VALIDER: pendingValidationCount,
    // Compter TERMINE et CLOTURE ensemble pour les dossiers terminés
    TERMINE: (statusCounts.find(s => s.status === 'TERMINE')?._count || 0) +
             (statusCounts.find(s => s.status === 'CLOTURE')?._count || 0),
  }

  // Récupérer les templates d'étapes pour le filtre
  const stepTemplates = await prisma.stepTemplate.findMany({
    orderBy: { order: 'asc' },
    select: { code: true, name: true, order: true }
  })

  // Filtrer par étape si un filtre est sélectionné
  let filteredDossiers = sortedDossiers
  if (params.step) {
    filteredDossiers = sortedDossiers.filter(dossier => {
      const currentStep = dossier.steps.find(
        s => s.status === 'PENDING_VALIDATION' || s.status === 'IN_PROGRESS' || s.status === 'AVAILABLE'
      )
      return currentStep?.template.code === params.step
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des dossiers</h1>
          <p className="text-gray-600 mt-1">
            {params.step ? (
              <>{filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''} à cette étape</>
            ) : (
              <>{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</>
            )}
          </p>
        </div>
      </div>

      {/* Filters & Sort */}
      <Card>
        <CardContent className="py-4 space-y-4">
          {/* Status Filters */}
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
            <Link href="/admin/dossiers?status=A_VALIDER">
              <Button
                variant={params.status === 'A_VALIDER' ? 'primary' : 'outline'}
                size="sm"
              >
                À valider ({counts.A_VALIDER})
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

          {/* Search & Sort Options */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-gray-100">
            {/* Searchbar */}
            <DossierSearch defaultValue={params.search || ''} />

            {/* Séparateur */}
            <div className="hidden sm:block h-6 w-px bg-gray-200" />

            {/* Tri par date */}
            <SortSelect currentSort={sortField} currentOrder={sortOrder} />

            {/* Séparateur */}
            <div className="hidden sm:block h-6 w-px bg-gray-200" />

            {/* Filtre par étape */}
            <StepFilterSelect
              stepTemplates={stepTemplates}
              currentStep={params.step}
              baseUrl="/admin/dossiers"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dossiers List */}
      <div className="space-y-3">
        {filteredDossiers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">
                {params.step ? 'Aucun dossier à cette étape' : 'Aucun dossier trouvé'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDossiers.map(dossier => {
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

            const isClosed = dossier.status === 'CLOTURE' || dossier.status === 'TERMINE'
            const isWaiting = dossier.status === 'EN_ATTENTE'

            return (
              <Link key={dossier.id} href={`/admin/dossiers/${dossier.id}`} className="block">
                <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 border-2 ${
                  isClosed
                    ? 'bg-success-10 hover:bg-success-15 border-success-50'
                    : isWaiting
                    ? 'bg-accent2-10 hover:bg-accent2-15 border-accent2-40'
                    : pendingValidation > 0
                    ? 'bg-amber-50 hover:bg-amber-100/70 border-amber-400'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
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
                          className={
                            isClosed
                              ? 'bg-[var(--success)] text-white'
                              : isWaiting
                              ? 'bg-[var(--accent-2)]/20 text-[var(--accent-2)]'
                              : pendingValidation > 0
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-[var(--light-purple)] text-[var(--accent)]'
                          }
                        >
                          {isClosed ? 'Clôturé' : pendingValidation > 0 ? `${pendingValidation} à valider` : formatDossierStatus(dossier.status)}
                        </Badge>
                        {/* Payment Status Badge */}
                        {dossier.servicePaymentStatus === 'SUCCEEDED' ? (
                          <Badge className="bg-green-100 text-green-700 gap-1">
                            <CreditCard className="h-3 w-3" />
                            Payé
                          </Badge>
                        ) : dossier.servicePaymentStatus === 'PENDING' ? (
                          <Badge className="bg-amber-100 text-amber-700 gap-1">
                            <CreditCard className="h-3 w-3" />
                            Paiement en cours
                          </Badge>
                        ) : null}
                      </div>
                      <p className={`text-sm ${isClosed ? 'text-[var(--success)]' : 'text-[var(--grey)]'}`}>
                        {dossier.client
                          ? `${dossier.client.firstName} ${dossier.client.lastName}`
                          : dossier.endClientFirstName
                            ? `${dossier.endClientFirstName} ${dossier.endClientLastName || ''}`
                            : 'Client non renseigné'}
                        {dossier.artisan && (
                          <span className="ml-2 text-accent text-xs">
                            (Artisan: <ArtisanLink
                              artisanId={dossier.artisan.id}
                              companyName={dossier.artisan.companyName || ''}
                            />)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {!isClosed ? (
                    <div className="flex items-center gap-6">
                      {currentStep && (
                        <div className="text-right">
                          <p className="text-xs text-[var(--grey)]">Étape en cours</p>
                          <p className="text-sm font-medium text-[var(--dark)]">
                            {currentStep.template.name}
                          </p>
                        </div>
                      )}
                      <div className="w-28">
                        <div className="flex items-center gap-3">
                          <Progress value={progress} className="h-2 flex-1" />
                          <span className="text-xs font-medium min-w-[32px] text-right text-[var(--grey)]">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--success)]">
                        Dossier terminé
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
