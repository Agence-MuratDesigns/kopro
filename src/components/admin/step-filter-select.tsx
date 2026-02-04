'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Layers } from 'lucide-react'

interface StepTemplate {
  code: string
  name: string
  order: number
}

interface StepFilterSelectProps {
  stepTemplates: StepTemplate[]
  currentStep?: string
  baseUrl: string
}

export function StepFilterSelect({ stepTemplates, currentStep, baseUrl }: StepFilterSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set('step', value)
    } else {
      params.delete('step')
    }

    // Conserver les autres paramètres (status, sort, order)
    router.push(`${baseUrl}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Layers className="h-4 w-4 text-gray-500" />
      <select
        value={currentStep || ''}
        onChange={handleChange}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors cursor-pointer"
      >
        <option value="">Toutes les étapes</option>
        {stepTemplates.map((template) => (
          <option key={template.code} value={template.code}>
            {template.order}. {template.name}
          </option>
        ))}
      </select>
    </div>
  )
}
