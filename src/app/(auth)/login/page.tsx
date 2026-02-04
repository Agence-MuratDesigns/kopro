'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
        return
      }

      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        // CLIENT and ARTISAN both go to /dashboard
        router.push('/dashboard')
      }
      router.refresh()
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Gradient background */}
      <div className="gradient-background" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center mb-8 group">
            <img
              src="/logo.svg"
              alt="KOPRO"
              className="h-10 transition-transform duration-200 group-hover:scale-95"
            />
          </Link>
          <h2 className="text-3xl font-bold text-kopro-dark">Connexion</h2>
          <p className="mt-3 text-kopro-grey">
            Accédez à votre espace de suivi de dossier
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          <div className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              required
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox"
              />
              <span className="text-sm text-kopro-dark">Se souvenir de moi</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-accent hover:text-kopro-dark transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Se connecter
          </Button>
        </form>

        {/* Demo credentials */}
        <div className="mt-8 p-5 bg-accent-light rounded-2xl border border-primary-200">
          <p className="text-sm font-medium text-kopro-dark mb-3">
            Comptes de démonstration :
          </p>
          <div className="text-sm text-kopro-dark/70 space-y-1">
            <p>Client : client@exemple.fr / client123</p>
            <p>Artisan : artisan@exemple.fr / artisan123</p>
            <p>Admin : admin@kopro.fr / admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
