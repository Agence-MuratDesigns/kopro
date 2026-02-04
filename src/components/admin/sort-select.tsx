'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SortSelectProps {
  currentSort: string
  currentOrder: string
}

export function SortSelect({ currentSort, currentOrder }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split('-')
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', field)
    params.set('order', order)
    router.push(`/admin/dossiers?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-gray-500 whitespace-nowrap">
        Trier par :
      </label>
      <select
        id="sort-select"
        value={`${currentSort}-${currentOrder}`}
        onChange={handleChange}
        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent bg-white cursor-pointer"
      >
        <option value="date-desc">Date (plus récent)</option>
        <option value="date-asc">Date (plus ancien)</option>
        <option value="client-asc">Client (A → Z)</option>
        <option value="client-desc">Client (Z → A)</option>
      </select>
    </div>
  )
}
