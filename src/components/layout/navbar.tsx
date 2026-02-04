'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  FileText,
  MessageSquare,
  Bell,
  LogOut,
  Menu,
  X,
  BarChart3,
  Settings,
  ChevronDown,
  Building2,
} from 'lucide-react'
import { SoundToggle } from './sound-toggle'

interface NavbarProps {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

export function Navbar({ user }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = user.role === 'ADMIN'

  const clientLinks = [
    { href: '/dashboard', label: 'Tableau de bord', icon: Home },
    { href: '/dossier', label: 'Mon dossier', icon: FileText },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ]

  const adminLinks = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/dossiers', label: 'Dossiers', icon: FileText },
    { href: '/admin/artisans', label: 'Artisans', icon: Building2 },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
    { href: '/admin/settings', label: 'Paramètres', icon: Settings },
  ]

  const links = isAdmin ? adminLinks : clientLinks

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-[var(--light-purple)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center group">
              <img
                src="/logo.svg"
                alt="KOPRO"
                className="h-8 transition-transform duration-200 group-hover:scale-95"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon
              // Pour /admin et /dashboard, on vérifie uniquement l'égalité exacte
              const isActive = (link.href === '/admin' || link.href === '/dashboard')
                ? pathname === link.href
                : pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[var(--accent)] text-white shadow-md'
                      : 'text-[var(--dark)] hover:bg-[var(--light-purple)] hover:text-[var(--accent)]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <SoundToggle />
            <div className="relative group">
              <div className="flex items-center gap-2 cursor-pointer py-2 px-3 rounded-xl transition-colors hover:bg-[var(--light-purple)]/50">
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--dark)]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-[var(--grey)]">{user.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[var(--grey)] transition-transform duration-200 group-hover:rotate-180" />
              </div>
              {/* Dropdown au survol */}
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-xl shadow-lg border border-[var(--light-purple)] py-2 min-w-[160px]">
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--required)] hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full text-[var(--dark)] hover:bg-[var(--light-purple)] transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--light-purple)] bg-white/95 backdrop-blur-sm">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[var(--accent)] text-white shadow-md'
                      : 'text-[var(--dark)] hover:bg-[var(--light-purple)]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              )
            })}
            <hr className="my-2 border-[var(--light-purple)]" />
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-[var(--dark)]">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-[var(--grey)]">{user.email}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[var(--required)] hover:bg-red-50 w-full transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
