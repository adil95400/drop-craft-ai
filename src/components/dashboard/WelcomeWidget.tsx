/**
 * WelcomeWidget - Widget d'onboarding pour les nouveaux utilisateurs
 * Affiche une checklist de configuration avec progression visuelle
 */
import { memo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CheckCircle2, Circle, Sparkles, Package, Store, 
  Upload, Settings, Users, ArrowRight, Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  route: string
  completed: boolean
}

// Hook pour gérer la progression d'onboarding (localStorage)
function useOnboardingProgress() {
  const { profile } = useUnifiedAuth()
  const storageKey = `onboarding-progress-${profile?.id || 'guest'}`
  
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(`${storageKey}-dismissed`) === 'true'
    } catch {
      return false
    }
  })

  const completeStep = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      const updated = [...prev, stepId]
      localStorage.setItem(storageKey, JSON.stringify(updated))
      return updated
    })
  }, [storageKey])

  const dismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(`${storageKey}-dismissed`, 'true')
  }, [storageKey])

  const reset = useCallback(() => {
    setCompletedSteps([])
    setDismissed(false)
    localStorage.removeItem(storageKey)
    localStorage.removeItem(`${storageKey}-dismissed`)
  }, [storageKey])

  return { completedSteps, dismissed, completeStep, dismiss, reset }
}

export const WelcomeWidget = memo(() => {
  const navigate = useNavigate()
  const { profile } = useUnifiedAuth()
  const prefersReducedMotion = useReducedMotion()
  const { completedSteps, dismissed, completeStep, dismiss } = useOnboardingProgress()
  const [hoveredStep, setHoveredStep] = useState<string | null>(null)

  const steps: OnboardingStep[] = [
    {
      id: 'products',
      title: 'Ajouter des produits',
      description: 'Importez ou créez vos premiers produits',
      icon: Package,
      route: '/products',
      completed: completedSteps.includes('products'),
    },
    {
      id: 'store',
      title: 'Connecter une boutique',
      description: 'Liez votre boutique Shopify ou WooCommerce',
      icon: Store,
      route: '/stores-channels',
      completed: completedSteps.includes('store'),
    },
    {
      id: 'import',
      title: 'Importer des données',
      description: 'Importez vos données CSV, Excel ou API',
      icon: Upload,
      route: '/import',
      completed: completedSteps.includes('import'),
    },
    {
      id: 'settings',
      title: 'Configurer votre compte',
      description: 'Personnalisez vos préférences et notifications',
      icon: Settings,
      route: '/settings',
      completed: completedSteps.includes('settings'),
    },
    {
      id: 'team',
      title: 'Inviter votre équipe',
      description: 'Ajoutez des collaborateurs à votre espace',
      icon: Users,
      route: '/settings/team',
      completed: completedSteps.includes('team'),
    },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const progressPercent = (completedCount / steps.length) * 100
  const isAllCompleted = completedCount === steps.length

  // Ne pas afficher si dismissed ou tout complété
  if (dismissed || isAllCompleted) return null

  const handleStepClick = (step: OnboardingStep) => {
    if (!step.completed) {
      completeStep(step.id)
    }
    navigate(step.route)
  }

  const motionProps = prefersReducedMotion 
    ? {} 
    : { 
        initial: { opacity: 0, y: 20 }, 
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
      }

  return (
    <AnimatePresence>
      <motion.div {...motionProps}>
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 shadow-lg">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-violet-500/10 opacity-50" aria-hidden="true" />
          
          <CardHeader className="relative pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.05, rotate: 5 }}
                  aria-hidden="true"
                >
                  <Rocket className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Bienvenue, {profile?.full_name?.split(' ')[0] || 'Utilisateur'} !
                    <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Complétez ces étapes pour démarrer
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  {completedCount}/{steps.length}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={dismiss}
                  className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Fermer le widget de bienvenue"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4 space-y-2">
              <Progress value={progressPercent} className="h-2 bg-muted/50" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(progressPercent)}% complété
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="relative pt-0">
            <div className="space-y-2" role="list" aria-label="Étapes d'onboarding">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isHovered = hoveredStep === step.id
                
                return (
                  <motion.button
                    key={step.id}
                    onClick={() => handleStepClick(step)}
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      step.completed 
                        ? "bg-emerald-500/10 border border-emerald-500/20" 
                        : "hover:bg-muted/50 border border-transparent hover:border-border/50"
                    )}
                    whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                    initial={prefersReducedMotion ? undefined : { opacity: 0, x: -10 }}
                    animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                    transition={prefersReducedMotion ? undefined : { delay: index * 0.05 }}
                    role="listitem"
                    aria-label={`${step.title} - ${step.completed ? 'Complété' : 'À faire'}`}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-all",
                      step.completed 
                        ? "bg-emerald-500/20" 
                        : "bg-muted/50 group-hover:bg-primary/10"
                    )} aria-hidden="true">
                      <Icon className={cn(
                        "h-4 w-4 transition-colors",
                        step.completed ? "text-emerald-500" : "text-muted-foreground group-hover:text-primary"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        step.completed && "line-through text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                      ) : (
                        <>
                          <Circle className="h-5 w-5 text-muted-foreground/40" aria-hidden="true" />
                          <ArrowRight className={cn(
                            "h-4 w-4 transition-all",
                            isHovered ? "opacity-100 text-primary" : "opacity-0"
                          )} aria-hidden="true" />
                        </>
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
            
            {/* Skip link */}
            <div className="mt-4 text-center">
              <button 
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
              >
                Passer cette introduction
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
})
WelcomeWidget.displayName = 'WelcomeWidget'
