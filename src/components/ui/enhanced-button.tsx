import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./loading-states"

const enhancedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-card hover:shadow-glow hover:scale-105",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-card hover:shadow-glow",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-card",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-soft hover:scale-105 animate-pulse-glow",
        gradient: "bg-gradient-accent text-primary-foreground shadow-glow hover:shadow-soft hover:scale-105",
        glow: "bg-primary text-primary-foreground shadow-glow hover:shadow-soft hover:scale-105 border border-primary-glow/50"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface EnhancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof enhancedButtonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  animate?: boolean
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, icon, animate = true, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(
          enhancedButtonVariants({ variant, size }),
          animate && "hover:-translate-y-0.5 active:translate-y-0",
          loading && "pointer-events-none opacity-70",
          className
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" />
            {children}
          </>
        ) : (
          <>
            {icon && icon}
            {children}
          </>
        )}
      </Comp>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"

export { EnhancedButton, enhancedButtonVariants }