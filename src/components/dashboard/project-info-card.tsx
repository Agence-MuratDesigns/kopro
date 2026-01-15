'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectInfoForm } from './project-info-form'
import { Home, Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ProjectInfoCardProps {
  dossierId: string
  projectType: string | null
  projectAddress: string | null
  projectCity: string | null
  projectPostalCode: string | null
  estimatedBudget: number | null
  revenueCategory: string | null
  householdSize: number | null
}

export function ProjectInfoCard({
  dossierId,
  projectType,
  projectAddress,
  projectCity,
  projectPostalCode,
  estimatedBudget,
  revenueCategory,
  householdSize,
}: ProjectInfoCardProps) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  const hasAnyInfo = projectType || projectAddress || estimatedBudget || revenueCategory || householdSize

  const handleSuccess = () => {
    setShowForm(false)
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4" />
              Informations du projet
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(true)}
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 w-fit"
            >
              <Pencil className="h-4 w-4 mr-1" />
              {hasAnyInfo ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasAnyInfo ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-3">
                Aucune information renseignée
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                Ajouter les informations
              </Button>
            </div>
          ) : (
            <>
              {projectType && (
                <div>
                  <p className="text-sm text-gray-500">Type de projet</p>
                  <p className="font-medium">{projectType}</p>
                </div>
              )}
              {projectAddress && (
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-medium">
                    {projectAddress}
                    {(projectPostalCode || projectCity) && (
                      <>
                        <br />
                        {projectPostalCode} {projectCity}
                      </>
                    )}
                  </p>
                </div>
              )}
              {estimatedBudget && (
                <div>
                  <p className="text-sm text-gray-500">Budget estimé</p>
                  <p className="font-medium">{formatCurrency(estimatedBudget)}</p>
                </div>
              )}
              {revenueCategory && (
                <div>
                  <p className="text-sm text-gray-500">Catégorie de revenus</p>
                  <p className="font-medium">{revenueCategory}</p>
                </div>
              )}
              {householdSize && (
                <div>
                  <p className="text-sm text-gray-500">Composition du foyer</p>
                  <p className="font-medium">{householdSize} personne(s)</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <ProjectInfoForm
          dossierId={dossierId}
          initialData={{
            projectType,
            projectAddress,
            projectCity,
            projectPostalCode,
            estimatedBudget,
            revenueCategory,
            householdSize,
          }}
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
