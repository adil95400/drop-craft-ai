/**
 * Sélecteur de tri IA V3
 * Permet de changer le mode de tri avec indication visuelle du tri IA
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ArrowUpDown, 
  Brain, 
  ArrowUp, 
  ArrowDown,
  AlertTriangle,
  TrendingUp,
  Type,
  DollarSign,
  Package,
  Percent,
  Clock,
  Check
} from 'lucide-react'
import { AISortMode, AI_SORT_MODE_LABELS } from './useAISortedProducts'

interface AISortSelectorProps {
  currentMode: AISortMode
  ascending: boolean
  onModeChange: (mode: AISortMode) => void
  onDirectionChange: (ascending: boolean) => void
  isAIDefault?: boolean
  className?: string
}

const SORT_ICONS: Record<AISortMode, React.ElementType> = {
  ai_priority: Brain,
  risk_first: AlertTriangle,
  opportunity_first: TrendingUp,
  name: Type,
  price: DollarSign,
  stock: Package,
  margin: Percent,
  updated: Clock
}

export function AISortSelector({
  currentMode,
  ascending,
  onModeChange,
  onDirectionChange,
  isAIDefault = true,
  className
}: AISortSelectorProps) {
  const [open, setOpen] = useState(false)
  
  const isAIMode = currentMode === 'ai_priority' || currentMode === 'risk_first' || currentMode === 'opportunity_first'
  const CurrentIcon = SORT_ICONS[currentMode]
  const currentLabel = AI_SORT_MODE_LABELS[currentMode]
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 h-9',
              isAIMode && 'border-primary/50 bg-primary/5'
            )}
          >
            {isAIMode ? (
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
              >
                <CurrentIcon className="h-4 w-4 text-primary" />
              </motion.div>
            ) : (
              <CurrentIcon className="h-4 w-4" />
            )}
            
            <span className="hidden sm:inline text-xs">
              {currentLabel.label}
            </span>
            
            {isAIMode && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-4 px-1 text-[9px] bg-primary/10 text-primary border-0"
              >
                IA
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Trier par
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Modes IA */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wide py-1">
              🧠 Tri intelligent
            </DropdownMenuLabel>
            
            {(['ai_priority', 'risk_first', 'opportunity_first'] as AISortMode[]).map(mode => {
              const Icon = SORT_ICONS[mode]
              const label = AI_SORT_MODE_LABELS[mode]
              const isActive = currentMode === mode
              
              return (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    'gap-2 cursor-pointer',
                    isActive && 'bg-primary/10'
                  )}
                >
                  <Icon className={cn(
                    'h-4 w-4',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{label.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {label.description}
                    </p>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          {/* Modes classiques */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wide py-1">
              Tri classique
            </DropdownMenuLabel>
            
            {(['name', 'price', 'stock', 'margin', 'updated'] as AISortMode[]).map(mode => {
              const Icon = SORT_ICONS[mode]
              const label = AI_SORT_MODE_LABELS[mode]
              const isActive = currentMode === mode
              
              return (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    'gap-2 cursor-pointer',
                    isActive && 'bg-accent'
                  )}
                >
                  <Icon className={cn(
                    'h-4 w-4',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )} />
                  <span className="flex-1 text-sm">{label.label}</span>
                  {isActive && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Direction toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => onDirectionChange(!ascending)}
      >
        {ascending ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
