/**
 * Step Indicator - Channable Premium Design
 * Visual progress indicator for connection flow
 */

import { motion } from 'framer-motion'
import { Check, Key, Settings, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'select' | 'credentials' | 'configure' | 'confirm'

const STEPS = [
  { id: 'credentials', label: 'Identifiants', icon: Key },
  { id: 'configure', label: 'Configuration', icon: Settings },
  { id: 'confirm', label: 'Confirmation', icon: Shield },
] as const

interface StepIndicatorProps {
  currentStep: Step
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const stepOrder = ['credentials', 'configure', 'confirm']
  const currentIndex = stepOrder.indexOf(currentStep)
  
  return (
    <div className="relative">
      {/* Background line */}
      <div className="absolute top-5 left-8 right-8 h-0.5 bg-border" />
      
      {/* Progress line */}
      <motion.div 
        className="absolute top-5 left-8 h-0.5 bg-gradient-to-r from-primary to-primary/80"
        initial={{ width: '0%' }}
        animate={{ 
          width: currentIndex === 0 ? '0%' : currentIndex === 1 ? '50%' : '100%' 
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{ maxWidth: 'calc(100% - 64px)' }}
      />
      
      <div className="relative flex justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isCompleted = currentIndex > index
          const isCurrent = currentStep === step.id
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <motion.div 
                className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  "border-2 backdrop-blur-sm",
                  isCompleted && "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30",
                  isCurrent && "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/20",
                  !isCompleted && !isCurrent && "bg-card border-border text-muted-foreground"
                )}
                animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Check className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                
                {/* Pulse effect for current step */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              <span className={cn(
                "text-xs font-medium transition-colors",
                isCurrent && "text-primary",
                isCompleted && "text-foreground",
                !isCompleted && !isCurrent && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
