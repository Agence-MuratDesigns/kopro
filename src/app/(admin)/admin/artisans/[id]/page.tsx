'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  Award,
} from 'lucide-react'

interface Artisan {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  companyName: string | null
  siret: string | null
  companyAddress: string | null
  companyPostalCode: string | null
  companyCity: string | null
  rgeQualifications: string[]
  isActive: boolean
  createdAt: string
  firstLoginAt: string | null
  lastLoginAt: string | null
  dossiersCount: number
  managedDossiers: Array<{
    id: string
    reference: string
    status: string
    currentStep: number
    endClientFirstName: string | null
    endClientLastName: string | null
    endClientCity: string | null
    projectType: string | null
    createdAt: string
    updatedAt: string
    mprStatus: string
    steps: Array<{
      id: string
      status: string
      template: {
        name: string
        order: number
      }
    }>
  }>
}

export default function ArtisanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [loading, setLoading] = useState(true)
  const [disabling, setDisabling] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchArtisan()
    }
  }, [params.id])

  async function fetchArtisan() {
    try {
      const res = await fetch(`/api/admin/artisans/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setArtisan(data.artisan)
      } else {
        router.push('/admin/artisans')
      }
    } catch (error) {
      console.error('Error fetching artisan:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleStatus() {
    if (!artisan) return

    const action = artisan.isActive ? 'désactiver' : 'réactiver'
    if (!confirm(`Voulez-vous vraiment ${action} ce compte artisan ?`)) return

    setDisabling(true)
    try {
      const res = await fetch(`/api/admin/artisans/${params.id}`, {
        method: artisan.isActive ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !artisan.isActive }),
      })

      if (res.ok) {
        fetchArtisan()
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    } finally {
      setDisabling(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link href="/admin/artisans">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chargement...</h1>
          </div>
        </div>
      </div>
    )
  }

  if (!artisan) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link href="/admin/artisans">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Artisan non trouvé</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/artisans">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {artisan.companyName}
              </h1>
              {artisan.isActive ? (
                <Badge className="bg-[var(--success)]/10 text-[var(--success)]">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              ) : (
                <Badge className="bg-gray-200 text-gray-600">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactif
                </Badge>
              )}
            </div>
            <p className="text-gray-600">SIRET: {artisan.siret}</p>
          </div>
        </div>
        <Button
          variant={artisan.isActive ? 'outline' : 'primary'}
          onClick={handleToggleStatus}
          disabled={disabling}
          className={artisan.isActive ? 'text-red-600 border-red-300 hover:bg-red-50' : ''}
        >
          {disabling
            ? 'En cours...'
            : artisan.isActive
            ? 'Désactiver le compte'
            : 'Réactiver le compte'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Artisan Info */}
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-[var(--accent)]" />
                Entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Raison sociale</p>
                <p className="font-medium">{artisan.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">SIRET</p>
                <p className="font-mono">{artisan.siret}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>
                    {artisan.companyAddress}
                    <br />
                    {artisan.companyPostalCode} {artisan.companyCity}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-[var(--accent)]" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-medium">
                {artisan.firstName} {artisan.lastName}
              </p>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${artisan.email}`} className="hover:underline">
                  {artisan.email}
                </a>
              </div>
              {artisan.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${artisan.phone}`} className="hover:underline">
                    {artisan.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RGE Qualifications */}
          {artisan.rgeQualifications && artisan.rgeQualifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-[var(--accent)]" />
                  Certifications RGE
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {artisan.rgeQualifications.map((rge) => (
                    <Badge key={rge} className="bg-green-100 text-green-700">
                      {rge}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-[var(--accent)]" />
                Compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Création</span>
                <span>{formatDate(artisan.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Première connexion</span>
                <span>
                  {artisan.firstLoginAt
                    ? formatDate(artisan.firstLoginAt)
                    : 'Jamais'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dernière connexion</span>
                <span>
                  {artisan.lastLoginAt
                    ? formatDate(artisan.lastLoginAt)
                    : 'Jamais'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Dossiers */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[var(--accent)]" />
                  Dossiers gérés ({artisan.dossiersCount})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {artisan.managedDossiers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun dossier géré par cet artisan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {artisan.managedDossiers.map((dossier) => {
                    const currentStep = dossier.steps.find(
                      (s) =>
                        s.status === 'PENDING_VALIDATION' ||
                        s.status === 'IN_PROGRESS' ||
                        s.status === 'AVAILABLE'
                    )
                    const validatedSteps = dossier.steps.filter(
                      (s) => s.status === 'VALIDATED'
                    ).length
                    const progress = Math.round(
                      (validatedSteps / dossier.steps.length) * 100
                    )
                    const pendingValidation = dossier.steps.filter(
                      (s) => s.status === 'PENDING_VALIDATION'
                    ).length

                    const isClosed =
                      dossier.status === 'CLOTURE' || dossier.status === 'TERMINE'

                    return (
                      <Link
                        key={dossier.id}
                        href={`/admin/dossiers/${dossier.id}`}
                        className="block"
                      >
                        <div
                          className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 border-2 ${
                            isClosed
                              ? 'bg-success-10 hover:bg-success-15 border-success-50'
                              : pendingValidation > 0
                              ? 'bg-amber-50 hover:bg-amber-100/70 border-amber-400'
                              : 'bg-white hover:bg-gray-50 border-gray-200'
                          }`}
                        >
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
                                {pendingValidation > 0 && (
                                  <Badge className="bg-amber-100 text-amber-700">
                                    {pendingValidation} à valider
                                  </Badge>
                                )}
                                {isClosed && (
                                  <Badge className="bg-[var(--success)] text-white">
                                    Clôturé
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm ${isClosed ? 'text-[var(--success)]' : 'text-[var(--grey)]'}`}>
                                {dossier.endClientFirstName}{' '}
                                {dossier.endClientLastName}
                                {dossier.endClientCity && (
                                  <span className="ml-2 text-xs">
                                    • {dossier.endClientCity}
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
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
