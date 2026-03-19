/**
 * UnifiedOnboarding — Système d'onboarding unifié v2
 * Fusionné: Widget + Modal + Questionnaire business type
 * 
 * Inspiré d'AutoDS/Spocket:
 * - Questionnaire initial (type de business)
 * - 3 étapes essentielles personnalisées
 * - Pas de modal séparé — tout intégré dans un seul flow
 * - Estimation de temps visible
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  X, CheckCircle2, Circle, Sparkles, Package, Store, 
  Upload, ArrowRight, Rocket, Zap, Play, ShoppingCart,
  Globe, TrendingUp, Clock, ChevronRight
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
  estimatedTime?: string
}

type BusinessType = 'dropshipping' | 'ecommerce' | 'marketplace' | null

interface UnifiedOnboardingState {
  completedSteps: string[]
  dismissed: boolean
  businessType: BusinessType
  lastUpdated: string
}

const ONBOARDING_STORAGE_KEY = 'shopopti_unified_onboarding_v2'

// Étapes personnalisées par type de business
const getStepsForBusinessType = (type: BusinessType): OnboardingStep[] => {
  const baseSteps: OnboardingStep[] = [
    {
      id: 'connect-store',
      title: type === 'dropshipping' ? 'Connecter votre boutique Shopify' : 'Connecter votre boutique',
      description: type === 'dropshipping' 
        ? 'Liez Shopify pour synchroniser produits, commandes et stock automatiquement'
        : 'Liez Shopify, WooCommerce ou PrestaShop en quelques clics',
      icon: Store,
      route: '/stores-channels',
      estimatedTime: '2 min',
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
      title: type === 'dropshipping' ? 'Importer depuis un fournisseur' : 'Ajouter vos produits',
      description: type === 'dropshipping'
        ? 'Importez depuis AliExpress, BigBuy ou Spocket en 1 clic'
        : 'Importez via CSV, URL ou créez manuellement',
      icon: Upload,
      route: '/import',
      estimatedTime: '3 min',
      checkCompleted: async () => {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
        return (count || 0) > 0
      }
    },
    {
      id: 'explore-catalog',
      title: type === 'marketplace' ? 'Lancer la synchronisation' : 'Explorer & optimiser avec l\'IA',
      description: type === 'marketplace'
        ? 'Synchronisez vos produits sur plusieurs canaux de vente'
        : 'Découvrez l\'optimisation IA de vos titres, prix et descriptions',
      icon: type === 'marketplace' ? Globe : Sparkles,
      route: type === 'marketplace' ? '/stores-channels' : '/products',
      estimatedTime: '1 min',
      checkCompleted: async () => false
    }
  ]

  return baseSteps
}

// Hook pour gérer l'état d'onboarding
export function useUnifiedOnboarding() {
  const { user, profile } = useUnifiedAuth()
  const userId = user?.id || profile?.id || 'guest'
  
  const [state, setState] = useState<UnifiedOnboardingState>(() => {
    try {
      const stored = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}-${userId}`)
      if (stored) return JSON.parse(stored)
    } catch {}
    return {
      completedSteps: [],
      dismissed: false,
      businessType: null,
      lastUpdated: new Date().toISOString()
    }
  })

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

  const setBusinessType = useCallback((type: BusinessType) => {
    persistState({ ...state, businessType: type })
    // Also store for GuidedTour personalization
    if (type) localStorage.setItem('shopopti_business_type', type)
  }, [state, persistState])

  const dismiss = useCallback(() => {
    persistState({ ...state, dismissed: true })
  }, [state, persistState])

  const reset = useCallback(() => {
    persistState({
      completedSteps: [],
      dismissed: false,
      businessType: null,
      lastUpdated: new Date().toISOString()
    })
  }, [persistState])

  const steps = useMemo(() => getStepsForBusinessType(state.businessType), [state.businessType])

  // Auto-check completed steps
  useEffect(() => {
    if (!user || !state.businessType) return
    const checkSteps = async () => {
      const newCompleted: string[] = []
      for (const step of steps) {
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
    checkSteps()
  }, [user, state.businessType])

  const progress = useMemo(() => ({
    completed: state.completedSteps.length,
    total: steps.length,
    percent: steps.length > 0 ? (state.completedSteps.length / steps.length) * 100 : 0,
    isComplete: steps.length > 0 && state.completedSteps.length >= steps.length
  }), [state.completedSteps, steps])

  return {
    state,
    steps,
    progress,
    completeStep,
    setBusinessType,
    dismiss,
    reset
  }
}

// Business type selector cards
const BUSINESS_TYPES = [
  {
    type: 'dropshipping' as BusinessType,
    label: 'Dropshipping',
    description: 'Vendre sans stock via fournisseurs',
    icon: ShoppingCart,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20 hover:border-primary/40',
  },
  {
    type: 'ecommerce' as BusinessType,
    label: 'E-commerce',
    description: 'Ma propre boutique en ligne',
    icon: Package,
    color: 'text-success',
    bg: 'bg-success/10 border-success/20 hover:border-success/40',
  },
  {
    type: 'marketplace' as BusinessType,
    label: 'Multi-canal',
    description: 'Vendre sur plusieurs plateformes',
    icon: Globe,
    color: 'text-info',
    bg: 'bg-info/10 border-info/20 hover:border-info/40',
  },
]

// Widget compact unifié pour le dashboard
export function OnboardingWidget() {
  const navigate = useNavigate()
  const { profile } = useUnifiedAuth()
  const prefersReducedMotion = useReducedMotion()
  const { state, steps, progress, completeStep, setBusinessType, dismiss } = useUnifiedOnboarding()

  if (state.dismissed || progress.isComplete) return null

  const handleStepClick = (step: OnboardingStep) => {
    completeStep(step.id)
    navigate(step.route)
  }

  const motionProps = prefersReducedMotion 
    ? {} 
    : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }

  const firstName = profile?.full_name?.split(' ')[0]

  // Phase 1: Business type questionnaire
  if (!state.businessType) {
    return (
      <motion.div {...motionProps}>
        <Card className="relative overflow-hidden border-primary/30 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-card to-transparent" aria-hidden="true" />
          
          <CardHeader className="relative pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary shadow-lg" aria-hidden="true">
                  <Rocket className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    Bienvenue{firstName ? `, ${firstName}` : ''} ! 🎉
                  </h3>
                  <p className="text-sm text-foreground/60">
                    Configurons votre espace en 2 minutes
                  </p>
                </div>
              </div>
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
          </CardHeader>
          
          <CardContent className="relative pt-2 pb-5">
            <p className="text-sm font-medium text-foreground mb-3">
              Quel est votre type d'activité ?
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BUSINESS_TYPES.map(({ type, label, description, icon: Icon, color, bg }) => (
                <motion.button
                  key={type}
                  onClick={() => setBusinessType(type)}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left group",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    bg
                  )}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                >
                  <div className={cn("p-2 rounded-lg", bg.split(' ')[0])} aria-hidden="true">
                    <Icon className={cn("h-5 w-5", color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">{label}</p>
                    <p className="text-xs text-foreground/55 truncate">{description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
            
            <div className="mt-3 flex items-center justify-center gap-1.5 text-foreground/40">
              <Clock className="h-3 w-3" />
              <span className="text-[11px]">Prend moins de 2 minutes</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Phase 2: Steps checklist (personalized)
  const totalTime = steps.reduce((acc, s) => {
    const mins = parseInt(s.estimatedTime || '0')
    return acc + mins
  }, 0)

  return (
    <motion.div {...motionProps}>
      <Card className="relative overflow-hidden border-primary/30 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-card to-transparent" aria-hidden="true" />
        
        <CardHeader className="relative pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary shadow-lg" aria-hidden="true">
                <Rocket className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                  Démarrage rapide
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    {progress.completed}/{progress.total}
                  </Badge>
                </h3>
                <div className="flex items-center gap-2 text-xs text-foreground/55">
                  <Clock className="h-3 w-3" />
                  <span>~{totalTime - (progress.completed * 2)} min restantes</span>
                  <span className="text-foreground/30">·</span>
                  <span className="capitalize">{state.businessType}</span>
                </div>
              </div>
            </div>
            
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
          
          <Progress value={progress.percent} className="mt-3 h-1.5 bg-muted" />
        </CardHeader>
        
        <CardContent className="relative pt-1 pb-4">
          <div className="space-y-1.5" role="list">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isCompleted = state.completedSteps.includes(step.id)
              const isNext = !isCompleted && !state.completedSteps.includes(steps[index - 1]?.id || '') && index === state.completedSteps.length
              
              return (
                <motion.button
                  key={step.id}
                  onClick={() => handleStepClick(step)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    isCompleted 
                      ? "bg-success/8 border border-success/20" 
                      : isNext
                      ? "bg-primary/5 border border-primary/25 shadow-sm"
                      : "hover:bg-muted/80 border border-border/30 hover:border-border/60"
                  )}
                  whileHover={prefersReducedMotion ? undefined : { x: 3 }}
                  initial={prefersReducedMotion ? undefined : { opacity: 0, x: -10 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={prefersReducedMotion ? undefined : { delay: index * 0.08 }}
                  role="listitem"
                >
                  {/* Step number / check */}
                  <div className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold flex-shrink-0 transition-all",
                    isCompleted 
                      ? "bg-success text-success-foreground" 
                      : isNext
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground/50 border border-border"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-semibold text-sm truncate",
                      isCompleted ? "text-foreground/50 line-through" : "text-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className={cn(
                      "text-xs truncate",
                      isCompleted ? "text-foreground/35" : "text-foreground/55"
                    )}>
                      {step.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!isCompleted && step.estimatedTime && (
                      <span className="text-[10px] text-foreground/40">{step.estimatedTime}</span>
                    )}
                    {isNext && (
                      <ChevronRight className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
          
          <div className="mt-3 text-center">
            <button 
              onClick={dismiss}
              className="text-xs text-foreground/40 hover:text-foreground transition-colors underline-offset-2 hover:underline"
            >
              Passer l'introduction
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Modal supprimée — tout est dans le widget maintenant
export function OnboardingModal() {
  // No-op: le questionnaire est intégré dans le widget
  return null
}

export default OnboardingWidget
