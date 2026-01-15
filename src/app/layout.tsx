import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'KOPRO - Suivi de votre dossier MaPrimeRénov\'',
  description: 'Application de suivi des dossiers de rénovation énergétique MaPrimeRénov\' et CEE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={poppins.className}>
        {children}
      </body>
    </html>
  )
}
