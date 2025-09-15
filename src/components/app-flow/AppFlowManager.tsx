import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { usePlan } from '@/contexts/PlanContext'
import { logWarning } from '@/utils/consoleCleanup'

interface AppFlowStep {
  id: string
  title: string
  description: string
  route: string
  completed: boolean
  required: boolean
  planRequired?: 'standard' | 'pro' | 'ultra_pro'
  dependencies?: string[]
  estimatedTime?: number
  category: 'setup' | 'marketing' | 'optimization' | 'advanced'
}

interface AppFlowContext {
  currentFlow: string | null
  availableFlows: { [key: string]: AppFlowStep[] }
  currentStep: AppFlowStep | null
  progress: number
  startFlow: (flowId: string) => void
  nextStep: () => void
  previousStep: () => void
  completeStep: (stepId: string) => void
  skipStep: (stepId: string) => void
  resetFlow: () => void
  getRecommendedNextSteps: () => AppFlowStep[]
  isFlowCompleted: (flowId: string) => boolean
}

const AppFlowContext = createContext<AppFlowContext | null>(null)

// Définition des flux d'application
const APP_FLOWS: { [key: string]: AppFlowStep[] } = {
  onboarding: [
    {
      id: 'welcome',
      title: 'Bienvenue',
      description: 'Configuration initiale de votre compte',
      route: '/dashboard',
      completed: false,
      required: true,
      estimatedTime: 2,
      category: 'setup'
    },
    {
      id: 'profile',
      title: 'Profil utilisateur',
      description: 'Complétez vos informations',
      route: '/settings',
      completed: false,
      required: true,
      dependencies: ['welcome'],
      estimatedTime: 3,
      category: 'setup'
    },
    {
      id: 'first-integration',
      title: 'Première intégration',
      description: 'Connectez votre première plateforme',
      route: '/integrations',
      completed: false,
      required: true,
      dependencies: ['profile'],
      estimatedTime: 5,
      category: 'setup'
    },
    {
      id: 'import-products',
      title: 'Import de produits',
      description: 'Importez vos premiers produits',
      route: '/import',
      completed: false,
      required: true,
      dependencies: ['first-integration'],
      estimatedTime: 10,
      category: 'setup'
    }
  ],
  
  marketing_flow: [
    {
      id: 'marketing-setup',
      title: 'Configuration marketing',
      description: 'Paramétrez vos outils marketing',
      route: '/marketing',
      completed: false,
      required: true,
      estimatedTime: 5,
      category: 'marketing'
    },
    {
      id: 'first-campaign',
      title: 'Première campagne',
      description: 'Créez votre première campagne',
      route: '/marketing/create',
      completed: false,
      required: true,
      dependencies: ['marketing-setup'],
      estimatedTime: 15,
      category: 'marketing'
    },
    {
      id: 'campaign-optimization',
      title: 'Optimisation des campagnes',
      description: 'Optimisez vos campagnes avec l\'IA',
      route: '/marketing/analytics',
      completed: false,
      required: false,
      dependencies: ['first-campaign'],
      estimatedTime: 10,
      category: 'marketing'
    },
    {
      id: 'advanced-marketing',
      title: 'Marketing avancé',
      description: 'Fonctionnalités marketing Pro',
      route: '/marketing/create-advanced',
      completed: false,
      required: false,
      planRequired: 'pro',
      dependencies: ['campaign-optimization'],
      estimatedTime: 20,
      category: 'marketing'
    }
  ],

  automation_flow: [
    {
      id: 'automation-intro',
      title: 'Introduction à l\'automation',
      description: 'Découvrez les outils d\'automatisation',
      route: '/automation',
      completed: false,
      required: true,
      planRequired: 'pro',
      estimatedTime: 5,
      category: 'optimization'
    },
    {
      id: 'first-automation',
      title: 'Première règle d\'automation',
      description: 'Créez votre première règle automatique',
      route: '/automation-optimization',
      completed: false,
      required: true,
      planRequired: 'pro',
      dependencies: ['automation-intro'],
      estimatedTime: 15,
      category: 'optimization'
    },
    {
      id: 'ai-optimization',
      title: 'Optimisation IA',
      description: 'Activez l\'optimisation par IA',
      route: '/automation-optimization',
      completed: false,
      required: false,
      planRequired: 'ultra_pro',
      dependencies: ['first-automation'],
      estimatedTime: 10,
      category: 'advanced'
    }
  ],

  advanced_flow: [
    {
      id: 'advanced-analytics',
      title: 'Analytics avancés',
      description: 'Configurez les analytics avancés',
      route: '/analytics-enterprise',
      completed: false,
      required: false,
      planRequired: 'ultra_pro',
      estimatedTime: 15,
      category: 'advanced'
    },
    {
      id: 'business-intelligence',
      title: 'Business Intelligence',
      description: 'Activez l\'intelligence d\'affaires',
      route: '/business-intelligence',
      completed: false,
      required: false,
      planRequired: 'ultra_pro',
      dependencies: ['advanced-analytics'],
      estimatedTime: 20,
      category: 'advanced'
    }
  ]
}

