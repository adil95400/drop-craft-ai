/**
 * Business Toast - Premium animated toast with business impact
 * Non-blocking, fluid feedback for business actions
 */

import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X, TrendingUp, ShieldCheck, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 md:max-w-[420px]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const businessToastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full backdrop-blur-xl',
  {
    variants: {
      variant: {
        default: 'border-border/50 bg-background/95 text-foreground',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-foreground',
        opportunity: 'border-amber-500/30 bg-amber-500/10 text-foreground',
        risk: 'border-red-500/30 bg-red-500/10 text-foreground',
        destructive: 'border-destructive/50 bg-destructive/10 text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Icon component based on variant
function ToastIcon({ variant }: { variant?: string }) {
  const iconClass = 'h-5 w-5 animate-scale-in'
  
  switch (variant) {
    case 'success':
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
          <CheckCircle2 className={cn(iconClass, 'text-emerald-500')} />
        </div>
      )
    case 'opportunity':
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
          <Sparkles className={cn(iconClass, 'text-amber-500')} />
        </div>
      )
    case 'risk':
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/20">
          <ShieldCheck className={cn(iconClass, 'text-red-500')} />
        </div>
      )
    default:
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20">
          <TrendingUp className={cn(iconClass, 'text-primary')} />
        </div>
      )
  }
}

interface BusinessToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof businessToastVariants> {
  impact?: {
    value: string
    label: string
    trend?: 'up' | 'down'
  }
}

const BusinessToast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  BusinessToastProps
>(({ className, variant, impact, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(businessToastVariants({ variant }), className)}
      {...props}
    >
      <ToastIcon variant={variant ?? 'default'} />
      <div className="flex-1 grid gap-1">
        {children}
        {impact && (
          <div className="mt-2 flex items-center gap-2 animate-fade-in">
            <div className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold',
              variant === 'success' && 'bg-emerald-500/20 text-emerald-600',
              variant === 'opportunity' && 'bg-amber-500/20 text-amber-600',
              variant === 'risk' && 'bg-red-500/20 text-red-600',
              !variant && 'bg-primary/20 text-primary'
            )}>
              {impact.trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
              <span>{impact.value}</span>
            </div>
            <span className="text-xs text-muted-foreground">{impact.label}</span>
          </div>
        )}
      </div>
    </ToastPrimitives.Root>
  )
})
BusinessToast.displayName = 'BusinessToast'

const BusinessToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
))
BusinessToastAction.displayName = ToastPrimitives.Action.displayName

const BusinessToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none group-hover:opacity-100',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
BusinessToastClose.displayName = ToastPrimitives.Close.displayName

const BusinessToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
))
BusinessToastTitle.displayName = ToastPrimitives.Title.displayName

const BusinessToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
BusinessToastDescription.displayName = ToastPrimitives.Description.displayName

export {
  type BusinessToastProps,
  ToastProvider,
  ToastViewport,
  BusinessToast,
  BusinessToastTitle,
  BusinessToastDescription,
  BusinessToastClose,
  BusinessToastAction,
}
