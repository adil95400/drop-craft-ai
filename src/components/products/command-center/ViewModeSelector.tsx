/**
 * Sélecteur de mode de vue pour la page produits
 * Standard / Audit / Business
 * Phase 2 - Command Center V2
 */

import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Grid3X3, 
  Target, 
  BarChart3,
  LucideIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export type ViewMode = 'standard' | 'audit' | 'business'

interface ViewModeSelectorProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  disabled?: boolean
}

interface ViewModeOption {
  id: ViewMode
  label: string
  shortLabel: string
  icon: LucideIcon
  tooltip: string
  description: string
}

const viewModes: ViewModeOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    shortLabel: 'Std',
    icon: Grid3X3,
    tooltip: 'Vue catalogue classique',
    description: 'Affichage standard avec toutes les informations produit'
  },
  {
    id: 'audit',
    label: 'Audit',
    shortLabel: 'Aud',
    icon: Target,
    tooltip: 'Vue optimisation qualité',
    description: 'Focus sur les scores qualité et les recommandations'
  },
  {
    id: 'business',
    label: 'Business',
    shortLabel: 'Biz',
    icon: BarChart3,
    tooltip: 'Vue rentabilité & ROI',
    description: 'Focus sur les marges, profits et performance commerciale'
  }
]

export const ViewModeSelector = memo(function ViewModeSelector({
  value,
  onChange,
  disabled = false
}: ViewModeSelectorProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
        {viewModes.map((mode) => {
          const Icon = mode.icon
          const isActive = value === mode.id
          
          return (
            <Tooltip key={mode.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onChange(mode.id)}
                  disabled={disabled}
                  className={cn(
                    'relative gap-1.5 h-8 px-3 transition-all',
                    isActive && 'shadow-sm'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="viewModeIndicator"
                      className="absolute inset-0 bg-primary rounded-md"
                      initial={false}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className={cn(
                    'relative z-10 flex items-center gap-1.5',
                    isActive && 'text-primary-foreground'
                  )}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{mode.label}</span>
                    <span className="sm:hidden">{mode.shortLabel}</span>
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">{mode.label}</p>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
})

/**
 * Hook pour persister le mode de vue dans le localStorage
 */
export function useViewModePreference(defaultMode: ViewMode = 'standard') {
  const storageKey = 'shopopti_products_view_mode'
  
  const getStoredMode = (): ViewMode => {
    if (typeof window === 'undefined') return defaultMode
    const stored = localStorage.getItem(storageKey)
    if (stored && ['standard', 'audit', 'business'].includes(stored)) {
      return stored as ViewMode
    }
    return defaultMode
  }
  
  const setStoredMode = (mode: ViewMode) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, mode)
    }
  }
  
  return { getStoredMode, setStoredMode }
}
