import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Rocket, Package, Store, TrendingUp, Sparkles, 
  ChevronRight, ChevronLeft, Check, ArrowRight,
  Upload, ShoppingCart, BarChart3, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const ONBOARDING_KEY = 'shopopti-onboarding-completed'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  action: string
  route: string
  tips: string[]
}

const STEPS: OnboardingStep[] = [
  {
    id: 'connect-store',
    title: 'Connectez votre boutique',
    description: 'Liez votre boutique Shopify, WooCommerce ou autre pour synchroniser vos produits automatiquement.',
    icon: Store,
    color: 'from-blue-500 to-cyan-500',
    action: 'Connecter ma boutique',
    route: '/stores-channels',
    tips: ['Synchronisation bidirectionnelle', 'Multi-boutiques supporté', 'Import automatique du catalogue']
  },
  {
    id: 'import-products',
    title: 'Importez vos produits',
    description: 'Importez depuis AliExpress, CJ Dropshipping, BigBuy ou par CSV en quelques clics.',
    icon: Upload,
    color: 'from-purple-500 to-pink-500',
    action: 'Importer des produits',
    route: '/import',
    tips: ['Import par URL en un clic', 'Import CSV en masse', 'Déduplication automatique']
  },
  {
    id: 'optimize-ai',
    title: 'Optimisez avec l\'IA',
    description: 'Laissez l\'IA rédiger vos descriptions, optimiser vos prix et booster votre SEO.',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-500',
    action: 'Découvrir l\'IA',
    route: '/optimization',
    tips: ['Descriptions optimisées SEO', 'Pricing intelligent', 'Traductions multilingues']
  },
  {
    id: 'setup-fulfillment',
    title: 'Automatisez le fulfillment',
    description: 'Configurez la commande automatique chez vos fournisseurs et le tracking des colis.',
    icon: ShoppingCart,
    color: 'from-green-500 to-emerald-500',
    action: 'Configurer le fulfillment',
    route: '/auto-fulfillment',
    tips: ['Commande en 1-click', 'Tracking automatique', 'Multi-fournisseurs']
  },
  {
    id: 'monitor-analytics',
    title: 'Suivez vos performances',
    description: 'Accédez à vos analytics en temps réel, prédictions IA et rapports avancés.',
    icon: BarChart3,
    color: 'from-red-500 to-rose-500',
    action: 'Voir mes analytics',
    route: '/analytics',
    tips: ['Dashboard temps réel', 'Prédictions de ventes', 'Rapports exportables']
  }
]

export function WelcomeOnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY)
    if (!completed) {
      const timer = setTimeout(() => setIsOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsOpen(false)
  }

  const handleAction = (route: string) => {
    handleComplete()
    navigate(route)
  }

  const step = STEPS[currentStep]
  const progress = ((currentStep + 1) / STEPS.length) * 100
  const StepIcon = step.icon

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleComplete() }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0">
        {/* Header gradient */}
        <div className={cn("p-6 pb-8 bg-gradient-to-br text-white", step.color)}>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
              <Rocket className="h-3 w-3 mr-1" />
              Bienvenue sur ShopOpti+
            </Badge>
            <span className="text-sm text-white/80">{currentStep + 1}/{STEPS.length}</span>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <StepIcon className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">{step.title}</h2>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <Progress value={progress} className="h-1.5" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {step.tips.map((tip, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-1 rounded-full bg-primary/10">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm">{tip}</span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentStep < STEPS.length - 1) {
                    setCurrentStep(currentStep + 1)
                  } else {
                    handleComplete()
                  }
                }}
              >
                {currentStep === STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <Button 
              size="sm" 
              onClick={() => handleAction(step.route)}
              className={cn("bg-gradient-to-r text-white border-0", step.color)}
            >
              {step.action}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentStep ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <button 
            onClick={handleComplete}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Passer l'introduction
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
