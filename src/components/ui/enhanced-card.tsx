import { forwardRef } from 'react'
import { cn } from "@/lib/utils"

const EnhancedCard = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'premium' | 'glow' | 'gradient'
    hover?: boolean
    animate?: boolean
  }
>(({ className, variant = 'default', hover = true, animate = true, ...props }, ref) => {
  const variants = {
    default: "bg-card text-card-foreground border shadow-card",
    premium: "bg-gradient-to-br from-card via-card to-muted/20 text-card-foreground border-primary/20 shadow-glow",
    glow: "bg-card text-card-foreground border border-primary/30 shadow-glow animate-pulse-glow",
    gradient: "bg-gradient-primary text-primary-foreground border-0 shadow-glow"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg transition-all duration-300",
        variants[variant],
        hover && "hover:shadow-soft hover:scale-[1.02] hover:-translate-y-1",
        animate && "animate-slide-up",
        className
      )}
      {...props}
    />
  )
})
EnhancedCard.displayName = "EnhancedCard"

const EnhancedCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
EnhancedCardHeader.displayName = "EnhancedCardHeader"

const EnhancedCardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    gradient?: boolean
  }
>(({ className, gradient = false, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      gradient && "bg-gradient-primary bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
))
EnhancedCardTitle.displayName = "EnhancedCardTitle"

const EnhancedCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
EnhancedCardDescription.displayName = "EnhancedCardDescription"

const EnhancedCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
EnhancedCardContent.displayName = "EnhancedCardContent"

const EnhancedCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
EnhancedCardFooter.displayName = "EnhancedCardFooter"

export { 
  EnhancedCard, 
  EnhancedCardHeader, 
  EnhancedCardFooter, 
  EnhancedCardTitle, 
  EnhancedCardDescription, 
  EnhancedCardContent 
}