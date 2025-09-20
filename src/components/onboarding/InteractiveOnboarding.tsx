import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Play,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Target,
  Zap,
  Users,
  Package,
  BarChart3,
  Settings
} from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  action: string
  route?: string
  completed: boolean
  animated?: boolean
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur DropCraft AI',
    description: 'Découvrez votre nouvelle plateforme e-commerce intelligente',
    icon: Sparkles,
    action: 'Commencer',
    completed: false,
    animated: true
  },
  {
    id: 'profile',
    title: 'Configurez votre profil',
    description: 'Personnalisez votre compte et vos préférences',
    icon: Users,
    action: 'Configurer',
    route: '/settings/profile',
    completed: false
  },
  {
    id: 'products',
    title: 'Ajoutez vos premiers produits',
    description: 'Importez votre catalogue ou créez vos premiers articles',
    icon: Package,
    action: 'Ajouter produits',
    route: '/products',
    completed: false
  },
  {
    id: 'automation',
    title: 'Configurez l\'automation',
    description: 'Automatisez vos tâches répétitives avec l\'IA',
    icon: Zap,
    action: 'Configurer',
    route: '/automation',
    completed: false
  },
  {
    id: 'analytics',
    title: 'Explorez les analytics',
    description: 'Découvrez vos insights et métriques business',
    icon: BarChart3,
    action: 'Explorer',
    route: '/analytics',
    completed: false
  }
]

export function InteractiveOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [steps, setSteps] = useState(onboardingSteps)
  const [isVisible, setIsVisible] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const { toast } = useToast()

  const totalSteps = steps.length
  const completedSteps = steps.filter(step => step.completed).length
  const progress = (completedSteps / totalSteps) * 100

  useEffect(() => {
    // Animation automatique pour l'étape de bienvenue
    if (currentStep === 0 && !isPlaying) {
      const timer = setTimeout(() => {
        setIsPlaying(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, isPlaying])

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ))
    
    toast({
      title: "Étape complétée !",
      description: "Vous progressez bien dans la configuration.",
    })

    if (currentStep < totalSteps - 1) {
      setTimeout(nextStep, 500)
    }
  }

  const skipOnboarding = () => {
    setIsVisible(false)
    toast({
      title: "Onboarding ignoré",
      description: "Vous pouvez toujours y accéder depuis les paramètres.",
    })
  }

  const currentStepData = steps[currentStep]

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <Card className="w-full max-w-2xl relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10"
            onClick={skipOnboarding}
          >
            <X className="h-4 w-4" />
          </Button>

          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={currentStepData.animated && isPlaying ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 360]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <currentStepData.icon className="h-12 w-12 text-primary" />
              </motion.div>
            </div>
            
            <CardTitle className="text-2xl mb-2">
              {currentStepData.title}
            </CardTitle>
            
            <p className="text-muted-foreground">
              {currentStepData.description}
            </p>

            <div className="flex items-center justify-center space-x-2 mt-4">
              <span className="text-sm text-muted-foreground">
                Étape {currentStep + 1} sur {totalSteps}
              </span>
              <Badge variant="secondary">
                {Math.round(progress)}% complété
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Progress value={progress} className="h-2" />

            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {currentStep === 0 && (
                <div className="text-center space-y-4">
                  <motion.div
                    animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <p className="text-lg">
                      🎉 Félicitations ! Votre plateforme est prête.
                    </p>
                  </motion.div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-medium">IA Intégrée</p>
                      <p className="text-sm text-muted-foreground">
                        Automation intelligente
                      </p>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-medium">Performance</p>
                      <p className="text-sm text-muted-foreground">
                        Optimisé pour le mobile
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Ce que vous allez faire :</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {currentStep === 1 && (
                        <>
                          <li>• Renseigner vos informations business</li>
                          <li>• Configurer vos préférences</li>
                          <li>• Choisir votre thème</li>
                        </>
                      )}
                      {currentStep === 2 && (
                        <>
                          <li>• Importer votre catalogue existant</li>
                          <li>• Créer vos premiers produits</li>
                          <li>• Configurer les catégories</li>
                        </>
                      )}
                      {currentStep === 3 && (
                        <>
                          <li>• Activer les règles d'automation</li>
                          <li>• Configurer les alertes IA</li>
                          <li>• Paramétrer les workflows</li>
                        </>
                      )}
                      {currentStep === 4 && (
                        <>
                          <li>• Explorer le dashboard analytics</li>
                          <li>• Comprendre vos métriques</li>
                          <li>• Configurer les rapports</li>
                        </>
                      )}
                    </ul>
                  </div>

                  {currentStepData.completed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center space-x-2 text-green-600"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Étape complétée !</span>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>

            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              <div className="flex space-x-2">
                {currentStep < totalSteps - 1 ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => completeStep(currentStepData.id)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {currentStepData.action}
                    </Button>
                    <Button onClick={nextStep}>
                      Suivant
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <Button onClick={skipOnboarding} className="bg-gradient-to-r from-primary to-primary/80">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Terminer l'onboarding
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}