import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { 
  CheckCircle, 
  Circle, 
  Crown, 
  Users, 
  Package, 
  Settings, 
  Zap,
  ArrowRight,
  X
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  action?: () => void
  route?: string
  isPremium?: boolean
}

export function OnboardingWizard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(true)
  const [steps, setSteps] = useState<OnboardingStep[]>([])

  useEffect(() => {
    if (!user) return

    const initializeSteps = async () => {
      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'profile',
          title: 'Compléter le profil',
          description: 'Ajoutez vos informations pour personnaliser l\'expérience',
          icon: <Users className="w-5 h-5" />,
          completed: !!user.user_metadata?.full_name,
          route: '/settings'
        },
        {
          id: 'first_product',
          title: 'Ajouter un produit',
          description: 'Importez ou créez votre premier produit',
          icon: <Package className="w-5 h-5" />,
          completed: false,
          route: '/products'
        },
        {
          id: 'supplier',
          title: 'Connecter un fournisseur',
          description: 'Reliez votre premier fournisseur pour automatiser les imports',
          icon: <Settings className="w-5 h-5" />,
          completed: false,
          route: '/suppliers',
          isPremium: true
        },
        {
          id: 'automation',
          title: 'Créer une automation',
          description: 'Automatisez vos tâches répétitives avec l\'IA',
          icon: <Zap className="w-5 h-5" />,
          completed: false,
          route: '/automations',
          isPremium: true
        },
        {
          id: 'upgrade',
          title: 'Découvrir Pro',
          description: 'Débloquez toutes les fonctionnalités avancées',
          icon: <Crown className="w-5 h-5" />,
          completed: false,
          route: '/pricing',
          isPremium: true
        }
      ]

      setSteps(onboardingSteps)
    }

    initializeSteps()
  }, [user])

  const completedSteps = steps.filter(step => step.completed).length
  const totalSteps = steps.length
  const progress = (completedSteps / totalSteps) * 100

  const handleStepAction = (step: OnboardingStep) => {
    if (step.route) {
      navigate(step.route)
    }
    
    if (step.action) {
      step.action()
    }
  }

  const dismissOnboarding = () => {
    setIsVisible(false)
    toast({
      title: "Onboarding masqué",
      description: "Vous pouvez toujours accéder aux fonctionnalités depuis le menu principal.",
    })
  }

  if (!isVisible || !user || completedSteps === totalSteps) {
    return null
  }

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Commencez votre aventure
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Configurez votre plateforme en quelques étapes simples
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissOnboarding}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{completedSteps} / {totalSteps} étapes terminées</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
              step.completed 
                ? 'bg-success/10 border border-success/20' 
                : 'bg-muted/50 hover:bg-muted/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 ${step.completed ? 'text-success' : 'text-muted-foreground'}`}>
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className={step.completed ? 'text-success' : 'text-foreground'}>
                  {step.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium text-sm ${
                      step.completed ? 'text-success line-through' : 'text-foreground'
                    }`}>
                      {step.title}
                    </h4>
                    {step.isPremium && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Pro
                      </Badge>
                    )}
                  </div>
                  <p className={`text-xs ${
                    step.completed ? 'text-success/70' : 'text-muted-foreground'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
            
            {!step.completed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStepAction(step)}
                className="flex-shrink-0 h-8 px-3"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        
        <div className="pt-3 border-t">
          <Button
            onClick={() => navigate('/pricing')}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            <Crown className="w-4 h-4 mr-2" />
            Découvrir les plans Premium
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}