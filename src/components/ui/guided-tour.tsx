import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TourStep {
  target: string
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  action?: () => void
}

interface GuidedTourProps {
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export function GuidedTour({ steps, isOpen, onClose, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const step = steps[currentStep]
    const element = document.querySelector(step.target) as HTMLElement
    
    if (element) {
      setHighlightedElement(element)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentStep, steps, isOpen])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      steps[currentStep].action?.()
    } else {
      onComplete?.()
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!isOpen) return null

  const step = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <AnimatePresence>
      {highlightedElement && (
        <>
          {/* Overlay with spotlight effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          {/* Highlighted element spotlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: highlightedElement.offsetTop - 4,
              left: highlightedElement.offsetLeft - 4,
              width: highlightedElement.offsetWidth + 8,
              height: highlightedElement.offsetHeight + 8,
              boxShadow: '0 0 0 4px hsl(var(--primary) / 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
            }}
          />

          {/* Tour card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed z-[10000]"
            style={{
              top: highlightedElement.offsetTop + highlightedElement.offsetHeight + 16,
              left: highlightedElement.offsetLeft,
              maxWidth: '400px',
            }}
          >
            <Card className="shadow-elegant border-2 border-primary/20">
              <CardContent className="p-6">
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      Étape {currentStep + 1} sur {steps.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={onClose}
                      aria-label="Fermer le guide"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.content}</p>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    aria-label="Étape précédente"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Précédent
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="bg-gradient-primary"
                    aria-label={currentStep === steps.length - 1 ? "Terminer le guide" : "Étape suivante"}
                  >
                    {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}