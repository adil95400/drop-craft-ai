import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { id: 1, title: 'Bienvenue', description: 'Configurons votre compte' },
  { id: 2, title: 'Informations', description: 'Parlez-nous de votre entreprise' },
  { id: 3, title: 'Préférences', description: 'Personnalisez votre expérience' }
];

export const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleComplete = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Configuration terminée',
        description: 'Bienvenue sur votre tableau de bord!'
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <Progress value={progress} className="mb-8" />
        
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold">{STEPS[currentStep - 1].title}</h2>
            <p className="text-muted-foreground">{STEPS[currentStep - 1].description}</p>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Précédent
            </Button>
            
            {currentStep === STEPS.length ? (
              <Button onClick={handleComplete} disabled={loading}>
                Terminer
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Suivant
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
