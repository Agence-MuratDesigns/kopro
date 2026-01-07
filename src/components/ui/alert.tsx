import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
}

const variants = {
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    text: 'text-blue-700',
    Icon: Info,
  },
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    text: 'text-green-700',
    Icon: CheckCircle,
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-500',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
    Icon: AlertCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
    Icon: XCircle,
  },
}

export function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  const styles = variants[variant]
  const Icon = styles.Icon

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        styles.container,
        className
      )}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={cn('h-5 w-5', styles.icon)} />
        </div>
        <div className="ml-3">
          {title && (
            <h3 className={cn('text-sm font-medium', styles.title)}>{title}</h3>
          )}
          <div className={cn('text-sm', styles.text, title && 'mt-1')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
