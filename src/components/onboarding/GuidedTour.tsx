/**
 * GuidedTour — Simplified 4-step interactive tour (competitor-aligned)
 * Down from 8 steps to 4 essential steps per AutoDS/DSers best practices
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, ArrowRight, ArrowLeft, Package, ShoppingCart, 
  BarChart3, Sparkles, Rocket, CheckCircle2, Store
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  action?: { label: string; route: string }
  tip?: string
}

const TOUR_STEPS_BASE: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur ShopOpti+ !',
    description: 'Votre copilote IA pour le e-commerce. Découvrez les 3 fonctionnalités clés en 1 minute.',
    icon: Rocket,
    tip: 'Naviguez avec les flèches ← → ou Échap pour fermer'
  },
  {
    id: 'store',
    title: 'Connectez & importez',
    description: 'Connectez Shopify en 1 clic, puis importez vos produits depuis 99+ fournisseurs ou par CSV.',
    icon: Store,
    action: { label: 'Connecter une boutique', route: '/stores-channels' },
    tip: 'La synchronisation est bidirectionnelle et en temps réel'
  },
  {
    id: 'analytics',
    title: 'Pilotez vos performances',
    description: 'KPIs en temps réel, marges, tendances et alertes automatiques pour ne rien rater.',
    icon: BarChart3,
    action: { label: 'Voir le dashboard', route: '/' },
    tip: 'Les widgets sont personnalisables par glisser-déposer'
  },
  {
    id: 'ai',
    title: 'Automatisez avec l\'IA',
    description: 'L\'IA optimise vos titres, descriptions et prix. Créez des workflows d\'automatisation en quelques clics.',
    icon: Sparkles,
    action: { label: 'Découvrir l\'IA', route: '/ai-hub' },
    tip: 'Économisez jusqu\'à 20h par semaine'
  }
]

// Personalized tips by business type
const BUSINESS_TYPE_TIPS: Record<string, Partial<Record<string, string>>> = {
  dropshipping: {
    store: 'Pour le dropshipping, importez directement via URL AliExpress',
    ai: 'L\'IA optimise vos fiches pour maximiser les conversions',
  },
  ecommerce: {
    store: 'Importez votre catalogue existant via CSV pour gagner du temps',
    analytics: 'Suivez vos marges brutes et nettes en temps réel',
  },
  marketplace: {
    store: 'Connectez plusieurs boutiques pour centraliser la gestion',
    analytics: 'Comparez les performances par canal de vente',
  },
}

function getPersonalizedSteps(businessType?: string): TourStep[] {
  if (!businessType || !BUSINESS_TYPE_TIPS[businessType]) return TOUR_STEPS_BASE
  const tips = BUSINESS_TYPE_TIPS[businessType]
  return TOUR_STEPS_BASE.map(step => ({
    ...step,
    tip: tips[step.id] || step.tip,
  }))
}

const STORAGE_KEY = 'shopopti_tour_completed'
const STORAGE_DISMISSED_KEY = 'shopopti_tour_dismissed'

export function GuidedTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  const businessType = localStorage.getItem('shopopti_business_type') || undefined
  const TOUR_STEPS = getPersonalizedSteps(businessType)

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    const dismissed = localStorage.getItem(STORAGE_DISMISSED_KEY)
    if (!completed && !dismissed) {
      const timer = setTimeout(() => setIsActive(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }, [currentStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsActive(false)
  }, [])

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_DISMISSED_KEY, 'true')
    setIsActive(false)
  }, [])

  const handleAction = useCallback((route: string) => {
    handleComplete()
    navigate(route)
  }, [navigate, handleComplete])

  useEffect(() => {
    if (!isActive) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActive, handleNext, handlePrev, handleDismiss])

  if (!isActive) return null

  const step = TOUR_STEPS[currentStep]
  const Icon = step.icon
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Tour card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
        role="dialog"
        aria-modal="true"
        aria-label="Visite guidée"
      >
        <Card className="shadow-2xl border-primary/20 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div 
              className="h-full bg-primary" 
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1 text-[10px] px-1.5 py-0">
                    {currentStep + 1} / {TOUR_STEPS.length}
                  </Badge>
                  <h3 className="font-bold text-base leading-tight text-foreground">{step.title}</h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0 text-foreground/40"
                aria-label="Fermer la visite guidée"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <p className="text-foreground/60 text-sm mb-3 leading-relaxed">
              {step.description}
            </p>

            {/* Tip */}
            {step.tip && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-primary font-medium">{step.tip}</p>
              </div>
            )}

            {/* Action button */}
            {step.action && (
              <Button
                variant="outline"
                size="sm"
                className="mb-3 w-full border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => handleAction(step.action!.route)}
              >
                {step.action.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Précédent
              </Button>

              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep ? 'w-5 bg-primary' : 'w-1.5 bg-foreground/20 hover:bg-foreground/30'
                    }`}
                    aria-label={`Étape ${i + 1}`}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Terminer
                  </>
                ) : (
                  <>
                    Suivant
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

/** Hook to restart the tour programmatically */
export function useGuidedTour() {
  const restart = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_DISMISSED_KEY)
    window.location.reload()
  }
  return { restart }
}