export function AppFlowProvider({ children }: { children: React.ReactNode }) {
  const [currentFlow, setCurrentFlow] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { plan } = usePlan()

  // Charger l'état depuis localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`app-flow-${user.id}`)
      if (saved) {
        try {
          const { flow, completed, stepIndex } = JSON.parse(saved)
          setCurrentFlow(flow)
          setCompletedSteps(new Set(completed))
          setCurrentStepIndex(stepIndex)
        } catch (error) {
          logWarning('Erreur lors du chargement du flux', 'AppFlowManager')
        }
      }
    }
  }, [user])

  // Sauvegarder l'état dans localStorage
  const saveState = useCallback(() => {
    if (user && currentFlow) {
      localStorage.setItem(`app-flow-${user.id}`, JSON.stringify({
        flow: currentFlow,
        completed: Array.from(completedSteps),
        stepIndex: currentStepIndex
      }))
    }
  }, [user, currentFlow, completedSteps, currentStepIndex])

  useEffect(() => {
    saveState()
  }, [saveState])

  const getCurrentStep = (): AppFlowStep | null => {
    if (!currentFlow || !APP_FLOWS[currentFlow]) return null
    return APP_FLOWS[currentFlow][currentStepIndex] || null
  }

  const getProgress = (): number => {
    if (!currentFlow || !APP_FLOWS[currentFlow]) return 0
    const flow = APP_FLOWS[currentFlow]
    const completed = flow.filter(step => completedSteps.has(step.id)).length
    return Math.round((completed / flow.length) * 100)
  }

  const canAccessStep = (step: AppFlowStep): boolean => {
    // Vérifier le plan requis
    if (step.planRequired) {
      const planLevels = { standard: 0, pro: 1, ultra_pro: 2 }
      const userLevel = planLevels[plan as keyof typeof planLevels] || 0
      const requiredLevel = planLevels[step.planRequired]
      if (userLevel < requiredLevel) return false
    }

    // Vérifier les dépendances
    if (step.dependencies) {
      return step.dependencies.every(dep => completedSteps.has(dep))
    }

    return true
  }

  const startFlow = (flowId: string) => {
    if (!APP_FLOWS[flowId]) {
      toast.error('Flux non trouvé')
      return
    }

    setCurrentFlow(flowId)
    setCurrentStepIndex(0)
    toast.success(`Flux "${flowId}" démarré`)
  }

  const nextStep = () => {
    if (!currentFlow || !APP_FLOWS[currentFlow]) return

    const flow = APP_FLOWS[currentFlow]
    const nextIndex = currentStepIndex + 1

    if (nextIndex < flow.length) {
      const nextStep = flow[nextIndex]
      if (canAccessStep(nextStep)) {
        setCurrentStepIndex(nextIndex)
        navigate(nextStep.route)
      } else {
        toast.warning('Étape non accessible - Vérifiez vos prérequis')
      }
    } else {
      toast.success('Flux terminé!')
      setCurrentFlow(null)
    }
  }

  const previousStep = () => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1
      setCurrentStepIndex(newIndex)
      
      if (currentFlow && APP_FLOWS[currentFlow]) {
        const prevStep = APP_FLOWS[currentFlow][newIndex]
        navigate(prevStep.route)
      }
    }
  }

  const completeStep = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]))
    toast.success('Étape terminée!')
    
    // Auto-progression vers l'étape suivante
    setTimeout(() => {
      nextStep()
    }, 1000)
  }

  const skipStep = (stepId: string) => {
    if (!currentFlow || !APP_FLOWS[currentFlow]) return
    
    const step = APP_FLOWS[currentFlow].find(s => s.id === stepId)
    if (step && !step.required) {
      toast.info('Étape ignorée')
      nextStep()
    } else {
      toast.warning('Cette étape ne peut pas être ignorée')
    }
  }

  const resetFlow = () => {
    setCurrentFlow(null)
    setCompletedSteps(new Set())
    setCurrentStepIndex(0)
    if (user) {
      localStorage.removeItem(`app-flow-${user.id}`)
    }
    toast.info('Flux réinitialisé')
  }

  const getRecommendedNextSteps = (): AppFlowStep[] => {
    const allSteps = Object.values(APP_FLOWS).flat()
    return allSteps
      .filter(step => 
        !completedSteps.has(step.id) && 
        canAccessStep(step) && 
        (!step.dependencies || step.dependencies.every(dep => completedSteps.has(dep)))
      )
      .slice(0, 3)
  }

  const isFlowCompleted = (flowId: string): boolean => {
    if (!APP_FLOWS[flowId]) return false
    return APP_FLOWS[flowId].every(step => completedSteps.has(step.id))
  }

  const contextValue: AppFlowContext = {
    currentFlow,
    availableFlows: APP_FLOWS,
    currentStep: getCurrentStep(),
    progress: getProgress(),
    startFlow,
    nextStep,
    previousStep,
    completeStep,
    skipStep,
    resetFlow,
    getRecommendedNextSteps,
    isFlowCompleted
  }

  return (
    <AppFlowContext.Provider value={contextValue}>
      {children}
    </AppFlowContext.Provider>
  )
}

export const useAppFlow = () => {
  const context = useContext(AppFlowContext)
  if (!context) {
    throw new Error('useAppFlow must be used within AppFlowProvider')
  }
  return context
}

// Composant d'aide contextuelle
export const FlowHelper = () => {
  const { currentStep, nextStep, previousStep, completeStep, skipStep } = useAppFlow()
  
  if (!currentStep) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-card border rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-sm">{currentStep.title}</h4>
            <p className="text-xs text-muted-foreground">{currentStep.description}</p>
            {currentStep.estimatedTime && (
              <p className="text-xs text-primary mt-1">
                ⏱️ {currentStep.estimatedTime} min
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {!currentStep.required && (
            <button 
              onClick={() => skipStep(currentStep.id)}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
            >
              Ignorer
            </button>
          )}
          <button 
            onClick={() => completeStep(currentStep.id)}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Terminer
          </button>
        </div>
      </div>
    </div>
  )
}

// Export components separately
export { FlowProgressIndicator, RecommendedFlows } from './FlowProgressIndicator'