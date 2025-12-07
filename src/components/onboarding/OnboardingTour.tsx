/**
 * Tour d'onboarding interactif pour les nouveaux utilisateurs
 * Utilise des tooltips guidés pour présenter les fonctionnalités clés
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  X, ArrowRight, ArrowLeft, Sparkles, Package, Store, 
  BarChart3, Upload, Settings, CheckCircle2, Crown,
  Zap, Users, ShoppingCart, Bot
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface TourStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  targetSelector?: string
  targetRoute?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: {
    label: string
    route?: string
  }
  highlight?: boolean
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur ShopOpti+ !',
    description: 'Nous allons vous guider à travers les fonctionnalités principales pour vous aider à démarrer rapidement.',
    icon: Crown,
    position: 'center',
    highlight: true
  },
  {
    id: 'dashboard',
    title: 'Votre tableau de bord',
    description: 'Accédez à toutes vos statistiques et indicateurs clés depuis le dashboard. Suivez vos ventes, commandes et performances en temps réel.',
    icon: BarChart3,
    targetRoute: '/dashboard',
    position: 'center',
    action: { label: 'Voir le dashboard', route: '/dashboard' }
  },
  {
    id: 'products',
    title: 'Gestion des produits',
    description: 'Importez, créez et gérez vos produits. Utilisez l\'IA pour optimiser vos descriptions et prix automatiquement.',
    icon: Package,
    targetRoute: '/products',
    position: 'center',
    action: { label: 'Voir les produits', route: '/products' }
  },
  {
    id: 'import',
    title: 'Import de produits',
    description: 'Importez des milliers de produits depuis plus de 99 fournisseurs en quelques clics. AliExpress, BigBuy, Spocket et plus.',
    icon: Upload,
    targetRoute: '/import',
    position: 'center',
    action: { label: 'Importer maintenant', route: '/import' }
  },
  {
    id: 'suppliers',
    title: 'Connectez vos fournisseurs',
    description: 'Accédez à notre marketplace de fournisseurs et connectez-les pour synchroniser automatiquement les stocks et prix.',
    icon: Store,
    targetRoute: '/suppliers',
    position: 'center',
    action: { label: 'Voir les fournisseurs', route: '/suppliers' }
  },
  {
    id: 'ai-assistant',
    title: 'Assistant IA',
    description: 'Notre assistant IA vous aide à optimiser vos produits, rédiger des descriptions et prendre des décisions éclairées.',
    icon: Bot,
    targetRoute: '/ai-assistant',
    position: 'center',
    action: { label: 'Essayer l\'IA', route: '/ai-assistant' }
  },
  {
    id: 'complete',
    title: 'Vous êtes prêt !',
    description: 'Vous connaissez maintenant les bases. Explorez librement la plateforme ou consultez notre Academy pour des guides détaillés.',
    icon: CheckCircle2,
    position: 'center',
    action: { label: 'Commencer', route: '/dashboard' }
  }
]

const ONBOARDING_STORAGE_KEY = 'shopopti_onboarding_completed'

export function OnboardingTour() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (user && !hasCompleted) {
      // Delay to let the page load
      const timer = setTimeout(() => {
        setIsActive(true)
        setIsVisible(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [user])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    setIsVisible(false)
    setTimeout(() => setIsActive(false), 300)
  }

  const handleAction = () => {
    const step = tourSteps[currentStep]
    if (step.action?.route) {
      navigate(step.action.route)
    }
    handleNext()
  }

  if (!isActive) return null

  const step = tourSteps[currentStep]
  const Icon = step.icon
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg mx-4"
          >
            <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 h-8 w-8"
                onClick={handleSkip}
              >
                <X className="h-4 w-4" />
              </Button>

              <CardHeader className="text-center pb-4">
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Étape {currentStep + 1} / {tourSteps.length}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-muted-foreground"
                      onClick={handleSkip}
                    >
                      Passer le tour
                    </Button>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className={cn(
                    "p-4 rounded-2xl",
                    step.highlight 
                      ? "bg-gradient-to-br from-primary to-primary/80" 
                      : "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "h-10 w-10",
                      step.highlight ? "text-primary-foreground" : "text-primary"
                    )} />
                  </div>
                </div>

                <CardTitle className="text-xl sm:text-2xl">{step.title}</CardTitle>
                <CardDescription className="text-base mt-2 leading-relaxed">
                  {step.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2">
                {/* Quick tips for specific steps */}
                {step.id === 'products' && (
                  <div className="mb-6 p-4 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Astuce IA
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Utilisez l'optimisation IA pour améliorer automatiquement vos titres et descriptions produits.
                    </p>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={handlePrev}
                      className="flex-shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Précédent
                    </Button>
                  )}
                  
                  <div className="flex-1" />
                  
                  {step.action ? (
                    <Button onClick={handleAction} className="gap-2">
                      {step.action.label}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleNext} className="gap-2">
                      {currentStep === tourSteps.length - 1 ? 'Terminer' : 'Suivant'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// Hook to manually trigger onboarding
export function useOnboarding() {
  const restart = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY)
    window.location.reload()
  }

  const isCompleted = () => {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
  }

  return { restart, isCompleted }
}
