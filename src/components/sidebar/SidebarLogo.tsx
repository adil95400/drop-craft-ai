/**
 * SidebarLogo - Logo professionnel ShopOpti pour la sidebar
 */
import { memo } from 'react'
import { cn } from '@/lib/utils'
import logoSvg from '@/assets/logo.svg'

interface SidebarLogoProps {
  collapsed?: boolean
  className?: string
}

export const SidebarLogo = memo<SidebarLogoProps>(({ collapsed = false, className }) => {
  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative group cursor-pointer">
          <img 
            src={logoSvg} 
            alt="Shopopti+" 
            className="w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-3 group cursor-pointer", className)}>
      <img 
        src={logoSvg} 
        alt="Shopopti+" 
        className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  )
})

SidebarLogo.displayName = 'SidebarLogo'
