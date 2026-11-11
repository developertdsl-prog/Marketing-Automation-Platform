import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
          variant === 'default' &&
            'border-primary bg-primary text-primary-foreground',
          variant === 'destructive' &&
            'border-destructive bg-destructive text-destructive-foreground',
          variant === 'outline' &&
            'border-input bg-background text-foreground',
          variant === 'secondary' &&
            'border-secondary bg-secondary text-secondary-foreground',
          className,
        )}
        {...props}
      />
    )
  },
)
Badge.displayName = 'Badge'

export { Badge }
