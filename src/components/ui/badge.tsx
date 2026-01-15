import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'primary'
}

const variants = {
  default: 'bg-kopro-cream text-kopro-dark',
  secondary: 'bg-accent-light text-primary-700',
  primary: 'bg-primary-600 text-white',
  success: 'bg-kopro-success/10 text-kopro-success',
  warning: 'bg-accent-orange/10 text-accent-orange',
  error: 'bg-kopro-required/10 text-kopro-required',
  info: 'bg-accent-light text-primary-600',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
