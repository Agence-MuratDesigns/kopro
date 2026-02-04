'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, ArrowRight } from 'lucide-react'
import { HOUSING_TYPES, REVENUE_CATEGORIES } from '@/lib/utils'

interface ProjectInfoCardProps {
  dossierId: string
  projectInfoStatus: string
  mprStatus: string // Status de l'étape 2 (identifiant MPR)
  // Données provenant de l'étape 3
  housingType: string | null
  revenueCategory: string | null
  householdSize: number | null
  housingSurface: number | null
  constructionYear: number | null
}

export function ProjectInfoCard({
  dossierId,
  projectInfoStatus,
  mprStatus,
  housingType,
  revenueCategory,
  householdSize,
  housingSurface,
  constructionYear,
}: ProjectInfoCardProps) {
  // Vérifier si des données sont présentes
  const hasAnyInfo = housingType || revenueCategory || householdSize || housingSurface || constructionYear

  // L'étape 3 n'est accessible que si l'étape 2 (MPR) est validée
  const canAccessStep3 = mprStatus === 'APPROVED'

  // Obtenir les labels
  const housingTypeLabel = HOUSING_TYPES.find(t => t.code === housingType)?.label
  const revenueCategoryLabel = REVENUE_CATEGORIES.find(c => c.code === revenueCategory)?.label

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Home className="h-4 w-4" />
          Informations du projet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyInfo ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-3">
              Aucune information renseignée
            </p>
            {canAccessStep3 ? (
              <Link href={`/dossier/${dossierId}/etape/PROJECT_INFO`}>
                <Button variant="outline" size="sm">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Compléter à l'étape 3
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                <ArrowRight className="h-4 w-4 mr-1" />
                Compléter à l'étape 3
              </Button>
            )}
            {!canAccessStep3 && (
              <p className="text-xs text-gray-400 mt-2">
                Validez d'abord l'identifiant MaPrimeRénov'
              </p>
            )}
          </div>
        ) : (
          <>
            {housingTypeLabel && (
              <div>
                <p className="text-sm text-gray-500">Type de logement</p>
                <p className="font-medium">{housingTypeLabel}</p>
              </div>
            )}
            {housingSurface && (
              <div>
                <p className="text-sm text-gray-500">Surface</p>
                <p className="font-medium">{housingSurface} m²</p>
              </div>
            )}
            {constructionYear && (
              <div>
                <p className="text-sm text-gray-500">Année de construction</p>
                <p className="font-medium">{constructionYear}</p>
              </div>
            )}
            {revenueCategoryLabel && (
              <div>
                <p className="text-sm text-gray-500">Catégorie de revenus</p>
                <p className="font-medium">{revenueCategoryLabel}</p>
              </div>
            )}
            {householdSize && (
              <div>
                <p className="text-sm text-gray-500">Composition du foyer</p>
                <p className="font-medium">{householdSize} personne(s)</p>
              </div>
            )}

            {/* Lien vers l'étape 3 si pas encore validé */}
            {projectInfoStatus !== 'APPROVED' && (
              <div className="pt-2 border-t">
                <Link href={`/dossier/${dossierId}/etape/PROJECT_INFO`}>
                  <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 w-full justify-start">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    {projectInfoStatus === 'PENDING_REVIEW'
                      ? 'Voir le détail'
                      : 'Modifier à l\'étape 3'}
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
