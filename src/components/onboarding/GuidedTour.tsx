/**
 * GuidedTour — Spotlight-based interactive tour for new users
 * Shows contextual tooltips pointing to key UI elements on the dashboard
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  X, ArrowRight, ArrowLeft, Package, ShoppingCart, 
  BarChart3, Zap, Sparkles, Rocket, CheckCircle2 
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

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur ShopOpti+ ! 🎉',
    description: 'Nous allons vous guider à travers les fonctionnalités clés de la plateforme pour vous aider à démarrer rapidement.',
    icon: Rocket,
    tip: 'Ce tour ne prend que 2 minutes'
  },
  {
    id: 'products',
    title: 'Importez vos premiers produits',
    description: 'Importez depuis AliExpress, BigBuy, Spocket et 99+ fournisseurs en quelques clics. Vous pouvez aussi importer via CSV ou créer manuellement.',
    icon: Package,
    action: { label: 'Importer un produit', route: '/import' },
    tip: 'Astuce : utilisez l\'import par URL pour le plus rapide'
  },
  {
    id: 'orders',
    title: 'Gérez vos commandes',
    description: 'Suivez toutes vos commandes en temps réel, automatisez le traitement et synchronisez le tracking avec vos boutiques.',
    icon: ShoppingCart,
    action: { label: 'Voir les commandes', route: '/orders' },
    tip: 'Les commandes se synchronisent automatiquement'
  },
  {
    id: 'analytics',
    title: 'Analysez vos performances',
    description: 'Tableaux de bord en temps réel avec KPIs, tendances de ventes, marges et insights IA pour optimiser votre business.',
    icon: BarChart3,
    action: { label: 'Voir les analytics', route: '/analytics' },
    tip: 'Les widgets sont personnalisables par glisser-déposer'
  },
  {
    id: 'ai',
    title: 'Exploitez l\'IA intégrée',
    description: 'Optimisez vos titres, descriptions et prix avec l\'intelligence artificielle. Générez du contenu SEO automatiquement.',
    icon: Sparkles,
    action: { label: 'Découvrir l\'IA', route: '/ai-hub' },
    tip: 'L\'IA analyse votre catalogue et suggère des améliorations'
  },
  {
    id: 'automation',
    title: 'Automatisez vos tâches',
    description: 'Créez des workflows automatiques pour les réapprovisionnements, les alertes de prix et la synchronisation multi-plateformes.',
    icon: Zap,
    action: { label: 'Créer une automation', route: '/automations' },
    tip: 'Économisez jusqu\'à 20h par semaine avec l\'automatisation'
  }
]

const STORAGE_KEY = 'shopopti_tour_completed'
const STORAGE_DISMISSED_KEY = 'shopopti_tour_dismissed'

export function GuidedTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    const dismissed = localStorage.getItem(STORAGE_DISMISSED_KEY)
    if (!completed && !dismissed) {
      // Show tour after a short delay for the dashboard to load
      const timer = setTimeout(() => setIsActive(true), 1500)
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

  // Keyboard navigation
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
      {/* Backdrop overlay */}
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
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
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

          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1 text-xs">
                    {currentStep + 1} / {TOUR_STEPS.length}
                  </Badge>
                  <h3 className="font-bold text-lg leading-tight">{step.title}</h3>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8 w-8 p-0 text-muted-foreground"
                aria-label="Fermer la visite guidée"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {step.description}
            </p>

            {/* Tip */}
            {step.tip && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 mb-4">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-primary font-medium">{step.tip}</p>
              </div>
            )}

            {/* Action button */}
            {step.action && (
              <Button
                variant="outline"
                size="sm"
                className="mb-4 w-full border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => handleAction(step.action!.route)}
              >
                {step.action.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>

              <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentStep ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Étape ${i + 1}`}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Terminer
                  </>
                ) : (
                  <>
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-1" />
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
