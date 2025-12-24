/**
 * SidebarLogo - Logo professionnel et animé pour la sidebar
 */
import { memo } from 'react'
import { ShoppingCart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarLogoProps {
  collapsed?: boolean
  className?: string
}

export const SidebarLogo = memo<SidebarLogoProps>(({ collapsed = false, className }) => {
  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/20 blur-xl rounded-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative w-10 h-10 bg-gradient-to-br from-primary via-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/35 group-hover:scale-105">
            <ShoppingCart className="w-5 h-5 text-primary-foreground transition-transform duration-300 group-hover:rotate-6" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/25 via-white/10 to-transparent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3 group cursor-pointer", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 blur-xl rounded-xl scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative w-10 h-10 bg-gradient-to-br from-primary via-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/35 group-hover:scale-105">
          <ShoppingCart className="w-5 h-5 text-primary-foreground transition-transform duration-300 group-hover:rotate-6" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/25 via-white/10 to-transparent" />
        </div>
      </div>
      
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-lg tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary">
          Shopopti
        </span>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-medium text-muted-foreground">
            Pro Platform
          </span>
        </div>
      </div>
    </div>
  )
})

SidebarLogo.displayName = 'SidebarLogo'
