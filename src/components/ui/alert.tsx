import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
}

const variants = {
  info: {
    container: 'bg-accent-light border-primary-200',
    icon: 'text-primary-600',
    title: 'text-primary-800',
    text: 'text-primary-700',
    Icon: Info,
  },
  success: {
    container: 'bg-kopro-success/10 border-kopro-success/30',
    icon: 'text-kopro-success',
    title: 'text-kopro-success',
    text: 'text-kopro-success/80',
    Icon: CheckCircle,
  },
  warning: {
    container: 'bg-accent-orange/10 border-accent-orange/30',
    icon: 'text-accent-orange',
    title: 'text-accent-orange',
    text: 'text-accent-orange/80',
    Icon: AlertCircle,
  },
  error: {
    container: 'bg-kopro-required/10 border-kopro-required/30',
    icon: 'text-kopro-required',
    title: 'text-kopro-required',
    text: 'text-kopro-required/80',
    Icon: XCircle,
  },
}

export function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  const styles = variants[variant]
  const Icon = styles.Icon

  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
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
