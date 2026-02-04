'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  FileText,
  LogOut,
  User,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  ChevronRight,
  Building2,
} from 'lucide-react'
import { useUserAvatar } from '@/contexts/user-avatar-context'
import { useSoundToggle, useSound } from '@/hooks/use-sound'

interface SidebarProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  dossiersCount?: number
  unreadNotifications?: number
  unreadMessages?: number
  hasActionRequired?: boolean
}

export function Sidebar({ user, dossiersCount = 0, unreadMessages = 0, hasActionRequired = false }: SidebarProps) {
  const pathname = usePathname()
  const { avatarUrl } = useUserAvatar()
  const { soundEnabled } = useSoundToggle()
  const { play } = useSound({ enabled: soundEnabled })

  const handleNavClick = () => {
    play('click')
  }

  const isAdmin = user.role === 'ADMIN'
  const isArtisan = user.role === 'ARTISAN'

  const clientNavItems = [
    {
      href: '/dashboard',
      label: 'Accueil',
      icon: Home,
    },
    {
      href: '/dossiers',
      label: 'Mes dossiers',
      icon: FileText,
      ...(hasActionRequired && { badge: dossiersCount > 0 ? 1 : 0 }),
    },
    {
      href: '/profil',
      label: 'Mon profil',
      icon: User,
    },
    {
      href: '/support',
      label: 'Aide & support',
      icon: HelpCircle,
    },
  ]

  const artisanNavItems = [
    {
      href: '/dashboard',
      label: 'Tableau de bord',
      icon: Home,
    },
    {
      href: '/dossiers',
      label: 'Dossiers clients',
      icon: FileText,
      badge: dossiersCount > 0 ? dossiersCount : undefined,
    },
    {
      href: '/profil',
      label: 'Mon profil',
      icon: User,
    },
    {
      href: '/support',
      label: 'Aide & support',
      icon: HelpCircle,
    },
  ]

  const adminNavItems = [
    {
      href: '/admin',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/dossiers',
      label: 'Dossiers',
      icon: FileText,
    },
    {
      href: '/admin/artisans',
      label: 'Artisans',
      icon: Building2,
    },
    {
      href: '/admin/messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessages,
    },
  ]

  const navItems = isAdmin ? adminNavItems : isArtisan ? artisanNavItems : clientNavItems

  return (
    <aside className="fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white flex flex-col border-r border-primary-100">
      {/* Header with Logo */}
      <div className="px-5 py-6">
        <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center group">
          <img
            src="/logo.svg"
            alt="KOPRO"
            className="h-10 transition-transform duration-200 group-hover:scale-95"
          />
        </Link>

        {/* Separator */}
        <div className="h-px bg-primary-100 mt-5" />
      </div>

      {/* Navigation Section Title */}
      <div className="px-5 mb-2">
        <p className="text-xs font-medium text-kopro-grey uppercase tracking-wider">
          Tableau de bord
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // Pour /admin, on vérifie uniquement l'égalité exacte pour éviter qu'il soit actif sur toutes les pages admin
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group',
                isActive
                  ? 'bg-accent-light text-accent font-medium'
                  : 'text-kopro-dark hover:bg-accent-light/50 hover:text-accent'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                isActive ? 'bg-accent text-white' : 'bg-primary-50 text-kopro-grey group-hover:bg-accent group-hover:text-white'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="bg-kopro-required text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : (
                <ChevronRight className={cn(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-accent' : 'text-kopro-grey'
                )} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto">
        {/* Separator */}
        <div className="h-px bg-primary-100 mx-5" />

        {/* Logout Section */}
        <div className="px-5 py-3">
          <p className="text-[10px] font-medium text-kopro-grey/60 uppercase tracking-wider mb-1.5">
            Autre
          </p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 w-full text-kopro-grey hover:text-accent transition-colors py-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Se déconnecter</span>
            </button>
          </form>
        </div>

        {/* Separator */}
        <div className="h-px bg-primary-100 mx-5" />

        {/* User Profile Card */}
        <Link
          href="/profil"
          onClick={handleNavClick}
          className="flex items-center gap-3 p-4 m-3 rounded-xl"
        >
          {/* Avatar with violet border */}
          <div className="relative flex-shrink-0">
            <div className="rounded-full border-2 border-accent w-12 h-12 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent to-primary-400 flex items-center justify-center text-white font-semibold text-sm">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-kopro-dark truncate">
                {user.firstName} {user.lastName}
              </p>
              <img src="/verified-badge.svg" alt="Vérifié" className="h-4 w-4 flex-shrink-0" />
            </div>
            <p className="text-sm text-kopro-grey truncate">
              {user.email}
            </p>
          </div>

          {/* Arrow */}
          <ChevronRight className="h-4 w-4 text-kopro-grey flex-shrink-0" />
        </Link>
      </div>
    </aside>
  )
}
