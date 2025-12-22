import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { 
  HelpCircle, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Lightbulb,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TourStep {
  id: string
  target: string // CSS selector
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: string
  route?: string
}

interface ContextualTooltipsContextType {
  showTooltips: boolean
  setShowTooltips: (show: boolean) => void
  currentTour: TourStep[] | null
  startTour: (steps: TourStep[]) => void
  endTour: () => void
  currentStepIndex: number
  nextStep: () => void
  prevStep: () => void
  markTooltipSeen: (id: string) => void
  hasSeenTooltip: (id: string) => boolean
}

const ContextualTooltipsContext = createContext<ContextualTooltipsContextType | null>(null)

export function useContextualTooltips() {
  const context = useContext(ContextualTooltipsContext)
  if (!context) {
    throw new Error('useContextualTooltips must be used within ContextualTooltipsProvider')
  }
  return context
}

export function ContextualTooltipsProvider({ children }: { children: React.ReactNode }) {
  const [showTooltips, setShowTooltips] = useState(true)
  const [currentTour, setCurrentTour] = useState<TourStep[] | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [seenTooltips, setSeenTooltips] = useState<Set<string>>(new Set())

  // Load seen tooltips from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('seen-tooltips')
    if (saved) {
      setSeenTooltips(new Set(JSON.parse(saved)))
    }
  }, [])

  const markTooltipSeen = useCallback((id: string) => {
    setSeenTooltips(prev => {
      const next = new Set(prev).add(id)
      localStorage.setItem('seen-tooltips', JSON.stringify([...next]))
      return next
    })
  }, [])

  const hasSeenTooltip = useCallback((id: string) => {
    return seenTooltips.has(id)
  }, [seenTooltips])

  const startTour = useCallback((steps: TourStep[]) => {
    setCurrentTour(steps)
    setCurrentStepIndex(0)
  }, [])

  const endTour = useCallback(() => {
    if (currentTour) {
      currentTour.forEach(step => markTooltipSeen(step.id))
    }
    setCurrentTour(null)
    setCurrentStepIndex(0)
  }, [currentTour, markTooltipSeen])

  const nextStep = useCallback(() => {
    if (currentTour && currentStepIndex < currentTour.length - 1) {
      markTooltipSeen(currentTour[currentStepIndex].id)
      setCurrentStepIndex(prev => prev + 1)
    } else {
      endTour()
    }
  }, [currentTour, currentStepIndex, endTour, markTooltipSeen])

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [currentStepIndex])

  return (
    <ContextualTooltipsContext.Provider value={{
      showTooltips,
      setShowTooltips,
      currentTour,
      startTour,
      endTour,
      currentStepIndex,
      nextStep,
      prevStep,
      markTooltipSeen,
      hasSeenTooltip
    }}>
      <TooltipProvider>
        {children}
        {currentTour && <TourOverlay />}
      </TooltipProvider>
    </ContextualTooltipsContext.Provider>
  )
}

