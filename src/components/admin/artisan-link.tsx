'use client'

import Link from 'next/link'

interface ArtisanLinkProps {
  artisanId: string
  companyName: string
}

export function ArtisanLink({ artisanId, companyName }: ArtisanLinkProps) {
  return (
    <Link
      href={`/admin/artisans/${artisanId}`}
      onClick={(e) => e.stopPropagation()}
      className="underline hover:text-accent/80 transition-colors"
    >
      {companyName}
    </Link>
  )
}
