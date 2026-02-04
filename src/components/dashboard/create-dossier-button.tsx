'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateDossierModal } from './create-dossier-modal'

interface CreateDossierButtonProps {
  variant?: 'outline' | 'primary'
}

export function CreateDossierButton({ variant = 'outline' }: CreateDossierButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
      >
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un dossier
      </Button>
      <CreateDossierModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
