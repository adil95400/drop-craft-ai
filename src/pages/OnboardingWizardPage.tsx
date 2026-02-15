/**
 * Sprint 7: Onboarding Wizard — Main Page
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useOnboardingPersistence } from '@/hooks/useOnboardingPersistence';
import OnboardingStepWelcome from '@/components/onboarding/OnboardingStepWelcome';
import OnboardingStepPlatform from '@/components/onboarding/OnboardingStepPlatform';
import OnboardingStepImport from '@/components/onboarding/OnboardingStepImport';
import OnboardingStepComplete from '@/components/onboarding/OnboardingStepComplete';
import { Progress } from '@/components/ui/progress';
import { Helmet } from 'react-helmet-async';

const STEPS = [
  { id: 1, label: 'Bienvenue' },
  { id: 2, label: 'Plateforme' },
  { id: 3, label: 'Import' },
  { id: 4, label: 'Terminé' },
];

export default function OnboardingWizardPage() {
  const { currentStep, completedSteps } = useOnboardingStore();
  const { isLoading, hasCompleted, save } = useOnboardingPersistence();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && hasCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, hasCompleted, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <OnboardingStepWelcome onSave={save} />;
      case 2: return <OnboardingStepPlatform onSave={save} />;
      case 3: return <OnboardingStepImport onSave={save} />;
      case 4: return <OnboardingStepComplete onSave={save} />;
      default: return <OnboardingStepWelcome onSave={save} />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Configuration | ShopOpti</title>
        <meta name="description" content="Configurez votre boutique en quelques étapes" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold">Configuration de votre boutique</h1>
              <span className="text-sm text-muted-foreground">
                Étape {currentStep} / {STEPS.length}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between mt-2">
              {STEPS.map((step) => (
                <span
                  key={step.id}
                  className={`text-xs ${
                    step.id === currentStep
                      ? 'text-primary font-medium'
                      : completedSteps.includes(step.id)
                      ? 'text-primary/60'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">{renderStep()}</div>
        </div>
      </div>
    </>
  );
}
