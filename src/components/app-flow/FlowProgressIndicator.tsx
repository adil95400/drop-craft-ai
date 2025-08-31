import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  Circle,
  Zap,
  ArrowRight,
  X
} from 'lucide-react'
import { useAppFlow } from './AppFlowManager'
import { toast } from 'sonner'

export const FlowProgressIndicator = () => {
  const { 
    currentFlow, 
    currentStep, 
    progress, 
    availableFlows, 
    nextStep, 
    previousStep, 
    completeStep, 
    skipStep,
    resetFlow 
  } = useAppFlow()

  if (!currentFlow || !currentStep) return null

  const flowSteps = availableFlows[currentFlow] || []
  const currentStepIndex = flowSteps.findIndex(step => step.id === currentStep.id)

  return (
    <Card className="fixed top-20 right-4 w-80 z-40 border-primary/20 bg-card/95 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Progression du flux</h3>
            <p className="text-xs text-muted-foreground capitalize">{currentFlow}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFlow}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">
              Étape {currentStepIndex + 1} sur {flowSteps.length}
            </span>
            <Badge variant="secondary" className="text-xs">
              {progress}%
            </Badge>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Current step */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Circle className="h-4 w-4 text-primary fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{currentStep.title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {currentStep.description}
              </p>
              {currentStep.estimatedTime && (
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    ~{currentStep.estimatedTime} min
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step list preview */}
        <div className="max-h-32 overflow-y-auto space-y-2">
          {flowSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isNext = index === currentStepIndex + 1
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-2 text-xs p-1 rounded ${
                  isCurrent ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="h-3 w-3 text-green-500 fill-current" />
                  ) : isCurrent ? (
                    <Circle className="h-3 w-3 text-primary fill-current" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/40" />
                  )}
                </div>
                <span 
                  className={`flex-1 truncate ${
                    isCompleted 
                      ? 'text-green-600 line-through' 
                      : isCurrent 
                        ? 'text-foreground font-medium' 
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
                {isNext && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {!currentStep.required && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skipStep(currentStep.id)}
              className="flex-1 text-xs h-8"
            >
              Ignorer
            </Button>
          )}
          <Button
            onClick={() => completeStep(currentStep.id)}
            size="sm"
            className="flex-1 text-xs h-8"
          >
            <Zap className="h-3 w-3 mr-1" />
            Terminer
          </Button>
        </div>

        {/* Quick actions */}
        <div className="flex text-xs text-muted-foreground justify-between">
          <button 
            onClick={previousStep}
            disabled={currentStepIndex === 0}
            className="hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <button 
            onClick={nextStep}
            disabled={currentStepIndex === flowSteps.length - 1}
            className="hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour afficher les flux recommandés
export const RecommendedFlows = () => {
  const { startFlow, getRecommendedNextSteps, isFlowCompleted } = useAppFlow()
  const recommendedSteps = getRecommendedNextSteps()

  if (recommendedSteps.length === 0) return null

  const flowMap: { [key: string]: string } = {
    '/dashboard': 'onboarding',
    '/marketing': 'marketing_flow',
    '/automation': 'automation_flow',
    '/automation-optimization': 'automation_flow',
    '/analytics-enterprise': 'advanced_flow'
  }

  const recommendedFlows = [...new Set(
    recommendedSteps.map(step => flowMap[step.route]).filter(Boolean)
  )]

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-blue-600" />
          <h3 className="font-medium text-sm">Flux recommandés</h3>
        </div>
        
        <div className="space-y-2">
          {recommendedFlows.slice(0, 2).map((flowId) => (
            <div key={flowId} className="flex items-center justify-between p-2 rounded-lg bg-white/60 border border-blue-200/50">
              <div>
                <p className="font-medium text-sm capitalize">{flowId.replace('_', ' ')}</p>
                <p className="text-xs text-muted-foreground">
                  {recommendedSteps.find(step => flowMap[step.route] === flowId)?.description}
                </p>
              </div>
              <Button
                onClick={() => {
                  startFlow(flowId)
                  toast.success(`Flux ${flowId} démarré!`)
                }}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Démarrer
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default FlowProgressIndicator