// Tour overlay component
function TourOverlay() {
  const { currentTour, currentStepIndex, nextStep, prevStep, endTour } = useContextualTooltips()
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const currentStep = currentTour?.[currentStepIndex]

  useEffect(() => {
    if (!currentStep) return

    // Find target element
    const element = document.querySelector(currentStep.target) as HTMLElement
    if (element) {
      setTargetElement(element)
      
      // Calculate position
      const rect = element.getBoundingClientRect()
      const pos = currentStep.position || 'bottom'
      
      let top = 0, left = 0
      switch (pos) {
        case 'top':
          top = rect.top - 10
          left = rect.left + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + 10
          left = rect.left + rect.width / 2
          break
        case 'left':
          top = rect.top + rect.height / 2
          left = rect.left - 10
          break
        case 'right':
          top = rect.top + rect.height / 2
          left = rect.right + 10
          break
      }
      
      setPosition({ top, left })

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Highlight element
      element.style.position = 'relative'
      element.style.zIndex = '1001'
      element.style.boxShadow = '0 0 0 4px hsl(var(--primary))'
      element.style.borderRadius = '8px'

      return () => {
        element.style.position = ''
        element.style.zIndex = ''
        element.style.boxShadow = ''
        element.style.borderRadius = ''
      }
    }
  }, [currentStep])

  if (!currentStep) return null

  const totalSteps = currentTour?.length || 0
  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === totalSteps - 1

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[1000]"
        onClick={endTour}
      />

      {/* Tooltip card */}
      <Card 
        className="fixed z-[1002] max-w-sm shadow-2xl animate-in fade-in slide-in-from-bottom-2"
        style={{
          top: position.top,
          left: position.left,
          transform: 'translateX(-50%)'
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">{currentStep.title}</h4>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={endTour}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {currentStep.content}
          </p>

          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {currentStepIndex + 1} / {totalSteps}
            </Badge>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={prevStep}
                disabled={isFirst}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                size="sm"
                onClick={nextStep}
              >
                {isLast ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Terminer
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// Contextual help tooltip component
interface ContextualHelpProps {
  id: string
  title: string
  content: string
  children?: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  showOnce?: boolean
  className?: string
}

export function ContextualHelp({
  id,
  title,
  content,
  children,
  side = 'top',
  showOnce = true,
  className
}: ContextualHelpProps) {
  const { showTooltips, hasSeenTooltip, markTooltipSeen } = useContextualTooltips()
  const [isOpen, setIsOpen] = useState(false)

  const shouldShow = showTooltips && (!showOnce || !hasSeenTooltip(id))

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open && showOnce) {
      markTooltipSeen(id)
    }
  }

  if (!shouldShow && !children) return null

  return (
    <Tooltip open={isOpen} onOpenChange={handleOpenChange}>
      <TooltipTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-5 w-5 rounded-full", className)}
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{content}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

// Feature highlight badge
interface FeatureHighlightProps {
  id: string
  label: string
  description: string
  isNew?: boolean
  children: React.ReactNode
}

export function FeatureHighlight({
  id,
  label,
  description,
  isNew = true,
  children
}: FeatureHighlightProps) {
  const { hasSeenTooltip, markTooltipSeen } = useContextualTooltips()
  const [showBadge, setShowBadge] = useState(!hasSeenTooltip(id))

  const handleClick = () => {
    markTooltipSeen(id)
    setShowBadge(false)
  }

  return (
    <div className="relative inline-block" onClick={handleClick}>
      {children}
      {showBadge && isNew && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className="absolute -top-2 -right-2 h-5 px-1.5 text-[10px] bg-primary animate-pulse cursor-pointer"
            >
              Nouveau
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

// Pre-defined tours
export const DASHBOARD_TOUR: TourStep[] = [
  {
    id: 'dashboard-stats',
    target: '[data-tour="stats"]',
    title: 'Vue d\'ensemble',
    content: 'Consultez vos métriques clés : ventes, produits, commandes en un coup d\'œil.',
    position: 'bottom'
  },
  {
    id: 'dashboard-products',
    target: '[data-tour="products"]',
    title: 'Gestion des produits',
    content: 'Accédez à tous vos produits, importez-en de nouveaux et optimisez-les avec l\'IA.',
    position: 'right'
  },
  {
    id: 'dashboard-analytics',
    target: '[data-tour="analytics"]',
    title: 'Analytics avancés',
    content: 'Analysez les performances de votre boutique avec des graphiques détaillés.',
    position: 'left'
  },
  {
    id: 'dashboard-ai',
    target: '[data-tour="ai"]',
    title: 'Fonctionnalités IA',
    content: 'Utilisez l\'intelligence artificielle pour optimiser vos descriptions, prix et SEO.',
    position: 'bottom'
  }
]

export const PRODUCTS_TOUR: TourStep[] = [
  {
    id: 'products-filters',
    target: '[data-tour="filters"]',
    title: 'Filtres avancés',
    content: 'Filtrez vos produits par catégorie, statut, stock et plus encore.',
    position: 'bottom'
  },
  {
    id: 'products-bulk',
    target: '[data-tour="bulk-actions"]',
    title: 'Actions en masse',
    content: 'Sélectionnez plusieurs produits pour les modifier, exporter ou supprimer.',
    position: 'bottom'
  },
  {
    id: 'products-import',
    target: '[data-tour="import"]',
    title: 'Importer des produits',
    content: 'Importez des produits depuis vos fournisseurs ou par fichier CSV.',
    position: 'left'
  }
]

export const IMPORT_TOUR: TourStep[] = [
  {
    id: 'import-source',
    target: '[data-tour="source"]',
    title: 'Choisir une source',
    content: 'Sélectionnez BigBuy, AliExpress, ou importez par CSV/URL.',
    position: 'bottom'
  },
  {
    id: 'import-mapping',
    target: '[data-tour="mapping"]',
    title: 'Mapping des champs',
    content: 'Configurez comment les données du fournisseur correspondent à vos champs.',
    position: 'right'
  },
  {
    id: 'import-preview',
    target: '[data-tour="preview"]',
    title: 'Prévisualisation',
    content: 'Vérifiez les produits avant l\'import et corrigez les erreurs.',
    position: 'top'
  }
]
