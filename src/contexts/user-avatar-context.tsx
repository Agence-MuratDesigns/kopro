'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface UserAvatarContextType {
  avatarUrl: string | null
  setAvatarUrl: (url: string | null) => void
}

const UserAvatarContext = createContext<UserAvatarContextType | undefined>(undefined)

interface UserAvatarProviderProps {
  children: ReactNode
  initialAvatarUrl: string | null
}

export function UserAvatarProvider({ children, initialAvatarUrl }: UserAvatarProviderProps) {
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(initialAvatarUrl)

  const setAvatarUrl = useCallback((url: string | null) => {
    setAvatarUrlState(url)
  }, [])

  return (
    <UserAvatarContext.Provider value={{ avatarUrl, setAvatarUrl }}>
      {children}
    </UserAvatarContext.Provider>
  )
}

export function useUserAvatar() {
  const context = useContext(UserAvatarContext)
  if (context === undefined) {
    throw new Error('useUserAvatar must be used within a UserAvatarProvider')
  }
  return context
}
