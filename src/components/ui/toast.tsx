'use client'

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

// Toast types
type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  loading: (title: string, message?: string) => string
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: Error) => string)
    }
  ) => Promise<T>
}

const ToastContext = createContext<ToastContextType | null>(null)

// Toast notification component
function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: () => void
}) {
  const [isExiting, setIsExiting] = useState(false)

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    setTimeout(onDismiss, 200)
  }, [onDismiss])

  useEffect(() => {
    if (toast.type !== 'loading' && toast.duration !== 0) {
      const timer = setTimeout(handleDismiss, toast.duration || 4000)
      return () => clearTimeout(timer)
    }
  }, [toast.type, toast.duration, handleDismiss])

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    loading: <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />,
  }

  const styles: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-amber-50 border-amber-200',
    loading: 'bg-gray-50 border-gray-200',
  }

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm',
        'transition-all duration-200 ease-out',
        isExiting
          ? 'opacity-0 translate-x-4 scale-95'
          : 'opacity-100 translate-x-0 scale-100 animate-slide-in-right',
        styles[toast.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>
        )}
      </div>
      {toast.dismissible !== false && toast.type !== 'loading' && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      )}
    </div>
  )
}

// Toast container
export function ToastContainer() {
  const context = useContext(ToastContext)
  if (!context) return null

  const { toasts, removeToast } = context

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-96 max-w-[calc(100vw-3rem)]">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Toast provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [])

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: 'success', title, message }),
    [addToast]
  )

  const error = useCallback(
    (title: string, message?: string) => addToast({ type: 'error', title, message }),
    [addToast]
  )

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: 'info', title, message }),
    [addToast]
  )

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    [addToast]
  )

  const loading = useCallback(
    (title: string, message?: string) =>
      addToast({ type: 'loading', title, message, duration: 0 }),
    [addToast]
  )

  const promise = useCallback(
    async <T,>(
      promiseOrFn: Promise<T>,
      options: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((err: Error) => string)
      }
    ): Promise<T> => {
      const id = loading(options.loading)
      try {
        const result = await promiseOrFn
        const successMessage =
          typeof options.success === 'function' ? options.success(result) : options.success
        updateToast(id, { type: 'success', title: successMessage, duration: 4000 })
        return result
      } catch (err) {
        const errorMessage =
          typeof options.error === 'function'
            ? options.error(err as Error)
            : options.error
        updateToast(id, { type: 'error', title: errorMessage, duration: 5000 })
        throw err
      }
    },
    [loading, updateToast]
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        updateToast,
        success,
        error,
        info,
        warning,
        loading,
        promise,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Hook to use toasts
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
