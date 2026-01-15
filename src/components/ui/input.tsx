'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="form-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'input-field',
            error && 'error',
            className
          )}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-kopro-required">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm text-kopro-grey">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
