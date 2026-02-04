'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Plus,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
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
  dossiersCount: number
}

export default function AdminArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArtisans()
  }, [])

  async function fetchArtisans() {
    try {
      const res = await fetch('/api/admin/artisans')
      if (res.ok) {
        const data = await res.json()
        setArtisans(data.artisans)
      }
    } catch (error) {
      console.error('Error fetching artisans:', error)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Artisans</h1>
            <p className="text-gray-600 mt-1">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artisans</h1>
          <p className="text-gray-600 mt-1">
            {artisans.length} artisan{artisans.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/admin/artisans/new">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un artisan
          </Button>
        </Link>
      </div>

      {/* Artisans List */}
      <div className="space-y-3">
        {artisans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Aucun artisan enregistré
              </p>
              <Link href="/admin/artisans/new">
                <Button variant="primary" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un artisan
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          artisans.map((artisan) => (
            <Link key={artisan.id} href={`/admin/artisans/${artisan.id}`} className="block">
              <div
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 border-2 ${
                  artisan.isActive
                    ? 'bg-white hover:bg-gray-50 border-gray-200'
                    : 'bg-gray-100 hover:bg-gray-150 border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-full ${
                      artisan.isActive
                        ? 'bg-[var(--light-purple)]'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Building2
                      className={`h-5 w-5 ${
                        artisan.isActive
                          ? 'text-[var(--accent)]'
                          : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${artisan.isActive ? 'text-[var(--dark)]' : 'text-gray-500'}`}>
                        {artisan.companyName || 'Sans nom'}
                      </p>
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
                    <p className={`text-sm ${artisan.isActive ? 'text-[var(--grey)]' : 'text-gray-400'}`}>
                      {artisan.firstName} {artisan.lastName}
                      <span className="mx-2">•</span>
                      {artisan.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {artisan.rgeQualifications && artisan.rgeQualifications.length > 0 && (
                    <div className="hidden md:flex flex-wrap gap-1">
                      {artisan.rgeQualifications.slice(0, 2).map((rge) => (
                        <Badge
                          key={rge}
                          className="bg-green-100 text-green-700 text-xs"
                        >
                          {rge}
                        </Badge>
                      ))}
                      {artisan.rgeQualifications.length > 2 && (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">
                          +{artisan.rgeQualifications.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-[var(--accent)]">
                      <FileText className="h-4 w-4" />
                      <span className="font-semibold">
                        {artisan.dossiersCount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      dossier{artisan.dossiersCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
