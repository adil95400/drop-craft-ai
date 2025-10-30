import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm",
        outline: "text-foreground border-border hover:bg-muted",
        success:
          "border-transparent bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90 shadow-sm",
        warning:
          "border-transparent bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-90 shadow-sm",
        info:
          "border-transparent bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90 shadow-sm",
        gradient:
          "border-transparent bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow",
        premium:
          "border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:opacity-90 shadow-lg animate-pulse-subtle",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
