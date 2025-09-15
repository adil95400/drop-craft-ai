// COMPOSANT LOADING UNIFIÉ
// Remplace tous les spinners dupliqués dans l'app

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  variant?: 'default' | 'fullscreen' | 'inline'
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8'
}

export const LoadingSpinner = ({ 
  size = 'md', 
  text,
  className,
  variant = 'default'
}: LoadingSpinnerProps) => {
  const spinnerClass = cn(
    'animate-spin text-primary',
    sizeMap[size],
    className
  )

  const content = (
    <>
      <Loader2 className={spinnerClass} />
      {text && (
        <p className="text-muted-foreground mt-2">
          {text}
        </p>
      )}
    </>
  )

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          {content}
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2">
        {content}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {content}
    </div>
  )
}