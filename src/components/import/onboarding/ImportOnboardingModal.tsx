/**
 * Modal d'onboarding pour guider les nouveaux utilisateurs
 * sur les fonctionnalités du Hub Import
 */
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Rocket,
  FileSpreadsheet,
  Layers,
  Chrome,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Calculator,
  Store,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue dans le Hub Import',
    description: 'Importez vos produits depuis n\'importe quelle source en quelques clics. Découvrons ensemble les fonctionnalités principales.',
    icon: Sparkles,
    features: [
      'Import depuis 8+ plateformes',
      'Optimisation IA automatique',
      'Synchronisation multi-boutiques',
    ],
    color: 'from-primary to-purple-600',
  },
  {
    id: 'quick-import',
    title: 'Import Rapide par URL',
    description: 'Collez simplement l\'URL d\'un produit AliExpress, Amazon, Temu ou autre, et importez-le instantanément.',
    icon: Rocket,
    features: [
      'Extraction automatique des données',
      'Images haute résolution',
      'Variantes et options détectées',
    ],
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'bulk-import',
    title: 'Import en Masse',
    description: 'Importez des centaines de produits simultanément via CSV, Excel ou liste d\'URLs.',
    icon: Layers,
    features: [
      'Jusqu\'à 500 produits par lot',
      'Mapping intelligent des colonnes',
      'Validation avant import',
    ],
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'extension',
    title: 'Extension Chrome ShopOpti+',
    description: 'Importez directement depuis votre navigateur en naviguant sur vos sites fournisseurs.',
    icon: Chrome,
    features: [
      'Import en 1 clic',
      'Bouton sur toutes les pages produits',
      'Synchronisation temps réel',
    ],
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'cost-analysis',
    title: 'Analyse des Coûts et Marges',
    description: 'Calculez automatiquement vos marges nettes en tenant compte de tous les frais.',
    icon: Calculator,
    features: [
      'Prix fournisseur + livraison',
      'Commissions plateforme (Stripe, Shopify)',
      'TVA et marge nette estimée',
    ],
    color: 'from-green-500 to-emerald-600',
  },
];

interface ImportOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function ImportOnboardingModal({
  open,
  onOpenChange,
  onComplete,
}: ImportOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('shopopti_import_onboarding_completed', 'true');
    onComplete();
    onOpenChange(false);
  };

  const handleSkip = () => {
    localStorage.setItem('shopopti_import_onboarding_completed', 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              Étape {currentStep + 1} sur {onboardingSteps.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground text-xs"
            >
              Passer l'introduction
            </Button>
          </div>
          <Progress value={progress} className="h-1.5 mb-4" />
        </DialogHeader>

        <div className="text-center py-4">
          {/* Icon with gradient background */}
          <div
            className={cn(
              'w-20 h-20 rounded-2xl bg-gradient-to-br mx-auto mb-6 flex items-center justify-center',
              step.color
            )}
          >
            <step.icon className="w-10 h-10 text-white" />
          </div>

          <DialogTitle className="text-xl mb-3">{step.title}</DialogTitle>
          <DialogDescription className="text-base mb-6">
            {step.description}
          </DialogDescription>

          {/* Features list */}
          <div className="space-y-3 text-left bg-muted/50 rounded-xl p-4">
            {step.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={cn(currentStep === 0 && 'invisible')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          <div className="flex gap-1.5">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            ))}
          </div>

          <Button onClick={handleNext}>
            {currentStep === onboardingSteps.length - 1 ? (
              <>
                Commencer
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook pour gérer l'affichage de l'onboarding
export function useImportOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('shopopti_import_onboarding_completed');
    if (!completed) {
      // Délai court pour laisser la page se charger
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem('shopopti_import_onboarding_completed');
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    setShowOnboarding,
    resetOnboarding,
  };
}
