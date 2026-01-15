'use client'

import { NotificationsDropdown } from '@/components/layout/notifications-dropdown'
import { SoundToggle } from '@/components/layout/sound-toggle'

interface TopBarProps {
  initialNotificationCount?: number
  isAdmin?: boolean
}

export function TopBar({ initialNotificationCount = 0, isAdmin = false }: TopBarProps) {
  return (
    <div className="fixed top-4 right-6 lg:right-8 z-40 flex items-center gap-2">
      <SoundToggle />
      {!isAdmin && (
        <NotificationsDropdown initialCount={initialNotificationCount} />
      )}
    </div>
  )
}
