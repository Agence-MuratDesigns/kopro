'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  User,
  HelpCircle,
  ChevronLeft,
  Menu,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  dossier?: {
    id: string
    reference: string
  } | null
  unreadNotifications?: number
  unreadMessages?: number
}

export function Sidebar({ user, dossier, unreadNotifications = 0, unreadMessages = 0 }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isAdmin = user.role === 'ADMIN' || user.role === 'ADVISOR'

  const clientNavItems = [
    {
      href: '/dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    ...(dossier
      ? [
          {
            href: `/dossier/${dossier.id}`,
            label: 'Mon dossier',
            icon: FileText,
          },
        ]
      : []),
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessages,
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications,
    },
  ]

  const adminNavItems = [
    {
      href: '/admin',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/clients',
      label: 'Clients',
      icon: User,
    },
    {
      href: '/admin/dossiers',
      label: 'Dossiers',
      icon: FileText,
    },
    {
      href: '/admin/messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessages,
    },
  ]

  const navItems = isAdmin ? adminNavItems : clientNavItems

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity',
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
        onClick={() => setIsCollapsed(true)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0 w-64'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="font-bold text-lg text-gray-900">KOPRO</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* User info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-semibold">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            {dossier && !isAdmin && (
              <div className="mt-3 p-2 bg-primary-50 rounded-lg">
                <p className="text-xs text-primary-600 font-medium">Dossier</p>
                <p className="text-sm font-bold text-primary-700">{dossier.reference}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-600')} />
                {!isCollapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          {!isCollapsed && (
            <>
              <Link
                href="/aide"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="font-medium">Aide</span>
              </Link>
            </>
          )}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 w-full',
                isCollapsed && 'justify-center'
              )}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="font-medium">Déconnexion</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsCollapsed(false)}
        className={cn(
          'fixed bottom-4 left-4 z-30 lg:hidden p-3 bg-primary-600 text-white rounded-full shadow-lg',
          !isCollapsed && 'hidden'
        )}
      >
        <Menu className="h-6 w-6" />
      </button>
    </>
  )
}
