'use client'

import { RealtimeProvider } from '@/contexts/realtime-context'
import { FloatingChat } from '@/components/chat/floating-chat'

interface Dossier {
  id: string
  reference: string
}

interface DashboardProvidersProps {
  children: React.ReactNode
  userId: string
  dossiers: Dossier[]
  unreadMessages: number
  soundEnabled: boolean
}

export function DashboardProviders({
  children,
  userId,
  dossiers,
  unreadMessages,
  soundEnabled,
}: DashboardProvidersProps) {
  return (
    <RealtimeProvider userId={userId}>
      {children}
      {dossiers.length > 0 && (
        <FloatingChat
          userId={userId}
          dossiers={dossiers}
          unreadCount={unreadMessages}
          soundEnabled={soundEnabled}
        />
      )}
    </RealtimeProvider>
  )
}
