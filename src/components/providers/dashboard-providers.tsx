'use client'

import { RealtimeProvider } from '@/contexts/realtime-context'
import { ToastProvider } from '@/components/ui/toast'
import { FloatingChat } from '@/components/chat/floating-chat'
import { ActionIndicator } from '@/components/ui/action-indicator'

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
    <ToastProvider>
      <RealtimeProvider userId={userId}>
        {children}
        {/* Action indicator for pending operations */}
        <ActionIndicator />
        {/* Floating chat */}
        {dossiers.length > 0 && (
          <FloatingChat
            userId={userId}
            dossiers={dossiers}
            unreadCount={unreadMessages}
            soundEnabled={soundEnabled}
          />
        )}
      </RealtimeProvider>
    </ToastProvider>
  )
}
