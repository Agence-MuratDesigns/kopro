'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSoundNotifications } from '@/hooks/use-sound'
import {
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Loader2,
} from 'lucide-react'

type DialogVariant = 'info' | 'warning' | 'danger' | 'success'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: DialogVariant
  isLoading?: boolean
  soundEnabled?: boolean
}

const variants: Record<DialogVariant, {
  icon: typeof AlertTriangle
  iconBg: string
  iconColor: string
  confirmClass: string
}> = {
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmClass: 'bg-primary-600 hover:bg-primary-700',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmClass: 'bg-amber-600 hover:bg-amber-700',
  },
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmClass: 'bg-red-600 hover:bg-red-700',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    confirmClass: 'bg-green-600 hover:bg-green-700',
  },
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'info',
  isLoading = false,
  soundEnabled = true,
}: ConfirmationDialogProps) {
  const { playClick, playSuccess, playError } = useSoundNotifications(soundEnabled)
  const v = variants[variant]
  const Icon = v.icon

  const handleConfirm = async () => {
    playClick()
    try {
      await onConfirm()
      playSuccess()
    } catch {
      playError()
    }
  }

  const handleClose = () => {
    playClick()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          disabled={isLoading}
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={cn('p-3 rounded-full mb-4', v.iconBg)}>
            <Icon className={cn('h-8 w-8', v.iconColor)} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              className={cn('flex-1 text-white', v.confirmClass)}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  En cours...
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for easy confirmation dialog usage
export function useConfirmation() {
  const [state, setState] = useState<{
    isOpen: boolean
    config: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>
    resolve: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    config: { title: '', message: '' },
    resolve: null,
  })

  const confirm = useCallback((config: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        config,
        resolve,
      })
    })
  }, [])

  const handleClose = useCallback(() => {
    state.resolve?.(false)
    setState(prev => ({ ...prev, isOpen: false, resolve: null }))
  }, [state.resolve])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState(prev => ({ ...prev, isOpen: false, resolve: null }))
  }, [state.resolve])

  const Dialog = useCallback(() => (
    <ConfirmationDialog
      isOpen={state.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...state.config}
    />
  ), [state.isOpen, state.config, handleClose, handleConfirm])

  return { confirm, Dialog }
}
