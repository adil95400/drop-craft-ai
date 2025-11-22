import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, ArrowRight, Store, Package, Zap, Search, CreditCard } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePlan } from '@/contexts/PlanContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  completed: boolean
  action?: string
  route?: string
  planRequired?: 'pro' | 'ultra_pro'
}

export const OnboardingChecklist = () => {
  const { user } = useAuth()
  const { currentPlan, hasFeature } = usePlan()
  const navigate = useNavigate()
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [completionRate, setCompletionRate] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const initializeSteps = async () => {
    // Check completion status from database
    const [integrationsResult, suppliersResult, importsResult] = await Promise.all([
      supabase.from('integrations').select('count').eq('user_id', user?.id).eq('is_active', true),
      supabase.from('suppliers').select('count').eq('user_id', user?.id).eq('status', 'active'), 
      supabase.from('imported_products').select('count').eq('user_id', user?.id).limit(1)
    ])

    const hasIntegrations = (integrationsResult.count || 0) > 0
    const hasSuppliers = (suppliersResult.count || 0) > 0 
    const hasProducts = (importsResult.count || 0) > 0

    const stepsList: OnboardingStep[] = [
      {
        id: 'plan',
        title: 'Choisir un plan',
        description: 'Sélectionnez le plan qui correspond à vos besoins',
        icon: CreditCard,
        completed: currentPlan !== 'free',
        action: 'Voir les plans',
        route: '/pricing'
      },
      {
        id: 'integration',
        title: 'Connecter une boutique',
        description: 'Connectez Shopify, WooCommerce ou PrestaShop',
        icon: Store,
        completed: hasIntegrations,
        action: 'Connecter',
        route: '/integrations'
      },
      {
        id: 'supplier',
        title: 'Ajouter un fournisseur',
        description: 'Connectez BigBuy, Cdiscount Pro ou un autre fournisseur',
        icon: Package,
        completed: hasSuppliers,
        action: 'Gérer les fournisseurs',
        route: '/suppliers',
        planRequired: 'pro'
      },
      {
        id: 'import',
        title: 'Importer des produits',
        description: 'Importez vos premiers produits depuis vos fournisseurs',
        icon: Zap,
        completed: hasProducts,
        action: 'Importer',
        route: '/import',
        planRequired: 'pro'
      },
      {
        id: 'seo',
        title: 'Optimiser le SEO',
        description: 'Configurez l\'optimisation SEO automatique',
        icon: Search,
        completed: false,
        action: 'Configurer SEO',
        route: '/seo',
        planRequired: 'ultra_pro'
      }
    ]

    setSteps(stepsList)

    const completed = stepsList.filter(step => step.completed).length
    setCompletionRate((completed / stepsList.length) * 100)

    if (completed >= 4) {
      setIsVisible(false)
    }
  }

  useEffect(() => {
    if (user) {
      initializeSteps()
    }
  }, [user, currentPlan])

  const handleStepAction = (step: OnboardingStep) => {
    if (step.planRequired && !hasFeature('ai-analysis')) {
      navigate('/pricing')
      return
    }
    
    if (step.route) {
      navigate(step.route)
    }
  }

  const dismissChecklist = async () => {
    setIsVisible(false)
    if (user?.id) {
      localStorage.setItem(`onboarding-dismissed-${user.id}`, 'true')
    }
  }

  if (!isVisible || !user || completionRate === 100) {
    return null
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Guide de démarrage
            </CardTitle>
            <CardDescription>
              Configurez votre plateforme e-commerce en quelques étapes
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={dismissChecklist}>
            ×
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progression</span>
            <span>{Math.round(completionRate)}% complété</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const IconComponent = step.icon
          const isLocked = step.planRequired && !hasFeature('ai-analysis')
          
          return (
            <div
              key={step.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                step.completed 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                  : isLocked
                  ? 'bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-700'
                  : 'bg-white border-gray-200 hover:border-primary/30 dark:bg-gray-900 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
                <IconComponent className={`h-5 w-5 ${
                  step.completed ? 'text-green-600' : isLocked ? 'text-gray-400' : 'text-primary'
                }`} />
                <div>
                  <h4 className={`font-medium ${
                    step.completed ? 'text-green-800 dark:text-green-300' : 
                    isLocked ? 'text-gray-500' : 'text-foreground'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-sm ${
                    step.completed ? 'text-green-600 dark:text-green-400' : 
                    isLocked ? 'text-gray-400' : 'text-muted-foreground'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {step.planRequired && (
                  <Badge variant="secondary" className="text-xs">
                    {step.planRequired === 'pro' ? 'Pro' : 'Ultra Pro'}
                  </Badge>
                )}
                {!step.completed && step.action && (
                  <Button
                    size="sm"
                    variant={isLocked ? "outline" : "default"}
                    onClick={() => handleStepAction(step)}
                    className="ml-2"
                  >
                    {isLocked ? 'Upgrade' : step.action}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
                {step.completed && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Terminé
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}