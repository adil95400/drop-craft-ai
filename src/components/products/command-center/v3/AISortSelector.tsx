/**
 * Sélecteur de tri IA V3 - Sprint 1
 * IA comme moteur de décision par défaut
 * Badge "Recommandé" sur tri IA, autres tris visuellement secondaires
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
  Check,
  Sparkles,
  ChevronDown
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

const AI_MODES: AISortMode[] = ['ai_priority', 'risk_first', 'opportunity_first']
const CLASSIC_MODES: AISortMode[] = ['name', 'price', 'stock', 'margin', 'updated']

export function AISortSelector({
  currentMode,
  ascending,
  onModeChange,
  onDirectionChange,
  isAIDefault = true,
  className
}: AISortSelectorProps) {
  const [open, setOpen] = useState(false)
  
  const isAIMode = AI_MODES.includes(currentMode)
  const CurrentIcon = SORT_ICONS[currentMode]
  const currentLabel = AI_SORT_MODE_LABELS[currentMode]
  
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'gap-2 h-9 pr-2 transition-all duration-200',
              isAIMode 
                ? 'border-primary/60 bg-primary/5 hover:bg-primary/10 hover:border-primary' 
                : 'border-border/50 hover:border-border'
            )}
          >
            {isAIMode ? (
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, repeatDelay: 3 }}
                className="relative"
              >
                <CurrentIcon className="h-4 w-4 text-primary" />
                {/* Glow effect for AI modes */}
                <div className="absolute inset-0 blur-sm bg-primary/20 rounded-full" />
              </motion.div>
            ) : (
              <CurrentIcon className="h-4 w-4 text-muted-foreground" />
            )}
            
            <span className="hidden sm:inline text-xs font-medium">
              {currentLabel.label}
            </span>
            
            {isAIMode && (
              <Badge 
                variant="secondary" 
                className="ml-0.5 h-5 px-1.5 text-[10px] font-semibold bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-0 flex items-center gap-1"
              >
                <Sparkles className="h-2.5 w-2.5" />
                IA
              </Badge>
            )}
            
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          {/* AI Modes Section - Prominent */}
          <DropdownMenuLabel className="flex items-center gap-2 text-primary">
            <Brain className="h-4 w-4" />
            <span className="font-semibold">Tri intelligent</span>
            <Badge 
              variant="outline" 
              className="ml-auto text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30 font-medium"
            >
              Recommandé
            </Badge>
          </DropdownMenuLabel>
          
          <DropdownMenuGroup className="py-1">
            {AI_MODES.map(mode => {
              const Icon = SORT_ICONS[mode]
              const label = AI_SORT_MODE_LABELS[mode]
              const isActive = currentMode === mode
              const isDefault = mode === 'ai_priority'
              
              return (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    'gap-3 cursor-pointer py-2.5 px-3 mx-1 rounded-lg transition-all',
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                    isActive 
                      ? 'bg-primary/20' 
                      : 'bg-muted/50'
                  )}>
                    <Icon className={cn(
                      'h-4 w-4',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isActive && 'text-primary'
                      )}>
                        {label.label}
                      </p>
                      {isDefault && !isActive && (
                        <Badge 
                          variant="outline" 
                          className="text-[8px] px-1 py-0 h-3.5 text-muted-foreground border-muted-foreground/30"
                        >
                          défaut
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {label.description}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    </motion.div>
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator className="my-2" />
          
          {/* Classic Modes Section - Secondary */}
          <DropdownMenuLabel className="text-[10px] text-muted-foreground/70 uppercase tracking-wider py-1 flex items-center gap-2">
            <ArrowUpDown className="h-3 w-3" />
            Tri classique
          </DropdownMenuLabel>
          
          <DropdownMenuGroup className="py-1 opacity-80 hover:opacity-100 transition-opacity">
            {CLASSIC_MODES.map(mode => {
              const Icon = SORT_ICONS[mode]
              const label = AI_SORT_MODE_LABELS[mode]
              const isActive = currentMode === mode
              
              return (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    'gap-2 cursor-pointer py-2 px-3 mx-1 rounded-md',
                    isActive 
                      ? 'bg-accent text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className={cn(
                    'h-3.5 w-3.5',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )} />
                  <span className="flex-1 text-sm">{label.label}</span>
                  {isActive && <Check className="h-3.5 w-3.5" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuGroup>
          
          {/* Hint for AI recommendation */}
          {!isAIMode && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <div className="px-3 py-2 mx-1 mb-1 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-[11px] text-muted-foreground flex items-start gap-2">
                  <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-primary">Conseil :</strong> Le tri IA optimise l'ordre 
                    selon l'urgence business et l'impact potentiel.
                  </span>
                </p>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Direction toggle - more subtle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-foreground"
        onClick={() => onDirectionChange(!ascending)}
        title={ascending ? 'Ordre croissant' : 'Ordre décroissant'}
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
