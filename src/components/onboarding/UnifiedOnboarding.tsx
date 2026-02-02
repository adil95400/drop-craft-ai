/**
 * UnifiedOnboarding - Système d'onboarding unifié
 * Remplace WelcomeWidget, OnboardingChecklist, InteractiveOnboarding
 * 
 * Caractéristiques:
 * - 3 étapes maximum (pas 5+)
 * - Persistance en localStorage (compatible avec future BDD)
 * - Adapté au contexte (dashboard vs modal)
 * - Mode compact (inline) ou modal (premier login)
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  X, CheckCircle2, Circle, Sparkles, Package, Store, 
  Upload, ArrowRight, Rocket, Zap, Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { supabase } from '@/integrations/supabase/client'

// Types
interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  route: string
  checkCompleted: () => Promise<boolean>
}

interface UnifiedOnboardingState {
  completedSteps: string[]
  dismissed: boolean
  modalShown: boolean
  lastUpdated: string
}

// Clé de stockage unique
const ONBOARDING_STORAGE_KEY = 'shopopti_unified_onboarding'

// 3 étapes essentielles seulement
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'connect-store',
    title: 'Connecter une boutique',
    description: 'Liez Shopify, WooCommerce ou PrestaShop',
    icon: Store,
    route: '/stores-channels',
    checkCompleted: async () => {
      const { count } = await supabase
        .from('integrations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      return (count || 0) > 0
    }
  },
  {
    id: 'import-products',
    title: 'Importer des produits',
    description: 'Importez via URL, fichier ou fournisseur',
    icon: Upload,
    route: '/import',
    checkCompleted: async () => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
      return (count || 0) > 0
    }
  },
  {
    id: 'explore-catalog',
    title: 'Explorer le catalogue',
    description: 'Découvrez vos produits et optimisations IA',
    icon: Package,
    route: '/products',
    checkCompleted: async () => {
      // Considéré comme complété si l'utilisateur a visité /products
      return false // Toujours montrer pour encourager l'exploration
    }
  }
]

// Hook pour gérer l'état d'onboarding
export function useUnifiedOnboarding() {
  const { user, profile } = useUnifiedAuth()
  const userId = user?.id || profile?.id || 'guest'
  
  const [state, setState] = useState<UnifiedOnboardingState>(() => {
    try {
      const stored = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}-${userId}`)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch {}
    return {
      completedSteps: [],
      dismissed: false,
      modalShown: false,
      lastUpdated: new Date().toISOString()
    }
  })

  // Persister en localStorage
  const persistState = useCallback((newState: UnifiedOnboardingState) => {
    try {
      localStorage.setItem(
        `${ONBOARDING_STORAGE_KEY}-${userId}`,
        JSON.stringify({ ...newState, lastUpdated: new Date().toISOString() })
      )
    } catch {}
    setState(newState)
  }, [userId])

  const completeStep = useCallback((stepId: string) => {
    if (!state.completedSteps.includes(stepId)) {
      persistState({
        ...state,
        completedSteps: [...state.completedSteps, stepId]
      })
    }
  }, [state, persistState])

  const dismiss = useCallback(() => {
    persistState({ ...state, dismissed: true })
  }, [state, persistState])

  const markModalShown = useCallback(() => {
    persistState({ ...state, modalShown: true })
  }, [state, persistState])

  const reset = useCallback(() => {
    persistState({
      completedSteps: [],
      dismissed: false,
      modalShown: false,
      lastUpdated: new Date().toISOString()
    })
  }, [persistState])

  // Vérifier automatiquement les étapes complétées
  useEffect(() => {
    const checkSteps = async () => {
      const newCompleted: string[] = []
      for (const step of ONBOARDING_STEPS) {
        if (await step.checkCompleted()) {
          newCompleted.push(step.id)
        }
      }
      if (newCompleted.length > 0 && 
          newCompleted.some(id => !state.completedSteps.includes(id))) {
        persistState({
          ...state,
          completedSteps: [...new Set([...state.completedSteps, ...newCompleted])]
        })
      }
    }
    if (user) {
      checkSteps()
    }
  }, [user])

  const progress = useMemo(() => ({
    completed: state.completedSteps.length,
    total: ONBOARDING_STEPS.length,
    percent: (state.completedSteps.length / ONBOARDING_STEPS.length) * 100,
    isComplete: state.completedSteps.length >= ONBOARDING_STEPS.length
  }), [state.completedSteps])

  return {
    state,
    steps: ONBOARDING_STEPS,
    progress,
    completeStep,
    dismiss,
    markModalShown,
    reset
  }
}

// Widget compact pour le dashboard
export function OnboardingWidget() {
  const navigate = useNavigate()
  const { profile } = useUnifiedAuth()
  const prefersReducedMotion = useReducedMotion()
  const { state, steps, progress, completeStep, dismiss } = useUnifiedOnboarding()
  const [hoveredStep, setHoveredStep] = useState<string | null>(null)

  // Ne pas afficher si dismissed ou tout complété
  if (state.dismissed || progress.isComplete) return null

  const handleStepClick = (step: OnboardingStep) => {
    completeStep(step.id)
    navigate(step.route)
  }

  const motionProps = prefersReducedMotion 
    ? {} 
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

  return (
    <motion.div {...motionProps}>
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-violet-500/10 opacity-50" aria-hidden="true" />
        
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                aria-hidden="true"
              >
                <Rocket className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Bienvenue{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} !
                  <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  3 étapes pour démarrer
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {progress.completed}/{progress.total}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={dismiss}
                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <Progress value={progress.percent} className="h-2 bg-muted/50" />
          </div>
        </CardHeader>
        
        <CardContent className="relative pt-0">
          <div className="space-y-2" role="list">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = state.completedSteps.includes(step.id)
              const isHovered = hoveredStep === step.id
              
              return (
                <motion.button
                  key={step.id}
                  onClick={() => handleStepClick(step)}
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    isCompleted 
                      ? "bg-emerald-500/10 border border-emerald-500/20" 
                      : "hover:bg-muted/50 border border-transparent hover:border-border/50"
                  )}
                  whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, x: -10 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={prefersReducedMotion ? undefined : { delay: index * 0.05 }}
                  role="listitem"
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-all",
                    isCompleted 
                      ? "bg-emerald-500/20" 
                      : "bg-muted/50 group-hover:bg-primary/10"
                  )} aria-hidden="true">
                    <Icon className={cn(
                      "h-4 w-4 transition-colors",
                      isCompleted ? "text-emerald-500" : "text-muted-foreground group-hover:text-primary"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm truncate",
                      isCompleted && "line-through text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <>
                        <Circle className="h-5 w-5 text-muted-foreground/40" />
                        <ArrowRight className={cn(
                          "h-4 w-4 transition-all",
                          isHovered ? "opacity-100 text-primary" : "opacity-0"
                        )} />
                      </>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
          
          <div className="mt-4 text-center">
            <button 
              onClick={dismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
            >
              Passer cette introduction
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Modal pour premier login (remplace InteractiveOnboarding)
export function OnboardingModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useUnifiedAuth()
  const prefersReducedMotion = useReducedMotion()
  const { state, steps, progress, markModalShown, dismiss } = useUnifiedOnboarding()
  const [currentStep, setCurrentStep] = useState(0)

  // Afficher seulement sur le dashboard, au premier login
  const shouldShow = !state.modalShown && 
                     !state.dismissed && 
                     location.pathname === '/'

  useEffect(() => {
    if (shouldShow) {
      // Marquer comme vu après 1 seconde
      const timer = setTimeout(() => markModalShown(), 1000)
      return () => clearTimeout(timer)
    }
  }, [shouldShow, markModalShown])

  if (!shouldShow) return null

  const handleGetStarted = () => {
    dismiss()
    navigate('/import')
  }

  const handleSkip = () => {
    dismiss()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={prefersReducedMotion ? {} : { scale: 0.9, opacity: 0 }}
          animate={prefersReducedMotion ? {} : { scale: 1, opacity: 1 }}
          className="w-full max-w-lg"
        >
          <Card className="relative overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="text-center pb-2 pt-8">
              <motion.div
                className="mx-auto mb-4 p-4 rounded-2xl bg-gradient-to-br from-primary to-violet-600 w-fit"
                animate={prefersReducedMotion ? {} : { 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <Rocket className="h-10 w-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold mb-2">
                Bienvenue sur ShopOpti{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} !
              </h2>
              
              <p className="text-muted-foreground">
                Votre plateforme e-commerce intelligente est prête.
              </p>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              {/* 3 features highlight */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-primary/5 rounded-xl">
                  <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium">IA Intégrée</p>
                </div>
                <div className="text-center p-3 bg-emerald-500/5 rounded-xl">
                  <Upload className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-medium">Import Facile</p>
                </div>
                <div className="text-center p-3 bg-violet-500/5 rounded-xl">
                  <Store className="h-6 w-6 text-violet-500 mx-auto mb-2" />
                  <p className="text-xs font-medium">Multi-Boutiques</p>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-primary to-violet-600 hover:opacity-90"
                  onClick={handleGetStarted}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Commencer maintenant
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Explorer par moi-même
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Export par défaut du widget
export default OnboardingWidget
